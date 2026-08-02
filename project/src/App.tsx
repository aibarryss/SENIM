import { lazy, Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import DonationModal from '@/components/DonationModal';
import ProtectedRoute from '@/components/ProtectedRoute';
import type { Campaign } from '@/lib/types';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const BrowseRequests = lazy(() => import('@/pages/BrowseRequests'));
const ImpactDashboard = lazy(() => import('@/pages/ImpactDashboard'));
const CreateRequest = lazy(() => import('@/pages/CreateRequest'));
const PartnerStores = lazy(() => import('@/pages/PartnerStores'));
const AdminReview = lazy(() => import('@/pages/AdminReview'));

export default function App() {
  const [authOpen, setAuthOpen] = useState(false);
  const [donationCampaign, setDonationCampaign] = useState<Campaign | null>(null);
  const { t } = useI18n();

  const openAuth = () => setAuthOpen(true);
  const openDonate = () => {
    setDonationCampaign({
      id: 'general',
      title: t('app.generalDonation.title'),
      description: t('app.generalDonation.description'),
      category: 'grocery',
      region: 'Almaty',
      goal_amount: 50000,
      raised_amount: 25000,
      urgency: 'urgent',
      status: 'active',
      image_url: null,
      partner_id: null,
      creator_id: null,
      created_at: new Date().toISOString(),
    });
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Navbar onLoginClick={openAuth} onDonateClick={openDonate} />
          <div className="flex-1">
            <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh] text-on-surface-variant">{t('common.loading')}</div>}>
              <Routes>
                <Route path="/" element={<LandingPage onLoginClick={openAuth} />} />
                <Route path="/browse" element={<BrowseRequests onDonateClick={setDonationCampaign} />} />
                <Route path="/partners" element={<PartnerStores />} />
                <Route
                  path="/create-request"
                  element={
                    <ProtectedRoute requireRole="susn" requireVerified onLoginClick={openAuth}>
                      <CreateRequest onLoginClick={openAuth} />
                    </ProtectedRoute>
                  }
                />
                <Route path="/impact" element={<ImpactDashboard />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requireRole="admin" onLoginClick={openAuth}>
                      <AdminReview />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Suspense>
          </div>
          <Footer />
          <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
          <DonationModal
            campaign={donationCampaign}
            open={donationCampaign !== null}
            onClose={() => setDonationCampaign(null)}
            onRequireAuth={openAuth}
          />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}