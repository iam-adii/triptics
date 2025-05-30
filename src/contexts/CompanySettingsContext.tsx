import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CompanySettings {
  id: string;
  name: string;
  website: string | null;
  address: string | null;
  country: string | null;
  timezone: string | null;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  created_at: string;
  updated_at: string;
}

interface CompanySettingsContextType {
  companySettings: CompanySettings | null;
  refreshCompanySettings: () => Promise<void>;
  loading: boolean;
}

// Default values for company settings
const defaultCompanySettings: CompanySettings = {
  id: "",
  name: "Triptics Travel Agency",
  website: "https://triptics.example.com",
  address: "123 Tourism Street, Travel City, 12345",
  country: "in",
  timezone: "ist",
  logo_url: null,
  phone: null,
  email: null,
  gstin: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const CompanySettingsContext = createContext<CompanySettingsContextType>({
  companySettings: defaultCompanySettings,
  refreshCompanySettings: async () => {},
  loading: true,
});

export const CompanySettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCompanySettings = async () => {
    setLoading(true);
    try {
      // Fetch company settings
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      // If we have data, use it, otherwise use defaults
      if (data) {
        // Use a type assertion to handle the data from the database
        // This is necessary because the database schema might not match our TypeScript type exactly
        const dbData = data as Partial<CompanySettings>;
        
        setCompanySettings({
          ...defaultCompanySettings,
          ...dbData
        });
      } else {
        setCompanySettings(defaultCompanySettings);
      }
    } catch (error: any) {
      console.error("Error fetching company settings:", error.message);
      // Use default settings if there was an error
      setCompanySettings(defaultCompanySettings);
    } finally {
      setLoading(false);
    }
  };

  // Listen for settings updated event
  useEffect(() => {
    // Handler for the custom event
    const handleSettingsUpdated = () => {
      fetchCompanySettings();
    };

    // Add event listener for the custom event
    window.addEventListener('company-settings-updated', handleSettingsUpdated);
    
    // Cleanup
    return () => {
      window.removeEventListener('company-settings-updated', handleSettingsUpdated);
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchCompanySettings();
  }, []);

  return (
    <CompanySettingsContext.Provider 
      value={{ 
        companySettings, 
        refreshCompanySettings: fetchCompanySettings,
        loading
      }}
    >
      {children}
    </CompanySettingsContext.Provider>
  );
};

// Custom hook for accessing company settings
export function useCompanySettings() {
  return useContext(CompanySettingsContext);
} 