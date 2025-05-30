import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth, subDays, parseISO } from "date-fns";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface MonthlyData {
  name: string;
  fullMonth: string;
  revenue: number;
  count: number;
}

interface SourceData {
  name: string;
  value: number;
}

interface DestinationData {
  name: string;
  value: number;
  count: number;
  tourName: string;
}

interface TrendData {
  name: string;
  fullMonth: string;
  bookings: number;
  cancellations: number;
}

// Get data for specific time period
export async function getReportData(period = "last6months") {
  const today = new Date();
  let startDate;
  
  switch (period) {
    case "last30days":
      startDate = subDays(today, 30);
      break;
    case "last3months":
      startDate = subMonths(today, 3);
      break;
    case "lastYear":
      startDate = subMonths(today, 12);
      break;
    case "last6months":
    default:
      startDate = subMonths(today, 6);
      break;
  }
  
  try {
    const [
      salesData,
      leadSourceData,
      tourTypeData,
      bookingStatusData,
      popularDestinations,
      bookingTrends
    ] = await Promise.all([
      getSalesData(startDate),
      getLeadSourceData(startDate),
      getTourTypeData(startDate),
      getBookingStatusData(startDate),
      getPopularDestinations(startDate),
      getBookingTrends(startDate)
    ]);
    
    return {
      salesData,
      leadSourceData,
      tourTypeData,
      bookingStatusData,
      popularDestinations,
      bookingTrends
    };
  } catch (error) {
    console.error("Error fetching report data:", error);
    throw error;
  }
}

// Get sales data by month
async function getSalesData(startDate) {
  const { data, error } = await supabase
    .from("bookings")
    .select("created_at, total_amount, status")
    .gte("created_at", startDate.toISOString())
    .in("status", ["Confirmed", "Completed"]);
  
  if (error) throw error;
  
  // Group by month
  const monthlyData = {};
  
  data.forEach(booking => {
    const date = new Date(booking.created_at);
    const monthKey = format(date, "MMM yyyy");
    const month = format(date, "MMM");
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        name: month,
        fullMonth: monthKey,
        revenue: 0,
        count: 0
      };
    }
    
    monthlyData[monthKey].revenue += booking.total_amount || 0;
    monthlyData[monthKey].count += 1;
  });
  
  // Convert to array and sort by date
  return Object.values(monthlyData).sort((a: MonthlyData, b: MonthlyData) => {
    return parseISO(a.fullMonth).getTime() - parseISO(b.fullMonth).getTime();
  });
}

// Get lead source distribution
async function getLeadSourceData(startDate) {
  const { data, error } = await supabase
    .from("leads")
    .select("source")
    .gte("created_at", startDate.toISOString())
    .not("source", "is", null);
  
  if (error) throw error;
  
  // Count by source
  const sourceCounts = {};
  
  data.forEach(lead => {
    const source = lead.source || "Other";
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });
  
  // Convert to array format for charts
  return Object.entries(sourceCounts).map(([name, value]) => ({
    name,
    value
  }));
}

// Get tour type distribution
async function getTourTypeData(startDate) {
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select(`
      tour_id,
      tours (
        id,
        name,
        location
      )
    `)
    .gte("created_at", startDate.toISOString())
    .not("tour_id", "is", null);
  
  if (bookingsError) throw bookingsError;
  
  // Count by location (using location as type)
  const typeCounts = {};
  
  bookings.forEach(booking => {
    const location = booking.tours?.location || "Other";
    typeCounts[location] = (typeCounts[location] || 0) + 1;
  });
  
  // Convert to array format for charts
  return Object.entries(typeCounts).map(([name, value]) => ({
    name,
    value
  }));
}

// Get booking status distribution
async function getBookingStatusData(startDate) {
  const { data, error } = await supabase
    .from("bookings")
    .select("status")
    .gte("created_at", startDate.toISOString());
  
  if (error) throw error;
  
  // Count by status
  const statusCounts = {
    "Confirmed": 0,
    "Pending": 0,
    "Cancelled": 0,
    "Completed": 0
  };
  
  data.forEach(booking => {
    const status = booking.status || "Pending";
    if (statusCounts.hasOwnProperty(status)) {
      statusCounts[status]++;
    }
  });
  
  // Calculate total for percentages
  const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
  
  return {
    counts: statusCounts,
    total,
    confirmed: statusCounts.Confirmed,
    pending: statusCounts.Pending,
    cancelled: statusCounts.Cancelled,
    completed: statusCounts.Completed
  };
}

