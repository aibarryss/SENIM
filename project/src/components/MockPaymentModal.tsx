import { useState } from 'react';
import { X, CreditCard, Loader2, CheckCircle, XCircle, AlertCircle, Lock } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { paymentProvider, type PaymentResult } from '@/lib/payment-provider';

interface MockPaymentModalProps {
  open: boolean;
  amount: number;
  onClose: () => void;
  onSuccess: (payment: PaymentResult) => void;
}

type MockPaymentMethod = 'card' | 'kaspi' | 'halyk';

type ModalState = 'idle' | 'processing' | 'succeeded' | 'failed' | 'cancelled';

export default function MockPaymentModal({ open, amount, onClose, onSuccess }: MockPaymentModalProps) {
  const { t } = useI18n();
  const [method, setMethod] = useState<MockPaymentMethod>('card');
  const [state, setState] = useState<ModalState>('idle');
  const [payment, setPayment] = useState<PaymentResult | null>(null);

  if (!open) return null;

  const formatKzt = (n: number) => `₸${n.toLocaleString()}`;

  const handleClose = () => {
    if (state === 'processing') return; // Don't allow closing during processing
    setState('idle');
    setPayment(null);
    onClose();
  };

  const handlePay = async (simulateFailure = false) => {
    setState('processing');
    const result = await paymentProvider.createPayment(amount, { simulateFailure });
    setPayment(result);
    if (result.status === 'succeeded') {
      setState('succeeded');
      // Notify parent after a brief delay so the user sees the success state
      setTimeout(() => onSuccess(result), 800);
    } else {
      setState('failed');
    }
  };

  const handleCancel = () => {
    setState('cancelled');
    setPayment({
      id: `MOCK-PAY-CANCELLED`,
      amount,
      currency: 'KZT',
      provider: 'mock',
      status: 'cancelled',
      createdAt: new Date().toISOString(),
    });
  };

  const handleRetry = () => {
    setState('idle');
    setPayment(null);
  };

  const methods: { id: MockPaymentMethod; label: string; icon: typeof CreditCard }[] = [
    { id: 'card', label: t('mockPayment.method.card'), icon: CreditCard },
    { id: 'kaspi', label: t('mockPayment.method.kaspi'), icon: CreditCard },
    { id: 'halyk', label: t('mockPayment.method.halyk'), icon: CreditCard },
  ];

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mock-payment-title"
        className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-outline-variant">
          <div>
            <h2 id="mock-payment-title" className="text-xl font-bold text-primary">
              {t('mockPayment.title')}
            </h2>
            <p className="text-[14px] text-on-surface-variant mt-1">{t('mockPayment.subtitle')}</p>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close"
            disabled={state === 'processing'}
            className="text-on-surface-variant hover:text-primary transition-colors disabled:opacity-30"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* DEMO WARNING BANNER */}
          <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-200">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[14px] font-bold text-amber-800 uppercase tracking-wide">
                  {t('mockPayment.demoBadge')}
                </p>
                <p className="text-[13px] text-amber-700 mt-1">
                  {t('mockPayment.demoWarning')}
                </p>
              </div>
            </div>
          </div>

          {/* Amount display */}
          <div className="p-4 rounded-xl bg-surface-container-low text-center">
            <p className="text-[14px] text-on-surface-variant mb-1">{t('mockPayment.amountLabel')}</p>
            <p className="text-[32px] font-bold text-primary">{formatKzt(amount)}</p>
          </div>

          {/* States */}
          {state === 'idle' && (
            <>
              {/* Payment method selection */}
              <div>
                <p className="text-[14px] font-semibold mb-2">{t('mockPayment.methodLabel')}</p>
                <div className="space-y-2">
                  {methods.map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setMethod(m.id)}
                        className={`w-full p-3 rounded-xl border-2 transition-all flex items-center gap-3 text-left ${
                          method === m.id
                            ? 'border-secondary bg-secondary-container/10'
                            : 'border-outline-variant'
                        }`}
                      >
                        <Icon
                          size={20}
                          className={method === m.id ? 'text-secondary' : 'text-on-surface-variant'}
                        />
                        <span className="text-[14px] font-semibold">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Demo card fields (visual only, not stored) */}
              {method === 'card' && (
                <div className="p-4 rounded-xl bg-surface-container-low space-y-3">
                  <div className="flex items-center gap-2 text-[12px] text-on-surface-variant">
                    <Lock size={12} />
                    {t('mockPayment.demoCardNote')}
                  </div>
                  <div>
                    <label className="block text-[12px] text-on-surface-variant mb-1">
                      {t('mockPayment.cardNumber')}
                    </label>
                    <input
                      type="text"
                      value="4242 4242 4242 4242"
                      readOnly
                      className="w-full p-2.5 rounded-lg border border-outline-variant bg-surface-container-high text-[14px] text-on-surface-variant font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] text-on-surface-variant mb-1">
                        {t('mockPayment.expiry')}
                      </label>
                      <input
                        type="text"
                        value="12/30"
                        readOnly
                        className="w-full p-2.5 rounded-lg border border-outline-variant bg-surface-container-high text-[14px] text-on-surface-variant font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] text-on-surface-variant mb-1">CVV</label>
                      <input
                        type="text"
                        value="123"
                        readOnly
                        className="w-full p-2.5 rounded-lg border border-outline-variant bg-surface-container-high text-[14px] text-on-surface-variant font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <button
                onClick={() => handlePay(false)}
                className="w-full bg-primary text-on-primary py-4 rounded-xl font-semibold hover:opacity-90 active:scale-95 transition-all"
              >
                {t('mockPayment.confirm')}
              </button>
              <button
                onClick={() => handlePay(true)}
                className="w-full bg-error-container text-on-error-container py-3 rounded-xl font-semibold hover:opacity-90 active:scale-95 transition-all text-[14px]"
              >
                {t('mockPayment.simulateFailure')}
              </button>
              <button
                onClick={handleCancel}
                className="w-full text-on-surface-variant py-2 rounded-xl font-semibold hover:bg-surface-container-low transition-all text-[14px]"
              >
                {t('mockPayment.cancel')}
              </button>
            </>
          )}

          {state === 'processing' && (
            <div className="py-12 text-center">
              <Loader2 size={48} className="animate-spin text-secondary mx-auto mb-4" />
              <p className="text-[16px] font-semibold text-primary">
                {t('mockPayment.processing')}
              </p>
              <p className="text-[14px] text-on-surface-variant mt-2">
                {t('mockPayment.processingHint')}
              </p>
            </div>
          )}

          {state === 'succeeded' && payment && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 mx-auto flex items-center justify-center mb-4">
                <CheckCircle size={32} className="text-emerald-600" />
              </div>
              <p className="text-[18px] font-bold text-primary mb-2">
                {t('mockPayment.succeeded')}
              </p>
              <p className="text-[14px] text-on-surface-variant mb-4">
                {t('mockPayment.succeededBody', { amount: formatKzt(amount) })}
              </p>
              <div className="p-3 rounded-lg bg-surface-container-low text-left">
                <p className="text-[12px] text-on-surface-variant mb-1">
                  {t('mockPayment.paymentId')}
                </p>
                <p className="text-[14px] font-mono font-semibold text-primary">{payment.id}</p>
              </div>
              <p className="text-[12px] text-on-surface-variant mt-4 italic">
                {t('mockPayment.demoTransactionNote')}
              </p>
            </div>
          )}

          {state === 'failed' && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 mx-auto flex items-center justify-center mb-4">
                <XCircle size={32} className="text-red-600" />
              </div>
              <p className="text-[18px] font-bold text-primary mb-2">
                {t('mockPayment.failed')}
              </p>
              <p className="text-[14px] text-on-surface-variant mb-6">
                {t('mockPayment.failedBody')}
              </p>
              <button
                onClick={handleRetry}
                className="w-full bg-primary text-on-primary py-3 rounded-xl font-semibold hover:opacity-90 active:scale-95 transition-all"
              >
                {t('mockPayment.retry')}
              </button>
              <button
                onClick={handleClose}
                className="w-full text-on-surface-variant py-2 rounded-xl font-semibold hover:bg-surface-container-low transition-all text-[14px] mt-2"
              >
                {t('mockPayment.close')}
              </button>
            </div>
          )}

          {state === 'cancelled' && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-container-high mx-auto flex items-center justify-center mb-4">
                <X size={32} className="text-on-surface-variant" />
              </div>
              <p className="text-[18px] font-bold text-primary mb-2">
                {t('mockPayment.cancelled')}
              </p>
              <p className="text-[14px] text-on-surface-variant mb-6">
                {t('mockPayment.cancelledBody')}
              </p>
              <button
                onClick={handleClose}
                className="w-full bg-primary text-on-primary py-3 rounded-xl font-semibold hover:opacity-90 active:scale-95 transition-all"
              >
                {t('mockPayment.close')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}