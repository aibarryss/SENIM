import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import DonationModal from '@/components/DonationModal';
import LandingPage from '@/pages/LandingPage';
import BrowseRequests from '@/pages/BrowseRequests';
import ImpactDashboard from '@/pages/ImpactDashboard';
import type { Campaign } from '@/lib/types';

export default function App() {
  const [authOpen, setAuthOpen] = useState(false);
  const [donationCampaign, setDonationCampaign] = useState<Campaign | null>(null);

  const openAuth = () => setAuthOpen(true);
  const openDonate = () => {
    setDonationCampaign({
      id: 'general',
      title: 'General Donation',
      description: 'Support the most urgent requests on SENIM',
      category: 'grocery',
      region: 'Almaty',
      goal_amount: 50000,
      raised_amount: 25000,
      urgency: 'urgent',
      status: 'active',
      image_url: null,
      partner_id: null,
      created_at: new Date().toISOString(),
    });
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Navbar onLoginClick={openAuth} onDonateClick={openDonate} />
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage onLoginClick={openAuth} />} />
              <Route path="/browse" element={<BrowseRequests onDonateClick={setDonationCampaign} />} />
              <Route path="/impact" element={<ImpactDashboard />} />
            </Routes>
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
