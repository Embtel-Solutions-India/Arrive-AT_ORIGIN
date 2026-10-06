import type { Request, Response } from "express";
import { Book } from "../../models/Book.js";
import { BlogPost } from "../../models/BlogPost.js";
import { Order } from "../../models/Order.js";
import { Customer } from "../../models/Customer.js";
import { ok } from "../../utils/response.js";

export const dashboardController = {
  async getStats(req: Request, res: Response) {
    const range = (req.query.range as string) || "30d";
    const startDateQuery = req.query.startDate as string | undefined;
    const endDateQuery = req.query.endDate as string | undefined;

    // 1. Parallel counts
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
        { $group: { _id: null, totalRevenue: { $sum: "$total" } } },
      ]),
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    // 2. Recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .select("orderNumber customerInfo total paymentStatus orderStatus createdAt items");

    // 3. Recent blog posts
    const recentBlogs = await BlogPost.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title slug authorName categoryName status publishDate createdAt isFeatured");

    // 4. Best-selling books
    const bestSellingBooks = await Book.find({ salesCount: { $gt: 0 } })
      .sort({ salesCount: -1 })
      .limit(5)
      .select("title slug coverImage price salesCount revenue stockQuantity");

    // Fallback if no sales yet: return top books
    let topBooks = bestSellingBooks;
    if (topBooks.length === 0) {
      topBooks = await Book.find().sort({ createdAt: -1 }).limit(5).select("title slug coverImage price salesCount revenue stockQuantity");
    }

    // 5. Sales analytics chart data based on date filter
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
      // 30d default
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
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$total" },
          ordersCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Map existing aggregation by date key
    const salesMap = new Map<string, { revenue: number; orders: number }>();
    for (const item of salesTimeSeries) {
      salesMap.set(item._id, {
        revenue: Number(item.revenue.toFixed(2)),
        orders: item.ordersCount,
      });
    }

    // Build continuous timeline array so chart is never sparse/broken
    const chartData: Array<{ date: string; revenue: number; orders: number }> = [];

    if (range === "today") {
      // 8 time slots across the day (00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00)
      const hourlyAgg = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: filterStart, $lte: filterEnd },
            paymentStatus: "PAID",
          },
        },
        {
          $group: {
            _id: { $hour: "$createdAt" },
            revenue: { $sum: "$total" },
            ordersCount: { $sum: 1 },
          },
        },
      ]);
      const hourMap = new Map<number, { revenue: number; orders: number }>();
      for (const item of hourlyAgg) {
        hourMap.set(item._id, { revenue: Number(item.revenue.toFixed(2)), orders: item.ordersCount });
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
      // Day by day timeline (7d or 30d or custom)
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
            _id: "$orderStatus",
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
      revenue: Number(c.revenue.toFixed(2)),
      sales: c.sales,
    }));

    const orderStatusDistribution = orderStatusRaw.map((s) => ({
      status: s._id,
      count: s.count,
      amount: Number(s.amount.toFixed(2)),
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
      },
      recentOrders,
      recentBlogs,
      bestSellingBooks: topBooks,
      chartData,
      categoryDistribution,
      orderStatusDistribution,
      formatDistribution,
      range,
    });
  },
};
