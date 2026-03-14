import express from 'express';
import { protect, checkAdmin } from '../middlewares/authMiddleware.js';
import { getDashboardStats } from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/stats', protect, checkAdmin, getDashboardStats);

export default router;
