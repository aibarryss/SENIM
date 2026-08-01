import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import type { CampaignCategory } from '@/lib/types';

interface CreateRequestProps {
  onLoginClick: () => void;
}

const cityNames = ['Almaty', 'Astana', 'Shymkent', 'Karaganda', 'Aktobe'];

const categoryOptions: { value: CampaignCategory; labelKey: 'browse.cat.grocery' | 'browse.cat.medicine' | 'browse.cat.winter' | 'browse.cat.education' }[] = [
  { value: 'grocery', labelKey: 'browse.cat.grocery' },
  { value: 'medicine', labelKey: 'browse.cat.medicine' },
  { value: 'winter', labelKey: 'browse.cat.winter' },
  { value: 'education', labelKey: 'browse.cat.education' },
];

export default function CreateRequest({ onLoginClick }: CreateRequestProps) {
  const { user, profile, loading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CampaignCategory>('grocery');
  const [region, setRegion] = useState(cityNames[0]);
  const [goalAmount, setGoalAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-xl flex items-center justify-center min-h-[50vh]">
        <Loader2 size={32} className="animate-spin text-secondary" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-xl">
        <div className="max-w-lg mx-auto text-center p-8 rounded-2xl bg-surface-container-low">
          <p className="text-[16px] text-on-surface-variant mb-6">{t('createRequest.notAuthorized')}</p>
          <button
            onClick={onLoginClick}
            className="px-8 py-3 bg-primary text-on-primary rounded-xl font-semibold hover:opacity-90 active:scale-95 transition-all"
          >
            {t('common.signIn')}
          </button>
        </div>
      </main>
    );
  }

  if (profile?.role !== 'susn' || !profile?.verified) {
    return (
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-xl">
        <div className="max-w-lg mx-auto text-center p-8 rounded-2xl bg-surface-container-low">
          <p className="text-[16px] text-on-surface-variant">{t('createRequest.notVerified')}</p>
        </div>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amount = parseFloat(goalAmount);
    if (!amount || amount <= 0) {
      setError(t('createRequest.submitError'));
      return;
    }

    setSubmitting(true);
    const { error: insertError } = await supabase.from('campaigns').insert({
      title,
      description,
      category,
      region,
      goal_amount: amount,
      raised_amount: 0,
      urgency: null,
      status: 'active',
      image_url: null,
      partner_id: null,
    });
    setSubmitting(false);

    if (insertError) {
      setError(t('createRequest.submitError'));
      return;
    }
    setSuccess(true);
  };

  if (success) {
    return (
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-xl">
        <div className="max-w-lg mx-auto text-center p-8 rounded-2xl bg-surface-container-low">
          <div className="w-16 h-16 rounded-full bg-secondary-container mx-auto flex items-center justify-center mb-4">
            <CheckCircle size={32} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-primary mb-2">{t('createRequest.successTitle')}</h2>
          <p className="text-[14px] text-on-surface-variant mb-6">{t('createRequest.successBody')}</p>
          <button
            onClick={() => navigate('/browse')}
            className="w-full bg-primary text-on-primary py-3 rounded-xl font-semibold hover:opacity-90 active:scale-95 transition-all"
          >
            {t('createRequest.goToBrowse')}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-xl">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-[32px] leading-10 font-bold text-primary mb-2">{t('createRequest.title')}</h1>
        <p className="text-[18px] leading-7 text-on-surface-variant mb-8">{t('createRequest.subtitle')}</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error-container text-on-error-container text-[14px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[14px] font-semibold mb-2">{t('createRequest.titleLabel')}</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('createRequest.titlePlaceholder')}
              className="w-full p-3 rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
            />
          </div>

          <div>
            <label className="block text-[14px] font-semibold mb-2">{t('createRequest.descriptionLabel')}</label>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('createRequest.descriptionPlaceholder')}
              className="w-full p-3 rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none resize-y"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[14px] font-semibold mb-2">{t('createRequest.categoryLabel')}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CampaignCategory)}
                className="w-full p-3 rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none bg-surface-container-lowest"
              >
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[14px] font-semibold mb-2">{t('createRequest.regionLabel')}</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full p-3 rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none bg-surface-container-lowest"
              >
                {cityNames.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[14px] font-semibold mb-2">{t('createRequest.goalAmountLabel')}</label>
            <input
              type="number"
              required
              min="1"
              value={goalAmount}
              onChange={(e) => setGoalAmount(e.target.value)}
              placeholder={t('createRequest.goalAmountPlaceholder')}
              className="w-full p-3 rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-on-primary py-4 rounded-xl font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
          >
            {submitting ? t('createRequest.submitLoading') : t('createRequest.submit')}
          </button>
        </form>
      </div>
    </main>
  );
}