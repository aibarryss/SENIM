/**
 * Payment provider abstraction.
 *
 * SENIM is currently an MVP with no legal entity to accept real payments, so
 * only MockPaymentProvider is implemented. The interface is designed so a
 * RealPaymentProvider can be dropped in later without rewriting the donation
 * flow — the UI calls createPayment() and getPaymentStatus(), not any
 * provider-specific logic.
 *
 * SECURITY: MockPaymentProvider never charges real money. It simulates a
 * payment session with a random ID and a delay. No card data is stored.
 */

export type PaymentStatus = 'idle' | 'processing' | 'succeeded' | 'failed' | 'cancelled';

export type PaymentCurrency = 'KZT';

export interface PaymentResult {
  id: string;
  donationId?: string;
  amount: number;
  currency: PaymentCurrency;
  provider: 'mock';
  status: 'succeeded' | 'failed' | 'cancelled';
  createdAt: string;
}

export interface PaymentProvider {
  /** Create a mock/simulated payment session. Returns a payment result. */
  createPayment(amount: number, options?: { simulateFailure?: boolean }): Promise<PaymentResult>;
  /** Look up the status of an existing payment. */
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
}

/**
 * MockPaymentProvider — simulates a payment provider for the SENIM MVP demo.
 *
 * - Generates a payment ID like `MOCK-PAY-XXXXXXXX`.
 * - Simulates a 500–1500ms processing delay.
 * - Never charges real money.
 * - Optionally simulates failure for demo purposes.
 */
export class MockPaymentProvider implements PaymentProvider {
  async createPayment(
    amount: number,
    options?: { simulateFailure?: boolean },
  ): Promise<PaymentResult> {
    // Simulate network/processing delay (500–1500ms).
    const delay = 500 + Math.floor(Math.random() * 1000);
    await new Promise((resolve) => setTimeout(resolve, delay));

    const paymentId = `MOCK-PAY-${this.randomId()}`;
    const createdAt = new Date().toISOString();

    if (options?.simulateFailure) {
      return {
        id: paymentId,
        amount,
        currency: 'KZT',
        provider: 'mock',
        status: 'failed',
        createdAt,
      };
    }

    return {
      id: paymentId,
      amount,
      currency: 'KZT',
      provider: 'mock',
      status: 'succeeded',
      createdAt,
    };
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    // In a real provider this would query the provider's API. For the mock,
    // we assume any payment that exists has already completed (succeeded).
    // This method exists for interface completeness and future real providers.
    if (!paymentId || !paymentId.startsWith('MOCK-PAY-')) {
      return 'failed';
    }
    return 'succeeded';
  }

  private randomId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    for (let i = 0; i < 8; i += 1) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  }
}

/** Singleton instance used by the donation flow. */
export const paymentProvider: PaymentProvider = new MockPaymentProvider();