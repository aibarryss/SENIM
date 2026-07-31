import { useEffect, useState, useCallback } from 'react';
import { ShieldCheck, Bell, Zap, BadgeCheck, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Campaign, CampaignCategory, CampaignUrgency } from '@/lib/types';

interface BrowseRequestsProps {
  onDonateClick: (campaign: Campaign) => void;
}

const categories: { key: CampaignCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All Categories' },
  { key: 'grocery', label: 'Grocery' },
  { key: 'medicine', label: 'Medicine' },
  { key: 'winter', label: 'Winter Clothing' },
  { key: 'education', label: 'Education' },
];

const regions = ['All of Kazakhstan', 'Almaty', 'Astana', 'Shymkent', 'Karaganda', 'Aktobe'];

const urgencyConfig: Record<string, { label: string; icon: typeof Bell; className: string }> = {
  urgent: { label: 'Urgent', icon: Bell, className: 'bg-error/10 text-error' },
  high_priority: { label: 'High Priority', icon: Zap, className: 'bg-error/10 text-error' },
  verified: { label: 'Verified', icon: BadgeCheck, className: 'bg-secondary-container/30 text-on-secondary-container' },
};

const fallbackImg = 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80';

export default function BrowseRequests({ onDonateClick }: BrowseRequestsProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<Set<CampaignCategory | 'all'>>(new Set(['all']));
  const [selectedRegion, setSelectedRegion] = useState('All of Kazakhstan');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('campaigns').select('*').eq('status', 'active').order('created_at', { ascending: false });

    const cats = Array.from(selectedCategories).filter((c) => c !== 'all') as CampaignCategory[];
    if (cats.length > 0) {
      query = query.in('category', cats);
    }
    if (selectedRegion !== 'All of Kazakhstan') {
      query = query.eq('region', selectedRegion);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching campaigns:', error);
    }
    setCampaigns((data as Campaign[]) || []);
    setLoading(false);
  }, [selectedCategories, selectedRegion]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const toggleCategory = (cat: CampaignCategory | 'all') => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (cat === 'all') {
        next.clear();
        next.add('all');
      } else {
        next.delete('all');
        if (next.has(cat)) {
          next.delete(cat);
        } else {
          next.add(cat);
        }
        if (next.size === 0) {
          next.add('all');
        }
      }
      return next;
    });
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(campaigns.length / pageSize));
  const paginated = campaigns.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatKzt = (n: number) => `₸${n.toLocaleString()}`;

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-xl">
      {/* Page Header */}
      <div className="mb-stack-xl">
        <h1 className="text-[32px] leading-10 font-bold mb-2">Urgent Assistance Requests</h1>
        <p className="text-[18px] leading-7 text-on-surface-variant max-w-2xl">
          Direct aid for families and individuals across Kazakhstan. Every tenge goes directly to the partner store to fulfill these specific needs.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-gutter">
        {/* Sidebar */}
        <aside className="w-full lg:w-72 shrink-0 space-y-8">
          <div>
            <h3 className="text-[14px] font-semibold text-primary uppercase tracking-wider mb-4">Categories</h3>
            <div className="space-y-3">
              {categories.map((cat) => (
                <label key={cat.key} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedCategories.has(cat.key)}
                    onChange={() => toggleCategory(cat.key)}
                    className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary accent-primary"
                  />
                  <span className="text-[16px] text-on-surface group-hover:text-primary transition-colors">{cat.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-outline-variant">
            <h3 className="text-[14px] font-semibold text-primary uppercase tracking-wider mb-4">Regions</h3>
            <select
              value={selectedRegion}
              onChange={(e) => {
                setSelectedRegion(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-3 rounded-lg border border-outline-variant text-[16px] focus:ring-primary focus:border-primary outline-none bg-surface-container-lowest"
            >
              {regions.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="p-6 bg-surface-container-low rounded-xl">
            <ShieldCheck size={24} className="text-secondary mb-2" />
            <h4 className="text-[20px] font-semibold mb-2">100% Transparent</h4>
            <p className="text-[14px] leading-5 text-on-surface-variant">
              Your contribution is paid directly to the merchant. SENIM takes 0% commission on individual requests.
            </p>
          </div>
        </aside>

        {/* Cards Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-surface-container-lowest rounded-xl overflow-hidden card-shadow animate-pulse">
                  <div className="h-64 bg-surface-container-high" />
                  <div className="p-6 space-y-3">
                    <div className="h-6 bg-surface-container-high rounded w-3/4" />
                    <div className="h-4 bg-surface-container-high rounded w-full" />
                    <div className="h-4 bg-surface-container-high rounded w-2/3" />
                    <div className="h-12 bg-surface-container-high rounded-xl mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-[18px] text-on-surface-variant">No requests match your filters.</p>
              <button
                onClick={() => {
                  setSelectedCategories(new Set(['all']));
                  setSelectedRegion('All of Kazakhstan');
                }}
                className="mt-4 px-6 py-2 bg-primary text-on-primary rounded-full font-semibold hover:opacity-90 transition-all"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                {paginated.map((campaign) => {
                  const pct = Math.round((campaign.raised_amount / campaign.goal_amount) * 100);
                  const urgency = campaign.urgency ? urgencyConfig[campaign.urgency] : null;
                  const UrgencyIcon = urgency?.icon;

                  return (
                    <div
                      key={campaign.id}
                      className="bg-surface-container-lowest rounded-xl overflow-hidden card-shadow flex flex-col group hover:translate-y-[-4px] transition-transform duration-300"
                    >
                      <div className="relative h-64 overflow-hidden">
                        <img
                          src={campaign.image_url || fallbackImg}
                          alt={campaign.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute top-4 left-4 flex gap-2">
                          <span className="bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1 rounded-full text-[12px] font-medium text-primary uppercase tracking-wider">
                            {campaign.category}
                          </span>
                          {urgency && UrgencyIcon && (
                            <span className={`${urgency.className} px-3 py-1 rounded-full text-[12px] font-medium flex items-center gap-1`}>
                              <UrgencyIcon size={14} /> {urgency.label}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-6 flex flex-col flex-1">
                        <h3 className="text-[20px] font-semibold mb-3">{campaign.title}</h3>
                        <p className="text-[16px] leading-6 text-on-surface-variant mb-6 line-clamp-3">{campaign.description}</p>
                        <div className="mt-auto space-y-4">
                          <div>
                            <div className="flex justify-between items-end mb-2">
                              <span className="text-[14px] font-semibold">
                                <span className="text-primary font-bold">{formatKzt(campaign.raised_amount)}</span>{' '}
                                <span className="text-on-surface-variant font-normal">of {formatKzt(campaign.goal_amount)}</span>
                              </span>
                              <span className="text-[14px] font-semibold text-secondary">{pct}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                              <div
                                className="h-full bg-secondary rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => onDonateClick(campaign)}
                            className="w-full bg-primary text-on-primary text-[14px] font-semibold py-4 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                          >
                            Donate Now <Heart size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-stack-xl flex justify-center items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-30"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg text-[14px] font-semibold transition-colors ${
                        page === currentPage
                          ? 'bg-primary text-on-primary'
                          : 'hover:bg-surface-container-high'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-30"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
