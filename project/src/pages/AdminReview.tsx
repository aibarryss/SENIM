import { useEffect, useState } from 'react';
import { Loader2, ShieldCheck, CheckCircle, XCircle, Clock, User, FileText, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';
import type { AiVerificationResult } from '@/lib/types';

interface AdminApplication {
  id: string;
  user_id: string;
  document_path: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewer_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  ai_result: AiVerificationResult | null;
  display_name: string | null;
  phone: string | null;
}

export default function AdminReview() {
  const { t } = useI18n();
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const loadApplications = async () => {
    setLoading(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc('admin_list_verification_requests');
    if (rpcError) {
      setError(rpcError.message);
      setApplications([]);
    } else {
      setApplications((data as AdminApplication[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    setReviewingId(id);
    setError(null);
    const { error: rpcError } = await supabase.rpc('admin_review_application', {
      p_request_id: id,
      p_status: status,
    });
    if (rpcError) {
      setError(rpcError.message);
    } else {
      await loadApplications();
    }
    setReviewingId(null);
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleString();

  const statusBadge = (status: string) => {
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle size={12} /> {t('admin.approved')}
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-red-100 text-red-800 border border-red-200">
          <XCircle size={12} /> {t('admin.rejected')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
        <Clock size={12} /> {t('admin.pending')}
      </span>
    );
  };

  const aiChecks = (ai: AiVerificationResult | null) => {
    if (!ai) return null;
    const checkLabels: Record<string, string> = {
      document_valid: t('admin.check.documentValid'),
      name_match: t('admin.check.nameMatch'),
      date_valid: t('admin.check.dateValid'),
    };
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[14px] text-on-surface-variant">{t('admin.confidence')}</span>
          <span className="text-[14px] font-semibold">{Math.round(ai.confidence * 100)}%</span>
        </div>
        <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
          <div
            className="h-full bg-secondary rounded-full transition-all"
            style={{ width: `${Math.min(100, Math.max(0, Math.round(ai.confidence * 100)))}%` }}
          />
        </div>
        <ul className="space-y-1">
          {ai.checks.map((check) => (
            <li key={check} className="flex items-center gap-2 text-[14px] text-on-surface-variant">
              <CheckCircle size={14} className="text-secondary shrink-0" />
              {checkLabels[check] ?? check}
            </li>
          ))}
        </ul>
        {ai.summary && (
          <p className="text-[13px] text-on-surface-variant italic">{ai.summary}</p>
        )}
      </div>
    );
  };

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-xl">
      <div className="mb-stack-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-secondary-container flex items-center justify-center text-secondary">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-[32px] leading-10 font-bold">{t('admin.title')}</h1>
            <p className="text-[16px] text-on-surface-variant">{t('admin.subtitle')}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-error bg-error-container/10 text-error text-[14px]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-secondary" />
        </div>
      ) : applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText size={48} className="text-outline-variant mb-4" />
          <p className="text-[18px] text-on-surface-variant">{t('admin.noApplications')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-[16px] font-semibold text-primary">
                      {app.display_name || t('admin.anonymous')}
                    </p>
                    <p className="text-[13px] text-on-surface-variant">
                      {app.phone || '—'} · {formatDate(app.created_at)}
                    </p>
                  </div>
                </div>
                {statusBadge(app.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-4 rounded-xl bg-surface-container-low">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-secondary" />
                    <p className="text-[14px] font-semibold">{t('admin.aiResult')}</p>
                  </div>
                  {aiChecks(app.ai_result)}
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low">
                  <p className="text-[14px] font-semibold mb-3">{t('admin.document')}</p>
                  <p className="text-[13px] text-on-surface-variant break-all">{app.document_path}</p>
                  {app.reviewer_note && (
                    <p className="text-[13px] text-on-surface-variant mt-3 italic">
                      {t('admin.reviewerNote')}: {app.reviewer_note}
                    </p>
                  )}
                </div>
              </div>

              {app.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleReview(app.id, 'approved')}
                    disabled={reviewingId === app.id}
                    className="flex-1 bg-secondary text-on-secondary py-3 rounded-xl font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {reviewingId === app.id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <CheckCircle size={18} />
                    )}
                    {t('admin.approve')}
                  </button>
                  <button
                    onClick={() => handleReview(app.id, 'rejected')}
                    disabled={reviewingId === app.id}
                    className="flex-1 bg-error text-on-error py-3 rounded-xl font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {reviewingId === app.id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <XCircle size={18} />
                    )}
                    {t('admin.reject')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}