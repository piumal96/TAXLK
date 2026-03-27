import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { AppLayout } from "@/components/AppLayout";
import { PublicLayout } from "@/components/PublicLayout";
import { AdminLayout } from "@/components/admin/AdminLayout";

// Public pages
import LandingPage from "./pages/public/LandingPage";
import FeaturesPage from "./pages/public/FeaturesPage";
import TaxGuidePage from "./pages/public/TaxGuidePage";
import PricingPage from "./pages/public/PricingPage";
import ContactPage from "./pages/public/ContactPage";

// Auth pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// App pages
import Dashboard from "./pages/Dashboard";
import IncomePage from "./pages/IncomePage";
import CalculatorPage from "./pages/CalculatorPage";
import HistoryPage from "./pages/HistoryPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import TaxConfigPage from "./pages/admin/TaxConfigPage";
import UsersPage from "./pages/admin/UsersPage";
import AuditLogsPage from "./pages/admin/AuditLogsPage";
import SandboxPage from "./pages/admin/SandboxPage";
import CalculationsPage from "./pages/admin/CalculationsPage";
import IncomeSettingsPage from "./pages/admin/IncomeSettingsPage";
import SystemSettingsPage from "./pages/admin/SystemSettingsPage";
import ReportsPage from "./pages/admin/ReportsPage";
import RolesPage from "./pages/admin/RolesPage";
import NotificationsPage from "./pages/admin/NotificationsPage";
import AnalyticsPage from "./pages/admin/AnalyticsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public marketing routes */}
            <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
            <Route path="/features" element={<PublicLayout><FeaturesPage /></PublicLayout>} />
            <Route path="/tax-guide" element={<PublicLayout><TaxGuidePage /></PublicLayout>} />
            <Route path="/pricing" element={<PublicLayout><PricingPage /></PublicLayout>} />
            <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />

            {/* Auth routes (standalone layout) */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected app routes */}
            <Route path="/app" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/app/income" element={<AppLayout><IncomePage /></AppLayout>} />
            <Route path="/app/calculator" element={<AppLayout><CalculatorPage /></AppLayout>} />
            <Route path="/app/history" element={<AppLayout><HistoryPage /></AppLayout>} />
            <Route path="/app/profile" element={<AppLayout><ProfilePage /></AppLayout>} />

            {/* Admin routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="tax-config" element={<TaxConfigPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="calculations" element={<CalculationsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="income-settings" element={<IncomeSettingsPage />} />
              <Route path="settings" element={<SystemSettingsPage />} />
              <Route path="roles" element={<RolesPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="sandbox" element={<SandboxPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