// Get popular destinations
async function getPopularDestinations(startDate) {
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select(`
      tour_id,
      total_amount,
      tours (
        name,
        location
      )
    `)
    .gte("created_at", startDate.toISOString())
    .in("status", ["Confirmed", "Completed"]);
  
  if (bookingsError) throw bookingsError;
  
  // Group by destination
  const destinationMap = {};
  
  bookings.forEach(booking => {
    if (!booking.tours?.location) return;
    
    const location = booking.tours.location;
    if (!destinationMap[location]) {
      destinationMap[location] = {
        name: location,
        value: 0,
        count: 0,
        tourName: booking.tours.name
      };
    }
    destinationMap[location].value += booking.total_amount || 0;
    destinationMap[location].count += 1;
  });
  
  // Convert to array and sort by revenue
  return Object.values(destinationMap)
    .sort((a: DestinationData, b: DestinationData) => b.value - a.value)
    .slice(0, 5);
}

// Get booking trends
async function getBookingTrends(startDate) {
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("created_at, status")
    .gte("created_at", startDate.toISOString());
  
  if (bookingsError) throw bookingsError;
  
  // Group by month
  const monthlyData = {};
  
  bookings.forEach(booking => {
    const date = new Date(booking.created_at);
    const monthKey = format(date, "MMM yyyy");
    const month = format(date, "MMM");
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        name: month,
        fullMonth: monthKey,
        bookings: 0,
        cancellations: 0
      };
    }
    
    monthlyData[monthKey].bookings += 1;
    if (booking.status === "Cancelled") {
      monthlyData[monthKey].cancellations += 1;
    }
  });
  
  // Convert to array and sort by date
  return Object.values(monthlyData).sort((a: TrendData, b: TrendData) => {
    return parseISO(a.fullMonth).getTime() - parseISO(b.fullMonth).getTime();
  });
}

// Get average booking value
export async function getAverageBookingValue(startDate = subMonths(new Date(), 6)) {
  const { data, error } = await supabase
    .from("bookings")
    .select("total_amount")
    .gte("created_at", startDate.toISOString())
    .not("status", "eq", "Cancelled");
  
  if (error) throw error;
  
  if (!data.length) return 0;
  
  const totalRevenue = data.reduce((sum, booking) => sum + (booking.total_amount || 0), 0);
  return Math.round(totalRevenue / data.length);
}

// Get cancellation rate
export async function getCancellationRate(startDate = subMonths(new Date(), 6)) {
  const { data, error } = await supabase
    .from("bookings")
    .select("status")
    .gte("created_at", startDate.toISOString());
  
  if (error) throw error;
  
  if (!data.length) return 0;
  
  const cancelledCount = data.filter(booking => booking.status === "Cancelled").length;
  return parseFloat(((cancelledCount / data.length) * 100).toFixed(1));
}

// Export data to Excel
export function exportToExcel(data, period) {
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Create worksheets for each report type
  const salesSheet = XLSX.utils.json_to_sheet(data.salesData.map(item => ({
    Month: item.fullMonth,
    Revenue: item.revenue,
    "Number of Bookings": item.count
  })));
  
  const leadSourceSheet = XLSX.utils.json_to_sheet(data.leadSourceData);
  const tourTypeSheet = XLSX.utils.json_to_sheet(data.tourTypeData);
  
  const bookingStatusSheet = XLSX.utils.json_to_sheet([
    { Status: "Confirmed", Count: data.bookingStatusData.confirmed },
    { Status: "Pending", Count: data.bookingStatusData.pending },
    { Status: "Cancelled", Count: data.bookingStatusData.cancelled },
    { Status: "Completed", Count: data.bookingStatusData.completed },
  ]);
  
  const destinationsSheet = XLSX.utils.json_to_sheet(data.popularDestinations.map(item => ({
    Destination: item.name,
    Revenue: item.value,
    "Number of Bookings": item.count,
    "Tour Name": item.tourName
  })));
  
  const trendsSheet = XLSX.utils.json_to_sheet(data.bookingTrends.map(item => ({
    Month: item.fullMonth,
    Bookings: item.bookings,
    Cancellations: item.cancellations
  })));
  
  // Add worksheets to workbook
  XLSX.utils.book_append_sheet(wb, salesSheet, "Revenue");
  XLSX.utils.book_append_sheet(wb, leadSourceSheet, "Lead Sources");
  XLSX.utils.book_append_sheet(wb, tourTypeSheet, "Tour Types");
  XLSX.utils.book_append_sheet(wb, bookingStatusSheet, "Booking Status");
  XLSX.utils.book_append_sheet(wb, destinationsSheet, "Popular Destinations");
  XLSX.utils.book_append_sheet(wb, trendsSheet, "Booking Trends");
  
  // Generate Excel file
  const fileName = `Triptics_Report_${period}_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const data_blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  
  // Save file
  saveAs(data_blob, fileName);
} 