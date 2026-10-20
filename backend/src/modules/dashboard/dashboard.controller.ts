import type { Request, Response } from "express";
import { Book } from "../../models/Book.js";
import { BlogPost } from "../../models/BlogPost.js";
import { Order } from "../../models/Order.js";
import { Customer } from "../../models/Customer.js";
import { ok } from "../../utils/response.js";

export const USD_TO_INR_RATE = 96.79;

export const dashboardController = {
  async getStats(req: Request, res: Response) {
    const range = (req.query.range as string) || "30d";
    const startDateQuery = req.query.startDate as string | undefined;
    const endDateQuery = req.query.endDate as string | undefined;
    const currency = ((req.query.currency as string) || "USD").toUpperCase() === "INR" ? "INR" : "USD";

    // 1. Parallel counts & revenue segmented by currency
    const [
      totalBooks,
      publishedBooks,
      draftBooks,
      outOfStockBooks,
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalCustomers,
      revenueResult,
    ] = await Promise.all([
      Book.countDocuments(),
      Book.countDocuments({ status: "PUBLISHED" }),
      Book.countDocuments({ status: "DRAFT" }),
      Book.countDocuments({ $or: [{ status: "OUT_OF_STOCK" }, { stockQuantity: { $lte: 0 } }] }),
      BlogPost.countDocuments(),
      BlogPost.countDocuments({ status: "PUBLISHED" }),
      BlogPost.countDocuments({ status: "DRAFT" }),
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: "PENDING" }),
      Order.countDocuments({ orderStatus: "DELIVERED" }),
      Customer.countDocuments(),
      Order.aggregate([
        { $match: { paymentStatus: "PAID" } },
        {
          $group: {
            _id: { $toUpper: { $ifNull: ["$currency", "USD"] } },
            totalRevenue: { $sum: "$total" },
            ordersCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    let revenueUSD = 0;
    let revenueINR = 0;
    for (const item of (revenueResult as Array<{ _id: string; totalRevenue: number }>)) {
      if (item._id === "INR") {
        revenueINR += item.totalRevenue;
      } else {
        revenueUSD += item.totalRevenue;
      }
    }

    const totalRevenue =
      currency === "INR"
        ? revenueINR + revenueUSD * USD_TO_INR_RATE
        : revenueUSD + revenueINR / USD_TO_INR_RATE;

    // 2. Recent orders (with currency)
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .select("orderNumber customerInfo total currency paymentStatus orderStatus createdAt items");

    // 3. Recent blog posts
    const recentBlogs = await BlogPost.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title slug authorName categoryName status publishDate createdAt isFeatured");

    // 4. Best-selling books with currency adjustments
    const bestSellingBooks = await Book.find({ salesCount: { $gt: 0 } })
      .sort({ salesCount: -1 })
      .limit(5)
      .select("title slug coverImage price priceINR priceUSD salesCount revenue stockQuantity");

    let topBooks = bestSellingBooks;
    if (topBooks.length === 0) {
      topBooks = await Book.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title slug coverImage price priceINR priceUSD salesCount revenue stockQuantity");
    }

    const formattedTopBooks = topBooks.map((b) => {
      const bookObj = b.toObject ? b.toObject() : { ...b };
      const bookPrice =
        currency === "INR"
          ? bookObj.priceINR || (bookObj.priceUSD ? bookObj.priceUSD * USD_TO_INR_RATE : (bookObj.price >= 50 ? bookObj.price : bookObj.price * USD_TO_INR_RATE))
          : bookObj.priceUSD || (bookObj.priceINR ? bookObj.priceINR / USD_TO_INR_RATE : (bookObj.price < 50 ? bookObj.price : bookObj.price / USD_TO_INR_RATE));
      const bookRevenue =
        currency === "INR"
          ? (bookObj.revenue || 0) * USD_TO_INR_RATE
          : bookObj.revenue || 0;
      return {
        ...bookObj,
        price: Number(bookPrice.toFixed(2)),
        revenue: Number(bookRevenue.toFixed(2)),
        currency,
      };
    });

    // 5. Sales analytics chart data based on date filter & currency conversion
    const now = new Date();
    let filterStart: Date;
    let filterEnd: Date = new Date();

    if (range === "today") {
      filterStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === "7d") {
      filterStart = new Date(now.getTime() - 7 * 86_400_000);
    } else if (range === "year") {
      filterStart = new Date(now.getFullYear(), 0, 1);
    } else if (range === "custom" && startDateQuery && endDateQuery) {
      filterStart = new Date(startDateQuery);
      filterEnd = new Date(endDateQuery);
    } else {
      filterStart = new Date(now.getTime() - 30 * 86_400_000);
    }

    const salesTimeSeries = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: filterStart, $lte: filterEnd },
          paymentStatus: "PAID",
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            currency: { $toUpper: { $ifNull: ["$currency", "USD"] } },
          },
          revenue: { $sum: "$total" },
          ordersCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    const salesMap = new Map<string, { revenue: number; orders: number }>();
    for (const item of salesTimeSeries) {
      const dStr = item._id.date;
      const itemCurrency = item._id.currency;
      const convertedRev =
        currency === itemCurrency
          ? item.revenue
          : currency === "INR"
          ? item.revenue * USD_TO_INR_RATE
          : item.revenue / USD_TO_INR_RATE;

      const existing = salesMap.get(dStr) || { revenue: 0, orders: 0 };
      salesMap.set(dStr, {
        revenue: Number((existing.revenue + convertedRev).toFixed(2)),
        orders: existing.orders + item.ordersCount,
      });
    }

    const chartData: Array<{ date: string; revenue: number; orders: number }> = [];

    if (range === "today") {
      const hourlyAgg = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: filterStart, $lte: filterEnd },
            paymentStatus: "PAID",
          },
        },
        {
          $group: {
            _id: {
              hour: { $hour: "$createdAt" },
              currency: { $toUpper: { $ifNull: ["$currency", "USD"] } },
            },
            revenue: { $sum: "$total" },
            ordersCount: { $sum: 1 },
          },
        },
      ]);
      const hourMap = new Map<number, { revenue: number; orders: number }>();
      for (const item of hourlyAgg) {
        const h = item._id.hour;
        const itemCurrency = item._id.currency;
        const convertedRev =
          currency === itemCurrency
            ? item.revenue
            : currency === "INR"
            ? item.revenue * USD_TO_INR_RATE
            : item.revenue / USD_TO_INR_RATE;

        const existing = hourMap.get(h) || { revenue: 0, orders: 0 };
        hourMap.set(h, {
          revenue: Number((existing.revenue + convertedRev).toFixed(2)),
          orders: existing.orders + item.ordersCount,
        });
      }
      for (let h = 0; h < 24; h += 3) {
        let hRev = 0;
        let hOrd = 0;
        for (let subH = h; subH < h + 3; subH++) {
          const slot = hourMap.get(subH);
          if (slot) {
            hRev += slot.revenue;
            hOrd += slot.orders;
          }
        }
        chartData.push({
          date: `${String(h).padStart(2, "0")}:00`,
          revenue: Number(hRev.toFixed(2)),
          orders: hOrd,
        });
      }
    } else if (range === "year") {
      const year = now.getFullYear();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      for (let m = 0; m < 12; m++) {
        const monthPrefix = `${year}-${String(m + 1).padStart(2, "0")}`;
        let mRev = 0;
        let mOrd = 0;
        salesMap.forEach((val, dStr) => {
          if (dStr.startsWith(monthPrefix)) {
            mRev += val.revenue;
            mOrd += val.orders;
          }
        });
        chartData.push({
          date: monthNames[m],
          revenue: Number(mRev.toFixed(2)),
          orders: mOrd,
        });
      }
    } else {
      const daysCount = range === "7d" ? 7 : 30;
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86_400_000);
        const dStr = d.toISOString().slice(0, 10);
        const entry = salesMap.get(dStr) || { revenue: 0, orders: 0 };
        chartData.push({
          date: dStr,
          revenue: entry.revenue,
          orders: entry.orders,
        });
      }
    }

    // Aggregations for Pie, Bar, and Donut charts
    const [categoryDistributionRaw, orderStatusRaw, formatDistributionRaw] = await Promise.all([
      Book.aggregate([
        {
          $group: {
            _id: { $ifNull: ["$categoryName", "Uncategorized"] },
            count: { $sum: 1 },
            revenue: { $sum: "$revenue" },
            sales: { $sum: "$salesCount" },
          },
        },
        { $sort: { revenue: -1 } },
      ]),
      Order.aggregate([
        {
          $group: {
            _id: {
              status: "$orderStatus",
              currency: { $toUpper: { $ifNull: ["$currency", "USD"] } },
            },
            count: { $sum: 1 },
            amount: { $sum: "$total" },
          },
        },
        { $sort: { count: -1 } },
      ]),
      Book.aggregate([
        {
          $group: {
            _id: { $ifNull: ["$format", "Paperback"] },
            count: { $sum: 1 },
            stock: { $sum: "$stockQuantity" },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    const categoryDistribution = categoryDistributionRaw.map((c) => ({
      name: c._id,
      count: c.count,
      revenue: Number(
        (currency === "INR" ? c.revenue * USD_TO_INR_RATE : c.revenue).toFixed(2)
      ),
      sales: c.sales,
    }));

    const statusMap = new Map<string, { count: number; amount: number }>();
    for (const s of orderStatusRaw) {
      const st = s._id.status;
      const itemCurrency = s._id.currency;
      const convertedAmt =
        currency === itemCurrency
          ? s.amount
          : currency === "INR"
          ? s.amount * USD_TO_INR_RATE
          : s.amount / USD_TO_INR_RATE;

      const existing = statusMap.get(st) || { count: 0, amount: 0 };
      statusMap.set(st, {
        count: existing.count + s.count,
        amount: Number((existing.amount + convertedAmt).toFixed(2)),
      });
    }

    const orderStatusDistribution = Array.from(statusMap.entries()).map(([st, val]) => ({
      status: st,
      count: val.count,
      amount: val.amount,
    }));

    const formatDistribution = formatDistributionRaw.map((f) => ({
      format: f._id,
      count: f.count,
      stock: f.stock,
    }));

    ok(res, {
      cards: {
        totalBooks,
        publishedBooks,
        draftBooks,
        outOfStockBooks,
        totalBlogs,
        publishedBlogs,
        draftBlogs,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalCustomers,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        currency,
        revenueByCurrency: {
          USD: Number(revenueUSD.toFixed(2)),
          INR: Number(revenueINR.toFixed(2)),
        },
      },
      recentOrders,
      recentBlogs,
      bestSellingBooks: formattedTopBooks,
      chartData,
      categoryDistribution,
      orderStatusDistribution,
      formatDistribution,
      range,
      currency,
    });
  },
};
