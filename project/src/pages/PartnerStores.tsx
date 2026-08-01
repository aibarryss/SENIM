import { useEffect, useState } from 'react';
import { Store, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';
import { cityLabel } from '@/lib/cities';
import type { Partner } from '@/lib/types';

export default function PartnerStores() {
  const { t } = useI18n();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('partners')
      .select('*')
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching partners:', error);
        }
        setPartners((data as Partner[]) || []);
        setLoading(false);
      });
  }, []);

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-xl">
      {/* Page Header */}
      <div className="mb-stack-xl">
        <h1 className="text-[32px] leading-10 font-bold mb-2">{t('partners.title')}</h1>
        <p className="text-[18px] leading-7 text-on-surface-variant max-w-2xl">
          {t('partners.subtitle')}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-secondary" />
        </div>
      ) : partners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Store size={48} className="text-outline-variant mb-4" />
          <p className="text-[18px] text-on-surface-variant">{t('partners.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {partners.map((partner) => (
            <div
              key={partner.id}
              className="bg-surface-container-lowest rounded-xl overflow-hidden card-shadow flex flex-col group hover:translate-y-[-4px] transition-transform duration-300"
            >
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0"
                    style={{ backgroundColor: partner.logo_color }}
                  >
                    {partner.logo_letter}
                  </div>
                  <div>
                    <h3 className="text-[20px] font-semibold">{partner.name}</h3>
                    <p className="text-[14px] text-on-surface-variant">{partner.type}</p>
                  </div>
                </div>
                <div className="mt-auto flex items-center gap-2 text-[14px] text-on-surface-variant">
                  <MapPin size={16} className="text-secondary shrink-0" />
                  {cityLabel(partner.city, t)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}