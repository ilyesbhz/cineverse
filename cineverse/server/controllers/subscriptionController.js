import Stripe from 'stripe';
import User from '../models/user.js';
import Subscription from '../models/subscription.js';

const getStripeClient = () => {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

export const createCheckoutSession = async (req, res) => {
  try {
    const stripe = getStripeClient();
    if (!stripe) {
      return res.status(400).json({ message: 'Stripe is not configured on the server' });
    }

    const { plan } = req.body;
    const userId = req.user._id.toString();

    const prices = {
      basic: { amount: 999, name: 'Cineverse Basic Plan - $9.99/month' },
      premium: { amount: 1999, name: 'Cineverse Premium Plan - $19.99/month' }
    };

    if (!prices[plan]) {
      return res.status(400).json({ message: 'Invalid plan. Choose basic or premium.' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: prices[plan].name },
            unit_amount: prices[plan].amount
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment-cancel`,
      client_reference_id: userId,
      metadata: { userId, plan }
    });

    return res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    return res.status(500).json({ message: 'Payment error', error: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const stripe = getStripeClient();
    if (!stripe) {
      return res.status(400).json({ message: 'Stripe is not configured on the server' });
    }

    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ message: 'Session ID is required' });

    const existingSub = await Subscription.findOne({ stripeSessionId: sessionId });
    if (existingSub) {
      return res.json({
        message: 'Subscription already activated',
        subscription: { plan: existingSub.plan, expiresAt: existingSub.expiresAt }
      });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    const userId = session.metadata.userId;
    const plan = session.metadata.plan;

    if (!userId || !plan) {
      return res.status(400).json({ message: 'Invalid session metadata' });
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    try {
      await Subscription.create({
        userId,
        plan,
        stripeSessionId: sessionId,
        status: 'active',
        expiresAt
      });
    } catch (dbErr) {
      if (dbErr.code === 11000) {
        const duplicate = await Subscription.findOne({ stripeSessionId: sessionId });
        if (duplicate) {
          return res.json({
            message: 'Subscription already activated',
            subscription: { plan: duplicate.plan, expiresAt: duplicate.expiresAt }
          });
        }
      }
      throw dbErr;
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.subscription.plan = plan;
    user.subscription.expiresAt = expiresAt;
    user.plan = plan;
    await user.save();

    return res.json({ message: 'Subscription activated', subscription: { plan, expiresAt } });
  } catch (error) {
    return res.status(500).json({ message: 'Verification error', error: error.message });
  }
};

export const getUserSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('subscription plan');
    return res.json(user.subscription || { plan: user.plan || 'free', expiresAt: null });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.subscription.plan = 'free';
    user.subscription.expiresAt = null;
    user.plan = 'free';
    await user.save();

    await Subscription.updateMany({ userId: req.user._id, status: 'active' }, { status: 'cancelled' });
    return res.json({ message: 'Subscription cancelled' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
