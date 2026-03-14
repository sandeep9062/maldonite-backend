import Property from "../models/Property.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalProperties,
      totalUsers,
      totalBookings,
      todayBookings,
      totalRevenue,
      monthlyRevenue,
      bookingsPerMonth,
      revenuePerMonth,
    ] = await Promise.all([
      Property.countDocuments(),
      User.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ createdAt: { $gte: today } }),
      Booking.aggregate([
        {
          $lookup: {
            from: "properties",
            localField: "property",
            foreignField: "_id",
            as: "property",
          },
        },
        { $unwind: "$property" },
        { $group: { _id: null, totalRevenue: { $sum: "$property.price" } } },
      ]),
      Booking.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                1
              ),
            },
          },
        },
        {
          $lookup: {
            from: "properties",
            localField: "property",
            foreignField: "_id",
            as: "property",
          },
        },
        { $unwind: "$property" },
        { $group: { _id: null, monthlyRevenue: { $sum: "$property.price" } } },
      ]),
      Booking.aggregate([
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        { $limit: 12 },
        {
          $project: {
            _id: 0,
            month: {
              $let: {
                vars: {
                  monthsInString: [
                    ,
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                  ],
                },
                in: { $arrayElemAt: ["$$monthsInString", "$_id.month"] },
              },
            },
            bookings: "$count",
          },
        },
      ]),
      Booking.aggregate([
        {
          $lookup: {
            from: "properties",
            localField: "property",
            foreignField: "_id",
            as: "property",
          },
        },
        { $unwind: "$property" },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            totalRevenue: { $sum: "$property.price" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        { $limit: 12 },
        {
          $project: {
            _id: 0,
            month: {
              $let: {
                vars: {
                  monthsInString: [
                    ,
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                  ],
                },
                in: { $arrayElemAt: ["$$monthsInString", "$_id.month"] },
              },
            },
            revenue: "$totalRevenue",
          },
        },
      ]),
    ]);

    res.json({
      totalProperties,
      totalUsers,
      totalBookings,

      todayBookings,
      totalRevenue: totalRevenue[0]?.totalRevenue || 0,
      monthlyRevenue: monthlyRevenue[0]?.monthlyRevenue || 0,
      bookingsPerMonth,
      revenuePerMonth,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
