import { useState } from 'react';
import { X, CreditCard, Repeat, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { localizedText } from '@/lib/i18n-text';
import type { Campaign } from '@/lib/types';

interface DonationModalProps {
  campaign: Campaign | null;
  open: boolean;
  onClose: () => void;
  onRequireAuth: () => void;
}

type PaymentType = 'full' | 'partial' | 'subscription';

export default function DonationModal({ campaign, open, onClose, onRequireAuth }: DonationModalProps) {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [paymentType, setPaymentType] = useState<PaymentType>('full');
  const [amount, setAmount] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || !campaign) return null;

  const campaignTitle = localizedText(campaign.title, campaign.title_i18n, locale);
  const remaining = Math.max(0, campaign.goal_amount - campaign.raised_amount);

  const handleDonate = async () => {
    if (!user) {
      onRequireAuth();
      return;
    }

    setError(null);
    setLoading(true);
    let donateAmount = 0;
    if (paymentType === 'full') {
      donateAmount = remaining;
    } else if (paymentType === 'partial') {
      donateAmount = parseInt(amount) || 0;
    } else {
      donateAmount = parseInt(monthlyLimit) || 0;
    }

    if (donateAmount <= 0) {
      setLoading(false);
      return;
    }

    // This only records the donor's intent. It does NOT move money and does
    // NOT change the campaign's raised_amount or platform stats — those are
    // only ever updated by a trusted backend process once real payments are
    // wired up. Real-money processing is out of scope for this task.
    const { error: insertError } = await supabase.from('donation_intents').insert({
      donor_id: user.id,
      campaign_id: campaign.id === 'general' ? null : campaign.id,
      amount: donateAmount,
      payment_type: paymentType,
    });

    setLoading(false);
    if (insertError) {
      setError(t('donate.insertError'));
      return;
    }
    setSuccess(true);
  };

  const handleClose = () => {
    setPaymentType('full');
    setAmount('');
    setMonthlyLimit('');
    setSuccess(false);
    setLoading(false);
    setError(null);
    onClose();
  };

  const formatKzt = (n: number) => `₸${n.toLocaleString()}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={handleClose}>
      <div
        className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary-container mx-auto flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-secondary" />
            </div>
            <h2 className="text-xl font-bold text-primary mb-2">{t('donate.successTitle')}</h2>
            <p className="text-[14px] text-on-surface-variant mb-6">
              {t('donate.successBody')}
            </p>
            <button
              onClick={handleClose}
              className="w-full bg-primary text-on-primary py-3 rounded-xl font-semibold hover:opacity-90 active:scale-95 transition-all"
            >
              {t('donate.done')}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-6 border-b border-outline-variant">
              <div>
                <h2 className="text-xl font-bold text-primary">{t('common.donateNow')}</h2>
                <p className="text-[14px] text-on-surface-variant mt-1">{campaignTitle}</p>
              </div>
              <button onClick={handleClose} className="text-on-surface-variant hover:text-primary transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-error-container text-on-error-container text-[14px]">{error}</div>
              )}

              {!user && (
                <div className="p-4 rounded-xl bg-surface-container-low text-[14px] text-on-surface-variant">
                  {t('donate.signInNotice')}
                </div>
              )}

              <div className="p-4 rounded-xl bg-surface-container-low">
                <div className="flex justify-between mb-2">
                  <span className="text-[14px] text-on-surface-variant">{t('donate.goal')}</span>
                  <span className="text-[14px] font-semibold">{formatKzt(campaign.goal_amount)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-[14px] text-on-surface-variant">{t('donate.raised')}</span>
                  <span className="text-[14px] font-semibold text-secondary">{formatKzt(campaign.raised_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[14px] text-on-surface-variant">{t('donate.remaining')}</span>
                  <span className="text-[14px] font-bold text-primary">{formatKzt(remaining)}</span>
                </div>
                <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden mt-3">
                  <div
                    className="h-full bg-secondary rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, Math.round((campaign.raised_amount / campaign.goal_amount) * 100)))}%` }}
                  />
                </div>
              </div>

              <div>
                <p className="text-[14px] font-semibold mb-2">{t('donate.paymentType')}</p>
                <div className="space-y-2">
                  <button
                    onClick={() => setPaymentType('full')}
                    className={`w-full p-3 rounded-xl border-2 transition-all flex items-center gap-3 text-left ${
                      paymentType === 'full' ? 'border-secondary bg-secondary-container/10' : 'border-outline-variant'
                    }`}
                  >
                    <CreditCard size={20} className={paymentType === 'full' ? 'text-secondary' : 'text-on-surface-variant'} />
                    <div>
                      <p className="text-[14px] font-semibold">{t('donate.full')}</p>
                      <p className="text-[14px] text-on-surface-variant">{t('donate.fullDesc', { amount: formatKzt(remaining) })}</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentType('partial')}
                    className={`w-full p-3 rounded-xl border-2 transition-all flex items-center gap-3 text-left ${
                      paymentType === 'partial' ? 'border-secondary bg-secondary-container/10' : 'border-outline-variant'
                    }`}
                  >
                    <CreditCard size={20} className={paymentType === 'partial' ? 'text-secondary' : 'text-on-surface-variant'} />
                    <div>
                      <p className="text-[14px] font-semibold">{t('donate.partial')}</p>
                      <p className="text-[14px] text-on-surface-variant">{t('donate.partialDesc')}</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentType('subscription')}
                    className={`w-full p-3 rounded-xl border-2 transition-all flex items-center gap-3 text-left ${
                      paymentType === 'subscription' ? 'border-secondary bg-secondary-container/10' : 'border-outline-variant'
                    }`}
                  >
                    <Repeat size={20} className={paymentType === 'subscription' ? 'text-secondary' : 'text-on-surface-variant'} />
                    <div>
                      <p className="text-[14px] font-semibold">{t('donate.subscription')}</p>
                      <p className="text-[14px] text-on-surface-variant">{t('donate.subscriptionDesc')}</p>
                    </div>
                  </button>
                </div>
              </div>

              {paymentType === 'partial' && (
                <div>
                  <label className="block text-[14px] font-semibold mb-2">{t('donate.amountLabel')}</label>
                  <input
                    type="number"
                    min="100"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={t('donate.amountPlaceholder')}
                    className="w-full p-3 rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                  />
                </div>
              )}

              {paymentType === 'subscription' && (
                <div>
                  <label className="block text-[14px] font-semibold mb-2">{t('donate.monthlyLimit')}</label>
                  <input
                    type="number"
                    min="1000"
                    value={monthlyLimit}
                    onChange={(e) => setMonthlyLimit(e.target.value)}
                    placeholder={t('donate.monthlyLimitPlaceholder')}
                    className="w-full p-3 rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                  />
                  <p className="text-[14px] text-on-surface-variant mt-2">
                    {t('donate.monthlyDesc')}
                  </p>
                </div>
              )}

              <button
                onClick={handleDonate}
                disabled={loading}
                className="w-full bg-primary text-on-primary py-4 rounded-xl font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? t('donate.processing') : user ? t('donate.confirm') : t('donate.signInToDonate')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}