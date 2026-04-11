import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { streamxApi } from '../services/api';

const PricingFeature = ({ included, text }) => (
  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', paddingBottom: '10px' }}>
    <span style={{ color: included ? 'var(--red)' : 'var(--text-dim)', fontSize: '1.2rem', flexShrink: 0, marginTop: '-2px' }}>
      {included ? '✓' : '✕'}
    </span>
    <span style={{ color: included ? 'var(--text)' : 'var(--text-dim)', fontSize: '0.95rem' }}>
      {text}
    </span>
  </div>
);

export default function PricingPage() {
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [planLoading, setPlanLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadCurrentPlan = async () => {
      setPlanLoading(true);
      try {
        const res = await streamxApi.getMySubscription();
        const fetchedPlan = res.data?.plan || user?.subscription?.plan || user?.plan || 'free';
        if (isMounted) {
          setCurrentPlan(String(fetchedPlan).toLowerCase());
        }
      } catch {
        if (isMounted) {
          const fallbackPlan = user?.subscription?.plan || user?.plan || 'free';
          setCurrentPlan(String(fallbackPlan).toLowerCase());
        }
      } finally {
        if (isMounted) {
          setPlanLoading(false);
        }
      }
    };

    loadCurrentPlan();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const currentPlanLabel = useMemo(() => {
    if (planLoading) return 'Loading plan...';
    return currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1);
  }, [currentPlan, planLoading]);

  const checkout = async (plan) => {
    setError('');
    setLoading(true);
    try {
      const res = await streamxApi.createCheckout(plan);
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to start checkout');
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      name: 'Free',
      price: 0,
      period: 'forever',
      description: 'Get started with essential features',
      features: [
        { text: 'HD Quality (720p)', included: true },
        { text: 'Limited movie catalog', included: true },
        { text: 'Watch history tracking', included: true },
        { text: 'Discussions & Comments', included: true },
        { text: '4K Quality', included: false },
        { text: 'Download for offline', included: false },
        { text: 'Ad-free experience', included: false },
        { text: 'Priority support', included: false },
      ],
      buttonText: 'Current Plan',
      buttonDisabled: true,
      highlighted: false
    },
    {
      name: 'Basic',
      price: 9.99,
      period: '/month',
      description: 'Perfect for casual viewers',
      features: [
        { text: 'Full HD Quality (1080p)', included: true },
        { text: 'Full movie catalog', included: true },
        { text: 'Watch history tracking', included: true },
        { text: 'Discussions & Comments', included: true },
        { text: '4K Quality', included: false },
        { text: 'Download for offline', included: false },
        { text: 'Ad-free experience', included: true },
        { text: 'Priority support', included: false },
      ],
      buttonText: 'Subscribe Now',
      buttonDisabled: false,
      highlighted: false
    },
    {
      name: 'Premium',
      price: 19.99,
      period: '/month',
      description: 'The ultimate experience',
      features: [
        { text: '4K Ultra HD Quality', included: true },
        { text: 'Full movie catalog', included: true },
        { text: 'Watch history tracking', included: true },
        { text: 'Discussions & Comments', included: true },
        { text: '4K Quality', included: true },
        { text: 'Download for offline', included: true },
        { text: 'Ad-free experience', included: true },
        { text: 'Priority 24/7 support', included: true },
      ],
      buttonText: 'Subscribe Now',
      buttonDisabled: false,
      highlighted: true
    }
  ];

  return (
    <main style={{ padding: '96px 24px 48px' }}>
      <section style={{ marginBottom: '60px', textAlign: 'center' }}>
        <h1 className="section-title" style={{ marginBottom: '12px' }}>Choose Your Plan</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
          Select the perfect plan for your streaming needs and unlock unlimited entertainment
        </p>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '18px',
          padding: '10px 14px',
          borderRadius: '999px',
          background: 'rgba(229, 9, 20, 0.12)',
          border: '1px solid rgba(229, 9, 20, 0.25)',
          color: 'var(--text)'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Current plan
          </span>
          <strong style={{ color: 'var(--red)' }}>{currentPlanLabel}</strong>
        </div>
      </section>

      {error && (
        <div style={{
          background: 'rgba(255, 107, 107, 0.1)',
          border: '1px solid rgba(255, 107, 107, 0.3)',
          color: '#ff6b6b',
          padding: '12px 16px',
          borderRadius: 'var(--radius)',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {plans.map(plan => (
          (() => {
            const isCurrentPlan = currentPlan === plan.name.toLowerCase();
            const buttonText = isCurrentPlan ? 'Current Plan' : plan.buttonText;
            const buttonDisabled = isCurrentPlan || plan.buttonDisabled;

            return (
          <div
            key={plan.name}
            style={{
              background: 'var(--card)',
              border: isCurrentPlan ? '2px solid var(--red)' : plan.highlighted ? '2px solid var(--red)' : '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '32px 24px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              boxShadow: isCurrentPlan || plan.highlighted ? '0 0 30px rgba(229, 9, 20, 0.2)' : 'none',
              transform: isCurrentPlan || plan.highlighted ? 'scale(1.02)' : 'scale(1)',
              transition: 'transform 0.3s, box-shadow 0.3s'
            }}
          >
            {(plan.highlighted || isCurrentPlan) && (
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--red)',
                color: '#fff',
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: '700',
                letterSpacing: '0.5px'
              }}>
                {isCurrentPlan ? 'CURRENT PLAN' : 'MOST POPULAR'}
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <h2 style={{
                fontSize: '1.6rem',
                fontWeight: '700',
                marginBottom: '8px',
                color: 'var(--text)'
              }}>
                {plan.name}
              </h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '16px' }}>
                {plan.description}
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{
                  fontSize: '3rem',
                  fontWeight: '800',
                  color: plan.price > 0 ? 'var(--red)' : 'var(--text)'
                }}>
                  ${plan.price.toFixed(2)}
                </span>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                  {plan.period}
                </span>
              </div>
            </div>

            <button
              onClick={() => checkout(plan.name.toLowerCase())}
              disabled={buttonDisabled || loading}
              className={isCurrentPlan || plan.highlighted ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{
                width: '100%',
                marginBottom: '24px',
                cursor: buttonDisabled ? 'not-allowed' : 'pointer',
                opacity: buttonDisabled || loading ? '0.6' : '1'
              }}
            >
              {loading ? 'Processing...' : buttonText}
            </button>

            <div style={{ flex: 1 }}>
              <p style={{
                fontSize: '0.85rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: 'var(--text-dim)',
                marginBottom: '16px'
              }}>
                What's Included
              </p>
              {plan.features.map((feature, idx) => (
                <PricingFeature key={idx} included={feature.included} text={feature.text} />
              ))}
            </div>
          </div>
            );
          })()
        ))}
      </div>

      <section style={{ marginTop: '60px', maxWidth: '800px', margin: '60px auto 0' }}>
        <h3 style={{
          fontSize: '1.3rem',
          fontWeight: '700',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          Frequently Asked Questions
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { q: 'Can I change my plan anytime?', a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.' },
            { q: 'Is there a free trial?', a: 'Our free plan gives you access to a limited catalog with HD quality. No credit card required to get started.' },
            { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, PayPal, and digital wallets for your convenience.' },
            { q: 'Can I cancel my subscription?', a: 'Absolutely! You can cancel anytime from your account settings. No hidden fees or long-term contracts.' }
          ].map((item, idx) => (
            <div key={idx} style={{
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '16px',
            }}>
              <p style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text)' }}>
                {item.q}
              </p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', lineHeight: '1.5' }}>
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
