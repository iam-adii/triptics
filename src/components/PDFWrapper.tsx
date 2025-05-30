import React, { useEffect, useState } from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { supabase } from '@/integrations/supabase/client';
import PaymentReceipt from './PaymentReceipt';
import ItineraryPDF from './itinerary/ItineraryPDF';
import { Button } from './ui/button';
import { Loader2, Download, AlertTriangle } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { getCompanySettings } from '@/utils/pdf';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PDFWrapperProps {
  type: 'payment' | 'itinerary';
  data: any;
  companySettings?: any;
  showPaid?: boolean;
}

const PDFWrapper: React.FC<PDFWrapperProps> = ({ type, data, companySettings: propCompanySettings, showPaid }) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [dbCompanySettings, setDbCompanySettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch company settings from database if not provided via props
        if (!propCompanySettings) {
          console.log('Fetching company settings from database...');
          const settings = await getCompanySettings();
          console.log('Retrieved company settings:', settings);
          setDbCompanySettings(settings);
        } else {
          console.log('Using provided company settings:', propCompanySettings);
        }
        
        // Fetch user avatar
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        
        const { data: userData, error } = await supabase
          .from('user_settings')
          .select('avatar_url')
          .eq('user_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user avatar:', error);
        } else if (userData?.avatar_url) {
          console.log('Found user avatar:', userData.avatar_url);
          // Ensure the URL is accessible by adding a cache-busting parameter
          const url = new URL(userData.avatar_url);
          url.searchParams.append('t', Date.now().toString());
          setAvatarUrl(url.toString());
        } else {
          console.log('No avatar found for user');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [propCompanySettings]);

  // Use provided company settings or ones from database
  const finalCompanySettings = propCompanySettings || dbCompanySettings;
  
  useEffect(() => {
    console.log('Final company settings being used:', finalCompanySettings);
  }, [finalCompanySettings]);

  // Check if we have real company settings 
  const hasCompanySettings = finalCompanySettings && 
    finalCompanySettings.name && 
    finalCompanySettings.name !== "Your Company Name";

  const renderPDF = () => {
    if (type === 'payment') {
      return (
        <PaymentReceipt 
          payment={data} 
          companySettings={finalCompanySettings} 
          showPaid={showPaid}
          avatarUrl={avatarUrl}
        />
      );
    } else if (type === 'itinerary') {
      return (
        <ItineraryPDF 
          itinerary={data.itinerary} 
          days={data.days} 
          activities={data.activities} 
          companySettings={finalCompanySettings}
          avatarUrl={avatarUrl}
        />
      );
    }
    return null;
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const pdfDoc = renderPDF();
      if (!pdfDoc) return;
      
      const blob = await pdf(pdfDoc).toBlob();
      const fileName = `${type === 'payment' ? 'receipt' : 'itinerary'}-${Date.now()}.pdf`;
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Error generating PDF for download:', error);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mr-2" />
        <span>Loading PDF...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {!hasCompanySettings && (
        <Alert className="mb-2 bg-amber-50 border-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <AlertDescription className="text-amber-700">
            You haven't set up your company details yet. The PDF will use placeholder text. 
            <Link to="/settings" className="ml-1 text-amber-600 hover:underline font-medium">
              Configure company settings
            </Link>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="w-full h-[600px]">
        <PDFViewer width="100%" height="100%" className="border rounded">
          {renderPDF()}
        </PDFViewer>
      </div>
      
      <div className="flex justify-end">
        <Button 
          onClick={handleDownload} 
          disabled={downloading} 
          className="bg-emerald-500 hover:bg-emerald-600"
        >
          {downloading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Preparing download...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PDFWrapper; 