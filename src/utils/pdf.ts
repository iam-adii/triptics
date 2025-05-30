import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';

// Add type declaration for jsPDF autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Types
export interface GeneratePDFOptions {
  title: string;
  content: {
    sections: {
      title?: string;
      rows: string[][];
    }[];
  };
  avatarUrl?: string | null;
}

// Fetch company settings
export const getCompanySettings = async () => {
  // Check if we have cached company settings
  if (typeof window !== 'undefined' && window.companySettingsCache) {
    return window.companySettingsCache;
  }
  
  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    // Cache the result for future use
    if (typeof window !== 'undefined') {
      window.companySettingsCache = data;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching company settings:', error);
    return null;
  }
};

// Function to generate PDF from HTML element
export const generatePDFFromHTML = async ({
  elementId,
  fileName,
  title,
  additionalData,
  avatarUrl
}: {
  elementId: string;
  fileName?: string;
  title?: string;
  additionalData?: any;
  avatarUrl?: string | null;
}) => {
  try {
    // Get company settings
    const companySettings = await getCompanySettings();
    
    // Get the HTML element
    const element = document.getElementById(elementId);
    if (!element) throw new Error(`Element with ID ${elementId} not found`);
    
    // Use html2canvas to render the element to a canvas
    const canvas = await html2canvas(element, { 
      scale: 2,
      logging: false,
      useCORS: true 
    });
    
    // Create a new jsPDF instance
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    // Get dimensions
    const imgData = canvas.toDataURL('image/png');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    // Add company header and avatar if available
    if (avatarUrl) {
      try {
        // Add user avatar
        pdf.addImage(avatarUrl, 'PNG', 10, 10, 20, 20);
        
        // Add company name and details
        pdf.setFontSize(16);
        pdf.setTextColor(16, 185, 129); // Use emerald color
        pdf.text(companySettings?.name || 'Triptics', 35, 15);
        
        // Remove the tagline
        // Use default contact info from company settings if available
        pdf.setFontSize(8);
        pdf.setTextColor(107, 114, 128); // Gray color
        
        if (companySettings?.address) {
          pdf.text(companySettings.address, 35, 22);
        }
        
        const contactInfo = [
          companySettings?.phone,
          companySettings?.email,
          companySettings?.website
        ].filter(Boolean).join(' | ');
        
        if (contactInfo) {
          pdf.text(contactInfo, 35, 28);
        }
        
        if (companySettings?.gstin) {
          pdf.text(`GSTIN: ${companySettings.gstin}`, 35, 34);
        }
        
        // Add title if provided
        if (title) {
          pdf.setFontSize(20);
          pdf.setTextColor(0, 0, 0);
          pdf.text(title, 10, 45);
        }
        
        // Add the content
        pdf.addImage(imgData, 'PNG', 0, 50, pdfWidth, pdfHeight);
      } catch (avatarError) {
        console.warn('Error adding avatar to PDF:', avatarError);
        // If avatar fails, just add content without it
        pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
      }
    } else {
      // No avatar, just add content
      pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
    }
    
    // Add footer with company name and date
    const footerText = `${companySettings?.name || 'Generated'} • ${format(new Date(), 'MMMM d, yyyy')}`;
    pdf.setFontSize(8);
    pdf.setTextColor(107, 114, 128);
    pdf.text(footerText, pdf.internal.pageSize.getWidth() / 2, pdf.internal.pageSize.getHeight() - 10, { align: 'center' });
    
    // Save the PDF
    return pdf.output('blob');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

// Declare TypeScript interface for window object with our cache
declare global {
  interface Window {
    companySettingsCache?: any;
  }
}

/**
 * Generate a PDF from structured content
 */
export async function generatePDF({ title, content, avatarUrl }: GeneratePDFOptions): Promise<Blob> {
  try {
    // Get company settings
    const companySettings = await getCompanySettings();

    // Create a new document
    const pdf = new jsPDF();
    
    // Set document properties
    pdf.setProperties({
      title: title,
      subject: "Generated Document",
      author: companySettings?.name || "Triptics",
      keywords: "pdf, triptics, transfer",
      creator: "Triptics PDF Generator",
    });
    
    // Add a subtle border around the page
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.setDrawColor(230, 230, 230);
    pdf.setLineWidth(0.5);
    pdf.rect(5, 5, pageWidth - 10, pageHeight - 10);
    
    // Add company details
    pdf.setFontSize(20);
    pdf.setTextColor(39, 174, 96); // emerald-500
    pdf.text(companySettings?.name || 'Travel Agency', 10, 20);
    
    // Add company address and contact info if available
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    
    let yPos = 28;
    
    if (companySettings?.address) {
      pdf.text(companySettings.address, 10, yPos);
      yPos += 6;
    }
    
    const contactInfo = [
      companySettings?.phone,
      companySettings?.email
    ].filter(Boolean).join(' | ');
    
    if (contactInfo) {
      pdf.text(contactInfo, 10, yPos);
      yPos += 6;
    }
    
    if (companySettings?.website) {
      pdf.text(companySettings.website, 10, yPos);
      yPos += 6;
    }
    
    if (companySettings?.gstin) {
      pdf.text(`GSTIN: ${companySettings.gstin}`, 10, yPos);
      yPos += 10; // Extra spacing after the last company detail
    } else {
      yPos += 4; // Add some spacing even if GSTIN is not present
    }
    
    // Add avatar if available
    if (avatarUrl) {
      try {
        pdf.addImage(avatarUrl, 'PNG', pdf.internal.pageSize.getWidth() - 30, 10, 20, 20);
      } catch (avatarError) {
        console.warn('Error adding avatar to PDF:', avatarError);
      }
    }
    
    // Add a horizontal line to separate company info from content
    // Position the line based on the last company detail
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(10, yPos, pdf.internal.pageSize.getWidth() - 10, yPos);
    
    // Add document header with more spacing - position relative to the separator line
    yPos += 8; // Space after the separator line
    
    // Style the title more prominently
    pdf.setFontSize(18);
    pdf.setTextColor(16, 120, 85); // Darker emerald color for better visibility
    pdf.setFont("helvetica", "bold");
    pdf.text(title, 10, yPos);
    pdf.setFont("helvetica", "normal"); // Reset font
    
    // Add date
    pdf.setFontSize(9);
    pdf.setTextColor(100, 120, 100); // Slight green tint to match the design
    pdf.text(
      `Generated on ${format(new Date(), "MMMM d, yyyy")}`,
      pdf.internal.pageSize.getWidth() / 2,
      pdf.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
    
    // Increase starting position for the table - position relative to the title
    let currentY = yPos + 15;
    
    // Add sections
    for (const section of content.sections) {
      if (section.title) {
        // Add some spacing before section title
        currentY += 8;
        
        // Add section title
        pdf.setFontSize(12);
        pdf.setTextColor(40, 40, 40);
        pdf.text(section.title, 14, currentY);
        currentY += 8;
      }
      
      // Add table
      autoTable(pdf, {
        startY: currentY,
        head: section.rows.length > 0 ? [section.rows[0]] : undefined,
        body: section.rows.slice(1),
        theme: "grid",
        styles: {
          fontSize: 9,
          cellPadding: 6,
          overflow: 'linebreak',
          lineWidth: 0.1,
          lineColor: [200, 200, 200],
          minCellHeight: 14,
          halign: 'left',
          valign: 'middle',
        },
        headStyles: {
          fillColor: [16, 150, 100], // Slightly darker emerald for better contrast
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: 'left',
          fontSize: 10,
          cellPadding: 7,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245], // Lighter fill for better contrast
        },
        columnStyles: {
          0: { 
            cellWidth: 40,
            fontStyle: 'bold',
            textColor: [80, 80, 80]
          },
          1: { 
            cellWidth: 'auto', 
            minCellWidth: 70,
            textColor: [50, 50, 50]
          },
        },
        margin: { top: 10, right: 14, bottom: 10, left: 14 },
        tableWidth: 'auto',
        didParseCell: function(data) {
          // Apply special styling to specific cell types if needed
          if (data.row.section === 'body' && data.column.index === 1) {
            // Ensure the second column (details) has proper text handling
            data.cell.styles.overflow = 'linebreak';
            data.cell.styles.cellWidth = 'auto';
          }
        },
        willDrawCell: function(data) {
          // Ensure text doesn't overflow
          if (data.cell.text.length > 0) {
            data.cell.styles.cellPadding = 5;
          }
        },
      });
      
      // Update current Y position after the table
      currentY = (pdf as any).lastAutoTable.finalY + 10;
    }
    
    // Add footer with company name if available
    const footerText = companySettings?.name
      ? `${companySettings.name} • ${companySettings.website || ""}`
      : "Generated by Triptics";
    
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      footerText,
      pdf.internal.pageSize.getWidth() / 2,
      pdf.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
    
    // Return PDF as blob
    return pdf.output("blob");
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
} 