import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import DonationModal from "@/components/DonationModal";
import IntroCardsModal from "@/components/IntroCardsModal";
import ProtectedRoute from "@/components/ProtectedRoute";
import type { Campaign } from "@/lib/types";

const LandingPage = lazy(() => import("@/pages/LandingPage"));
const BrowseRequests = lazy(() => import("@/pages/BrowseRequests"));
const ImpactDashboard = lazy(() => import("@/pages/ImpactDashboard"));
const CreateRequest = lazy(() => import("@/pages/CreateRequest"));
const PartnerStores = lazy(() => import("@/pages/PartnerStores"));
const AdminReview = lazy(() => import("@/pages/AdminReview"));
const MyDonations = lazy(() => import("@/pages/MyDonations"));
const MyRequests = lazy(() => import("@/pages/MyRequests"));
const PartnerDashboard = lazy(() => import("@/pages/PartnerDashboard"));
const Terms = lazy(() => import("@/pages/Terms"));
const Privacy = lazy(() => import("@/pages/Privacy"));

export default function App() {
  const [authOpen, setAuthOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const [donationCampaign, setDonationCampaign] = useState<Campaign | null>(
    null,
  );
  const { t } = useI18n();

  const openAuth = () => setAuthOpen(true);
  const openIntro = () => setIntroOpen(true);
  const closeIntro = () => setIntroOpen(false);

  // Auto-open onboarding on first visit.
  useEffect(() => {
    if (!localStorage.getItem("senim_onboarding_completed")) {
      setIntroOpen(true);
    }
  }, []);
  const openDonate = () => {
    setDonationCampaign({
      id: "general",
      title: t("app.generalDonation.title"),
      description: t("app.generalDonation.description"),
      category: "grocery",
      region: "Almaty",
      goal_amount: 50000,
      raised_amount: 25000,
      urgency: "urgent",
      status: "active",
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
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-[50vh] text-on-surface-variant">
                  {t("common.loading")}
                </div>
              }
            >
              <Routes>
                <Route
                  path="/"
                  element={<LandingPage onLoginClick={openAuth} />}
                />
                <Route
                  path="/browse"
                  element={
                    <BrowseRequests onDonateClick={setDonationCampaign} />
                  }
                />
                <Route path="/partners" element={<PartnerStores />} />
                <Route
                  path="/create-request"
                  element={
                    <ProtectedRoute
                      requireRole="susn"
                      requireVerified
                      onLoginClick={openAuth}
                    >
                      <CreateRequest onLoginClick={openAuth} />
                    </ProtectedRoute>
                  }
                />
                <Route path="/impact" element={<ImpactDashboard />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requireRole="admin" onLoginClick={openAuth}>
                      <AdminReview />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-donations"
                  element={
                    <ProtectedRoute requireRole="donor" onLoginClick={openAuth}>
                      <MyDonations />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-requests"
                  element={
                    <ProtectedRoute requireRole="susn" onLoginClick={openAuth}>
                      <MyRequests />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/partner-dashboard"
                  element={
                    <ProtectedRoute
                      requireRole="partner"
                      onLoginClick={openAuth}
                    >
                      <PartnerDashboard />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Suspense>
          </div>
          <Footer onOpenIntro={openIntro} />
          <IntroCardsModal open={introOpen} onClose={closeIntro} />
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
