import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Order, IOrder } from "../models/Order.js";
import { Book, IBook } from "../models/Book.js";
import { Customer } from "../models/Customer.js";
import { PurchasedBook, IPurchasedBook } from "../models/PurchasedBook.js";
import { uploadDir } from "../middleware/upload.js";
import { logger } from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ebooksDir = path.resolve(uploadDir, "ebooks");
if (!fs.existsSync(ebooksDir)) {
  fs.mkdirSync(ebooksDir, { recursive: true });
}

const OrderModel = Order as any;
const BookModel = Book as any;
const CustomerModel = Customer as any;
const PurchasedBookModel = PurchasedBook as any;

/**
 * Checks if a format string denotes an e-book / digital edition
 */
export function isEbookFormat(format?: string): boolean {
  if (!format) return false;
  const f = format.toLowerCase().trim();
  return (
    f.includes("ebook") ||
    f.includes("e-book") ||
    f.includes("kindle") ||
    f.includes("digital") ||
    f.includes("soft copy") ||
    f.includes("pdf")
  );
}

/**
 * Resolves the physical path of a book's PDF on disk
 */
export function resolveBookPdfFile(pdfUrlOrSlug: string, book?: IBook | null): {
  filePath: string | null;
  exists: boolean;
  filename: string;
} {
  const candidateFilenames: string[] = [];

  if (pdfUrlOrSlug) {
    candidateFilenames.push(path.basename(pdfUrlOrSlug));
  }
  if (book?.pdfUrl) {
    candidateFilenames.push(path.basename(book.pdfUrl));
  }
  if (book?.slug) {
    candidateFilenames.push(`${book.slug}.pdf`);
  }
  if (pdfUrlOrSlug && !pdfUrlOrSlug.includes("/") && !pdfUrlOrSlug.includes("\\")) {
    candidateFilenames.push(pdfUrlOrSlug.endsWith(".pdf") ? pdfUrlOrSlug : `${pdfUrlOrSlug}.pdf`);
  }

  // Deduplicate
  const uniqueFilenames = Array.from(new Set(candidateFilenames.filter(Boolean)));

  const searchDirs = [
    ebooksDir,
    uploadDir,
    path.resolve(process.cwd(), "uploads", "ebooks"),
    path.resolve(process.cwd(), "uploads"),
    path.resolve(process.cwd(), "../frontend/public/ebooks"),
  ];

  for (const filename of uniqueFilenames) {
    for (const dir of searchDirs) {
      const fullPath = path.resolve(dir, filename);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        return {
          filePath: fullPath,
          exists: true,
          filename,
        };
      }
    }
  }

  return {
    filePath: null,
    exists: false,
    filename: uniqueFilenames[0] || "ebook.pdf",
  };
}

/**
 * Automatically assigns purchased e-books to the customer account upon payment confirmation.
 * Strictly idempotent: prevents duplicate book assignments if payment webhooks or confirmation
 * requests are processed multiple times (Requirement 8).
 */
