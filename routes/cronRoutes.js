import express from 'express';
const router = express.Router();

router.get('/keep-alive', (req, res) => {
  res.status(200).json({ message: 'Backend is awake' });
});

export default router;
