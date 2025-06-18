import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { CompanySettingsProvider } from "@/contexts/CompanySettingsContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { Layout } from "@/components/Layout";
import { PageLoader } from "@/components/PageLoader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "@/pages/Dashboard";
import Leads from "@/pages/Leads";
import Customers from "@/pages/Customers";
import Itineraries from "@/pages/Itineraries";
import ItineraryBuilder from "@/pages/ItineraryBuilder";
import Bookings from "@/pages/Bookings";
import Payments from "@/pages/Payments";
import Reports from "@/pages/Reports";
import Calendar from "@/pages/Calendar";
import Settings from "@/pages/Settings";
import Transfers from "@/pages/Transfers";
import TransferRoutes from "@/pages/TransferRoutes";
import Hotels from "@/pages/Hotels";
import NotFound from "@/pages/NotFound";
import DataDebug from "@/pages/DataDebug";
import Login from "@/pages/Login";
import AccessDenied from "@/pages/AccessDenied";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

// Component to check Supabase connection on app start
const SupabaseConnectionCheck = () => {
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Test connection with a simple query
        const { data, error } = await supabase
          .from('bookings')
          .select('id')
          .limit(1);
        
        if (error) {
          console.error("Supabase connection test failed:", error.message);
          toast.error("Database connection issue. Some data may not load correctly.");
        } else {
          console.log("Supabase connection successful", data ? "Data received" : "No data");
        }
      } catch (err) {
        console.error("Unexpected error during connection check:", err);
      }
    };

    // Run check after a short delay to not block app startup
    const timer = setTimeout(checkConnection, 1000);
    return () => clearTimeout(timer);
  }, []);

  return null; // This component doesn't render anything
};

// Global error handler for unhandled errors
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
    
    // Only show toast for Supabase or data-related errors
    if (event.reason && 
        (event.reason.message?.includes('supabase') || 
         event.reason.message?.includes('network') ||
         event.reason.message?.includes('data'))) {
      toast.error("Data loading error. Please check your connection.");
    }
  });
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster 
          position="top-right" 
          richColors 
          closeButton
        />
        <BrowserRouter>
          <AuthProvider>
            <NotificationProvider>
              <LoadingProvider>
                <CompanySettingsProvider>
                  <PageLoader />
                  <SupabaseConnectionCheck />
                  <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/access-denied" element={<AccessDenied />} />
                    
                    {/* Protected routes */}
                    <Route element={<ProtectedRoute />}>
                      <Route element={<Layout />}>
                        <Route path="/" element={<ProtectedRoute pageId="dashboard"><Dashboard /></ProtectedRoute>} />
                        <Route path="leads" element={<ProtectedRoute pageId="leads"><Leads /></ProtectedRoute>} />
                        <Route path="customers" element={<ProtectedRoute pageId="customers"><Customers /></ProtectedRoute>} />
                        <Route path="itineraries" element={<ProtectedRoute pageId="itineraries"><Itineraries /></ProtectedRoute>} />
                        <Route path="itineraries/builder/:id" element={<ProtectedRoute pageId="itineraries"><ItineraryBuilder /></ProtectedRoute>} />
                        <Route path="bookings" element={<ProtectedRoute pageId="bookings"><Bookings /></ProtectedRoute>} />
                        <Route path="payments" element={<ProtectedRoute pageId="payments"><Payments /></ProtectedRoute>} />
                        <Route path="reports" element={<ProtectedRoute pageId="reports"><Reports /></ProtectedRoute>} />
                        <Route path="calendar" element={<ProtectedRoute pageId="calendar"><Calendar /></ProtectedRoute>} />
                        <Route path="transfers" element={<ProtectedRoute pageId="transfers"><Transfers /></ProtectedRoute>} />
                        <Route path="transfer-routes" element={<ProtectedRoute pageId="transfers"><TransferRoutes /></ProtectedRoute>} />
                        <Route path="hotels" element={<ProtectedRoute pageId="hotels"><Hotels /></ProtectedRoute>} />
                        <Route path="settings" element={<ProtectedRoute pageId="settings"><Settings /></ProtectedRoute>} />
                        <Route path="debug" element={<ProtectedRoute pageId="dashboard"><DataDebug /></ProtectedRoute>} />
                        <Route path="*" element={<NotFound />} />
                      </Route>
                    </Route>
                  </Routes>
                </CompanySettingsProvider>
              </LoadingProvider>
            </NotificationProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