export async function assignEbooksForOrder(orderOrId: string | IOrder): Promise<IPurchasedBook[]> {
  const order: IOrder | null =
    typeof orderOrId === "string"
      ? await OrderModel.findById(orderOrId)
      : orderOrId;

  if (!order) {
    logger.warn({ orderOrId }, "Cannot assign e-books: Order not found");
    return [];
  }

  // Verify order is paid
  const isPaid =
    order.paymentStatus === "PAID" ||
    order.orderStatus === "PAYMENT_CONFIRMED" ||
    order.orderStatus === "PROCESSING" ||
    order.orderStatus === "SHIPPED" ||
    order.orderStatus === "DELIVERED";

  if (!isPaid) {
    logger.info({ orderNumber: order.orderNumber, status: order.paymentStatus }, "Order is not paid; skipping e-book assignment");
    return [];
  }

  const customerEmail = order.customerInfo.email.toLowerCase().trim();
  const customerName = order.customerInfo.name.trim();

  // Ensure Customer record exists
  let customer = order.customer ? await CustomerModel.findById(order.customer) : null;
  if (!customer) {
    customer = await CustomerModel.findOne({ email: customerEmail });
  }

  const assignedBooks: IPurchasedBook[] = [];

  for (const item of order.items) {
    // Check if the item format is an e-book
    let isDigital = isEbookFormat(item.format);

    // Resolve book document
    let book: IBook | null = null;
    if (item.book) {
      book = await BookModel.findById(item.book);
    }
    if (!book && item.sku) {
      book = await BookModel.findOne({ sku: item.sku });
    }
    if (!book && item.title) {
      book = await BookModel.findOne({ title: item.title });
    }

    if (!isDigital && book) {
      // If book format itself is an e-book
      isDigital = isEbookFormat(book.format);
    }

    if (!isDigital) {
      continue;
    }

    if (!book) {
      logger.warn({ itemTitle: item.title, orderNumber: order.orderNumber }, "Could not match book document for purchased e-book item");
      continue;
    }

    const rawPdfUrl = book.pdfUrl ? book.pdfUrl.replace("/uploads/ebooks/", "/ebooks/") : "";
    const pdfUrl = resolvedPdf.exists
      ? (rawPdfUrl || `/ebooks/${resolvedPdf.filename}`)
      : rawPdfUrl;

    // Atomic idempotent upsert into PurchasedBook (Requirement 8: prevent duplicates)
    try {
      const purchased = await PurchasedBookModel.findOneAndUpdate(
        {
          customerEmail,
          book: book._id,
        },
        {
          $set: {
            customer: customer?._id || order.customer,
            customerEmail,
            customerName,
            book: book._id,
            order: order._id,
            orderNumber: order.orderNumber,
            title: book.title,
            slug: book.slug,
            format: item.format || "E-Book",
            coverImage: item.coverImage || book.coverImage || "/aao-part-one.png",
            authorName: book.authorName || "Dr. Alka Chopra Madan",
            price: item.price,
            currency: order.currency || "USD",
            pdfUrl,
            purchasedAt: order.createdAt || new Date(),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      if (purchased) {
        assignedBooks.push(purchased);
      }
    } catch (err: any) {
      logger.error({ err: err?.message, bookId: book._id, customerEmail }, "Error during e-book assignment");
    }
  }

  logger.info(
    {
      orderNumber: order.orderNumber,
      customerEmail,
      assignedCount: assignedBooks.length,
    },
    "Successfully assigned purchased e-books to user account"
  );

  return assignedBooks;
}

/**
 * Checks whether an authenticated customer (or admin) has valid access to a book
 */
export async function checkUserBookAccess(
  customerEmail: string,
  bookIdOrSlug: string
): Promise<{ hasAccess: boolean; book: IBook | null; purchasedRecord: IPurchasedBook | null }> {
  if (!customerEmail || !bookIdOrSlug) {
    return { hasAccess: false, book: null, purchasedRecord: null };
  }

  const cleanEmail = customerEmail.toLowerCase().trim();

  // Find the book
  let book: IBook | null = null;
  if (bookIdOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
    book = await BookModel.findById(bookIdOrSlug);
  }
  if (!book) {
    book = await BookModel.findOne({ slug: bookIdOrSlug });
  }

  if (!book) {
    return { hasAccess: false, book: null, purchasedRecord: null };
  }

  // 1. Check PurchasedBook collection
  const record = await PurchasedBookModel.findOne({
    customerEmail: cleanEmail,
    book: book._id,
  });

  if (record) {
    return { hasAccess: true, book, purchasedRecord: record };
  }

  // 2. Fallback check: Paid order containing this book or slug
  const pastPaidOrder = await OrderModel.findOne({
    "customerInfo.email": cleanEmail,
    paymentStatus: "PAID",
    $or: [
      { "items.book": book._id },
      { "items.title": book.title },
      { "items.sku": book.sku },
    ],
  });

  if (pastPaidOrder) {
    // Check if any matching item is an e-book
    const matchingItem = pastPaidOrder.items.find((it: any) => {
      const isMatch =
        (it.book && it.book.toString() === book!._id.toString()) ||
        it.title.toLowerCase() === book!.title.toLowerCase() ||
        it.sku === book!.sku;
      return isMatch && (isEbookFormat(it.format) || isEbookFormat(book!.format));
    });

    if (matchingItem) {
      // Auto-backfill to PurchasedBook
      const newPurchased = await PurchasedBookModel.findOneAndUpdate(
        { customerEmail: cleanEmail, book: book._id },
        {
          $set: {
            customer: pastPaidOrder.customer,
            customerEmail: cleanEmail,
            customerName: pastPaidOrder.customerInfo.name,
            book: book._id,
            order: pastPaidOrder._id,
            orderNumber: pastPaidOrder.orderNumber,
            title: book.title,
            slug: book.slug,
            format: matchingItem.format || "E-Book",
            coverImage: matchingItem.coverImage || book.coverImage || "/aao-part-one.png",
            authorName: book.authorName || "Dr. Alka Chopra Madan",
            price: matchingItem.price,
            currency: pastPaidOrder.currency || "USD",
            pdfUrl: book.pdfUrl || "",
            purchasedAt: pastPaidOrder.createdAt || new Date(),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return { hasAccess: true, book, purchasedRecord: newPurchased };
    }
  }

  return { hasAccess: false, book, purchasedRecord: null };
}

/**
 * Syncs any past paid orders for a customer into PurchasedBook
 */
export async function syncCustomerPurchasedBooks(customerEmail: string): Promise<void> {
  if (!customerEmail) return;
  const cleanEmail = customerEmail.toLowerCase().trim();

  const paidOrders = await OrderModel.find({
    "customerInfo.email": cleanEmail,
    $or: [
      { paymentStatus: "PAID" },
      { orderStatus: "PAYMENT_CONFIRMED" },
      { orderStatus: "PROCESSING" },
      { orderStatus: "SHIPPED" },
      { orderStatus: "DELIVERED" },
    ],
  });

  for (const ord of paidOrders) {
    await assignEbooksForOrder(ord);
  }
}
