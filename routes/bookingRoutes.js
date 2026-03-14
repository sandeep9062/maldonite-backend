import express from 'express';
import { getAllBookings, getBookingById, deleteBooking, updateBookingStatus } from '../controllers/bookingController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', getAllBookings);
router.get('/:id', getBookingById);
router.delete('/:id', protect, deleteBooking);
router.patch('/:id/status', protect, updateBookingStatus);

export default router;
