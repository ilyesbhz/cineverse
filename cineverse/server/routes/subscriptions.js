import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  cancelSubscription,
  createCheckoutSession,
  getUserSubscription,
  verifyPayment
} from '../controllers/subscriptionController.js';

const router = express.Router();

router.post('/create-checkout', auth, createCheckoutSession);
router.post('/verify-payment', auth, verifyPayment);
router.get('/my-subscription', auth, getUserSubscription);
router.post('/cancel', auth, cancelSubscription);

export default router;
