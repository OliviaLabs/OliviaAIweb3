import { OPENAI_MICROSERVICE_CONFIG } from '../config/endpoints.js';

/**
 * NOWPayments API Service
 * Handles cryptocurrency payments for subscription plans
 * API Documentation: https://documenter.getpostman.com/view/7907941/2s93JusNJt
 */

export const nowpaymentsService = {
  // Base configuration
  BASE_URL: 'https://api.nowpayments.io/v1',
  SANDBOX_URL: 'https://api-sandbox.nowpayments.io/v1', // For testing
  
  /**
   * Get API status
   * GET /status
   */
  async getStatus() {
    try {
      const response = await fetch(`${OPENAI_MICROSERVICE_CONFIG.URL}/api/nowpayments/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_MICROSERVICE_CONFIG.TOKEN || 'dev-token'}`,
          'Origin': window.location.origin
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('NOWPayments status error:', error);
      throw error;
    }
  },

  /**
   * Get available currencies
   * GET /currencies
   */
  async getCurrencies() {
    try {
      const response = await fetch(`${OPENAI_MICROSERVICE_CONFIG.URL}/api/nowpayments/currencies`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_MICROSERVICE_CONFIG.TOKEN || 'dev-token'}`,
          'Origin': window.location.origin
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('NOWPayments currencies error:', error);
      throw error;
    }
  },

  /**
   * Get exchange rate estimate
   * GET /estimate?amount={amount}&currency_from={currency_from}&currency_to={currency_to}
   */
  async getEstimate(amount, currencyFrom, currencyTo) {
    try {
      const params = new URLSearchParams({
        amount: amount.toString(),
        currency_from: currencyFrom,
        currency_to: currencyTo
      });

      const response = await fetch(`${OPENAI_MICROSERVICE_CONFIG.URL}/api/nowpayments/estimate?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_MICROSERVICE_CONFIG.TOKEN || 'dev-token'}`,
          'Origin': window.location.origin
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('NOWPayments estimate error:', error);
      throw error;
    }
  },

  /**
   * Create payment
   * POST /payment
   */
  async createPayment(paymentData) {
    try {
      const response = await fetch(`${OPENAI_MICROSERVICE_CONFIG.URL}/api/nowpayments/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_MICROSERVICE_CONFIG.TOKEN || 'dev-token'}`,
          'Origin': window.location.origin
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('NOWPayments create payment error:', error);
      throw error;
    }
  },

  /**
   * Get payment status
   * GET /payment/{paymentId}
   */
  async getPaymentStatus(paymentId) {
    try {
      const response = await fetch(`${OPENAI_MICROSERVICE_CONFIG.URL}/api/nowpayments/payment/${paymentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_MICROSERVICE_CONFIG.TOKEN || 'dev-token'}`,
          'Origin': window.location.origin
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('NOWPayments payment status error:', error);
      throw error;
    }
  },

  /**
   * Get minimum payment amount
   * GET /min-amount?currency_from={currency_from}&currency_to={currency_to}
   */
  async getMinAmount(currencyFrom, currencyTo) {
    try {
      const params = new URLSearchParams({
        currency_from: currencyFrom,
        currency_to: currencyTo
      });

      const response = await fetch(`${OPENAI_MICROSERVICE_CONFIG.URL}/api/nowpayments/min-amount?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_MICROSERVICE_CONFIG.TOKEN || 'dev-token'}`,
          'Origin': window.location.origin
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('NOWPayments min amount error:', error);
      throw error;
    }
  },

  /**
   * Create subscription payment for Olivia AI plans
   */
  async createSubscriptionPayment(plan, userEmail, walletAddress) {
    const planPrices = {
      'starter': 5,
      'pro': 10,
      'unlimited': 15
    };

    const planPluginLimits = {
      'free': 2,
      'starter': 4,
      'pro': 8,
      'unlimited': -1 // unlimited
    };

    const paymentData = {
      price_amount: planPrices[plan],
      price_currency: 'USD',
      pay_currency: 'btc', // Default to Bitcoin, user can change
      order_id: `olivia_${plan}_${Date.now()}`,
      order_description: `Olivia AI ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - ${planPluginLimits[plan] === -1 ? 'Unlimited' : planPluginLimits[plan]} Plugins`,
      ipn_callback_url: `${window.location.origin}/api/payment/callback`,
      success_url: `${window.location.origin}/plugins?payment=success&plan=${plan}`,
      cancel_url: `${window.location.origin}/plugins?payment=cancelled`,
      customer_email: userEmail,
      purchase_id: `olivia_${walletAddress}_${plan}_${Date.now()}`
    };

    return this.createPayment(paymentData);
  },

  /**
   * Subscription plan configuration
   */
  SUBSCRIPTION_PLANS: {
    free: {
      name: 'Free',
      price: 0,
      pluginLimit: 2,
      features: ['Basic AI assistance', 'Essential data sources']
    },
    starter: {
      name: 'Starter',
      price: 5,
      pluginLimit: 4,
      features: ['Enhanced AI capabilities', 'More data sources', 'Priority support']
    },
    pro: {
      name: 'Pro',
      price: 10,
      pluginLimit: 8,
      features: ['Advanced AI features', 'Premium data sources', 'Real-time analytics']
    },
    unlimited: {
      name: 'Unlimited',
      price: 15,
      pluginLimit: -1,
      features: ['Complete AI experience', 'All data sources', '24/7 premium support']
    }
  }
};
