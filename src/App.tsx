import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { PublicLayout } from "@/components/PublicLayout";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";

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
import TaxReturnPage from "./pages/TaxReturnPage";
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
      <AuthProvider>
        <AppProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              {/* Public marketing routes — no auth required */}
              <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
              <Route path="/features" element={<PublicLayout><FeaturesPage /></PublicLayout>} />
              <Route path="/tax-guide" element={<PublicLayout><TaxGuidePage /></PublicLayout>} />
              <Route path="/pricing" element={<PublicLayout><PricingPage /></PublicLayout>} />
              <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />

              {/* Auth routes — standalone layout */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected app routes — requires authenticated user */}
              <Route path="/app" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
              <Route path="/app/income" element={<ProtectedRoute><AppLayout><IncomePage /></AppLayout></ProtectedRoute>} />
              <Route path="/app/calculator" element={<ProtectedRoute><AppLayout><CalculatorPage /></AppLayout></ProtectedRoute>} />
              <Route path="/app/history" element={<ProtectedRoute><AppLayout><HistoryPage /></AppLayout></ProtectedRoute>} />
              <Route path="/app/profile" element={<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />
              <Route path="/app/tax-return" element={<ProtectedRoute><AppLayout><TaxReturnPage /></AppLayout></ProtectedRoute>} />

              {/* Admin routes — requires admin role */}
              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
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
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
