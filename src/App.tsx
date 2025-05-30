import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { CompanySettingsProvider } from "@/contexts/CompanySettingsContext";
import { Layout } from "@/components/Layout";
import { PageLoader } from "@/components/PageLoader";
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
import Hotels from "@/pages/Hotels";
import NotFound from "@/pages/NotFound";
import DataDebug from "@/pages/DataDebug";
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
          <LoadingProvider>
            <CompanySettingsProvider>
              <PageLoader />
              <SupabaseConnectionCheck />
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="leads" element={<Leads />} />
                  <Route path="customers" element={<Customers />} />
                  <Route path="itineraries" element={<Itineraries />} />
                  <Route path="itineraries/builder/:id" element={<ItineraryBuilder />} />
                  <Route path="bookings" element={<Bookings />} />
                  <Route path="payments" element={<Payments />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="calendar" element={<Calendar />} />
                  <Route path="transfers" element={<Transfers />} />
                  <Route path="hotels" element={<Hotels />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="debug" element={<DataDebug />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </CompanySettingsProvider>
          </LoadingProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
