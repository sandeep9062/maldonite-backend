import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { createNotification } from './notificationController.js';

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private/Admin
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({}).populate('user', 'name email').populate('property', 'title');
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get a booking by ID
// @route   GET /api/bookings/:id
// @access  Private/Admin
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate('user', 'name email').populate('property', 'title');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json({
      ...booking.toObject(),
      userName: booking.user.name,
      userEmail: booking.user.email,
      propertyTitle: booking.property.title,
    });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a booking
// @route   DELETE /api/bookings/:id
// @access  Private/Admin
const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    // Find the booking - admins can delete any booking, users can only delete their own
    const booking = await Booking.findOne({ 
      _id: id, 
      ...(isAdmin ? {} : { user: userId }) 
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Remove the booking
    await booking.deleteOne();

    // Pull the booking reference from the user's bookedVisits array
    await User.findByIdAndUpdate(booking.user._id, {
      $pull: { bookedVisits: booking._id },
    });

    res.json({ message: "Booking removed" });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update a booking's status
// @route   PATCH /api/bookings/:id/status
// @access  Private/Admin
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const booking = await Booking.findById(id).populate('user', 'name email').populate('property', 'title');

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const oldStatus = booking.status;
    booking.status = status;
    await booking.save();

    // Create notification for admins when booking status changes
    if (oldStatus !== status) {
      try {
        // Get all admin users
        const adminUsers = await User.find({ role: 'admin' });

        for (const admin of adminUsers) {
          await createNotification({
            userId: admin._id,
            title: `Booking Status Updated`,
            message: `Booking for "${booking.property.title}" by ${booking.user.name} has been ${status}`,
            type: status === 'confirmed' ? 'success' : status === 'cancelled' ? 'warning' : 'info',
            category: 'booking',
            priority: 'medium',
            metadata: {
              bookingId: booking._id,
              propertyId: booking.property._id,
              userId: booking.user._id,
              oldStatus,
              newStatus: status,
            },
            actionUrl: `/dashboard/bookings/${booking._id}`,
          });
        }
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Don't fail the booking update if notification creation fails
      }
    }

    res.json({ message: "Booking status updated successfully", booking });
  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export { getAllBookings, getBookingById, deleteBooking, updateBookingStatus };
