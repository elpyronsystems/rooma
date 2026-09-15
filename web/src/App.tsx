import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { OtpVerificationPage } from "./pages/OtpVerificationPage";
import { HomePage } from "./pages/HomePage";
import { HotelsPage } from "./pages/HotelsPage";
import { PropertiesPage } from "./pages/PropertiesPage";
import { HostelsListingPage } from "./pages/HostelsListingPage";
import { ExplorePage } from "./pages/ExplorePage";
import { InstitutionsPage } from "./pages/InstitutionsPage";
import { CSuitePage } from "./pages/CSuitePage";
import { AboutPage } from "./pages/AboutPage";
import { ListingDetailPage } from "./pages/ListingDetailPage";
import { SavedListingsPage } from "./pages/SavedListingsPage";
import { MyBookingsPage } from "./pages/MyBookingsPage";
import { OwnerBookingsPage } from "./pages/OwnerBookingsPage";
import { CreateListingPage } from "./pages/CreateListingPage";
import { MyListingsPage } from "./pages/MyListingsPage";
import { EditListingPage } from "./pages/EditListingPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { OwnerPaymentsPage } from "./pages/OwnerPaymentsPage";
import { OwnerPayoutSettingsPage } from "./pages/OwnerPayoutSettingsPage";
import { AdminPayoutSettingsPage } from "./pages/AdminPayoutSettingsPage";
import { ContactUsPage } from "./pages/ContactUsPage";
import { SupportPage } from "./pages/SupportPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AdminListingsPage } from "./pages/AdminListingsPage";
import { AdminSupportPage } from "./pages/AdminSupportPage";
import { AdminAccessPage } from "./pages/AdminAccessPage";
import { AdminDocumentsPage } from "./pages/AdminDocumentsPage";
import { AdminAnalyticsPage } from "./pages/AdminAnalyticsPage";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify" element={<OtpVerificationPage />} />
          <Route path="/hotels" element={<HotelsPage />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/hostels" element={<HostelsListingPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/institutions" element={<InstitutionsPage />} />
          <Route path="/c-suite" element={<CSuitePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/listings/:id" element={<ListingDetailPage />} />
          <Route path="/saved" element={<SavedListingsPage />} />
          <Route path="/bookings" element={<MyBookingsPage />} />
          <Route path="/owner/bookings" element={<OwnerBookingsPage />} />
          <Route path="/listings/new" element={<CreateListingPage />} />
          <Route path="/listings/mine" element={<MyListingsPage />} />
          <Route path="/listings/:id/edit" element={<EditListingPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/owner/payments" element={<OwnerPaymentsPage />} />
          <Route path="/owner/payout-settings" element={<OwnerPayoutSettingsPage />} />
          <Route path="/admin/payout-settings" element={<AdminPayoutSettingsPage />} />
          <Route path="/owner/contact" element={<ContactUsPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/listings" element={<AdminListingsPage />} />
          <Route path="/admin/support" element={<AdminSupportPage />} />
          <Route path="/admin" element={<AdminUsersPage />} />
          <Route path="/admin-access" element={<AdminAccessPage />} />
          <Route path="/admin/documents" element={<AdminDocumentsPage />} />
          <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
