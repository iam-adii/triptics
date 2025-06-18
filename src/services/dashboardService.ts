import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";

// Mock dashboard data as fallback only if all else fails
const mockDashboardData = {
  totalLeads: 47,
  leadsGrowth: { growth: 15, current: 24, previous: 21 },
  totalBookings: 28,
  bookingsGrowth: { growth: 8, current: 14, previous: 13 },
  totalRevenue: 280000,
  revenueGrowth: { growth: 12, current: 140000, previous: 125000 },
  conversionRate: 60,
  conversionGrowth: { growth: 5, current: 60, previous: 57 },
  monthlyData: [
    { name: "Jan", leads: 18, conversions: 10, revenue: 98000, revenueInTenK: 9.8 },
    { name: "Feb", leads: 22, conversions: 12, revenue: 110000, revenueInTenK: 11 },
    { name: "Mar", leads: 19, conversions: 11, revenue: 105000, revenueInTenK: 10.5 },
    { name: "Apr", leads: 23, conversions: 13, revenue: 125000, revenueInTenK: 12.5 },
    { name: "May", leads: 21, conversions: 14, revenue: 140000, revenueInTenK: 14 },
    { name: "Jun", leads: 24, conversions: 15, revenue: 150000, revenueInTenK: 15 }
  ],
  recentLeads: [],
  topTours: [
    { id: 1, name: "Kashmir Adventure", bookings: 12, revenue: 120000, duration: "5 days" },
    { id: 2, name: "Goa Beach Retreat", bookings: 10, revenue: 90000, duration: "4 days" },
    { id: 3, name: "Kerala Backwaters", bookings: 8, revenue: 70000, duration: "6 days" }
  ],
  upcomingBookings: [
    { id: 1, tourName: "Kashmir Adventure", customerName: "John Doe", status: "Confirmed", date: "28 Jul, 2023" },
    { id: 2, name: "Goa Beach Retreat", customerName: "Jane Smith", status: "Pending", date: "02 Aug, 2023" }
  ]
};

// Get total leads count
export async function getTotalLeads() {
  try {
    const { data, error } = await supabase
      .from("leads")
      .select("id");
    
    if (error) throw error;
    return data?.length || 0;
  } catch (error) {
    console.error("Error fetching total leads:", error);
    return mockDashboardData.totalLeads;
  }
}

// Get leads created in the current and previous month
export async function getLeadsGrowth() {
  try {
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    const previousMonthStart = startOfMonth(subMonths(today, 1));
    const previousMonthEnd = endOfMonth(previousMonthStart);
    
    // Get current month leads
    const { data: currentMonthLeads, error: currentError } = await supabase
      .from("leads")
      .select("id")
      .gte("created_at", currentMonthStart.toISOString())
      .lte("created_at", today.toISOString());
    
    if (currentError) throw currentError;
    
    // Get previous month leads
    const { data: previousMonthLeads, error: previousError } = await supabase
      .from("leads")
      .select("id")
      .gte("created_at", previousMonthStart.toISOString())
      .lte("created_at", previousMonthEnd.toISOString());
    
    if (previousError) throw previousError;
    
    const currentCount = currentMonthLeads?.length || 0;
    const previousCount = previousMonthLeads?.length || 0;
    
    // Calculate growth percentage
    let growth = 0;
    if (previousCount > 0) {
      growth = Math.round(((currentCount - previousCount) / previousCount) * 100);
    } else if (currentCount > 0) {
      growth = 100; // If there were no leads in the previous month but there are now
    }
    
    return {
      growth,
      current: currentCount,
      previous: previousCount
    };
  } catch (error) {
    console.error("Error calculating leads growth:", error);
    return mockDashboardData.leadsGrowth;
  }
}

// Get total bookings count
export async function getTotalBookings() {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("id");
    
    if (error) throw error;
    return data?.length || 0;
  } catch (error) {
    console.error("Error fetching total bookings:", error);
    return mockDashboardData.totalBookings;
  }
}

// Get bookings created in the current and previous month
export async function getBookingsGrowth() {
  try {
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    const previousMonthStart = startOfMonth(subMonths(today, 1));
    const previousMonthEnd = endOfMonth(previousMonthStart);
    
    // Get current month bookings
    const { data: currentMonthBookings, error: currentError } = await supabase
      .from("bookings")
      .select("id")
      .gte("created_at", currentMonthStart.toISOString())
      .lte("created_at", today.toISOString());
    
    if (currentError) throw currentError;
    
    // Get previous month bookings
    const { data: previousMonthBookings, error: previousError } = await supabase
      .from("bookings")
      .select("id")
      .gte("created_at", previousMonthStart.toISOString())
      .lte("created_at", previousMonthEnd.toISOString());
    
    if (previousError) throw previousError;
    
    const currentCount = currentMonthBookings?.length || 0;
    const previousCount = previousMonthBookings?.length || 0;
    
    // Calculate growth percentage
    let growth = 0;
    if (previousCount > 0) {
      growth = Math.round(((currentCount - previousCount) / previousCount) * 100);
    } else if (currentCount > 0) {
      growth = 100; // If there were no bookings in the previous month but there are now
    }
    
    return {
      growth,
      current: currentCount,
      previous: previousCount
    };
  } catch (error) {
    console.error("Error calculating bookings growth:", error);
    return mockDashboardData.bookingsGrowth;
  }
}

// Get total revenue
export async function getTotalRevenue() {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("total_amount");
    
    if (error) throw error;
    
    const totalRevenue = (data || []).reduce((sum, booking) => sum + (parseFloat(booking.total_amount) || 0), 0);
    return totalRevenue;
  } catch (error) {
    console.error("Error calculating total revenue:", error);
    return mockDashboardData.totalRevenue;
  }
}

// Get revenue for current and previous month
export async function getRevenueGrowth() {
  try {
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    const previousMonthStart = startOfMonth(subMonths(today, 1));
    const previousMonthEnd = endOfMonth(previousMonthStart);
    
    // Get current month revenue
    const { data: currentMonthBookings, error: currentError } = await supabase
      .from("bookings")
      .select("total_amount")
      .gte("created_at", currentMonthStart.toISOString())
      .lte("created_at", today.toISOString());
    
    if (currentError) throw currentError;
    
    // Get previous month revenue
    const { data: previousMonthBookings, error: previousError } = await supabase
      .from("bookings")
      .select("total_amount")
      .gte("created_at", previousMonthStart.toISOString())
      .lte("created_at", previousMonthEnd.toISOString());
    
    if (previousError) throw previousError;
    
    const currentRevenue = (currentMonthBookings || []).reduce((sum, booking) => sum + (parseFloat(booking.total_amount) || 0), 0);
    const previousRevenue = (previousMonthBookings || []).reduce((sum, booking) => sum + (parseFloat(booking.total_amount) || 0), 0);
    
    // Calculate growth percentage
    let growth = 0;
    if (previousRevenue > 0) {
      growth = Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100);
    } else if (currentRevenue > 0) {
      growth = 100; // If there was no revenue in the previous month but there is now
    }
    
    return {
      growth,
      current: currentRevenue,
      previous: previousRevenue
    };
  } catch (error) {
    console.error("Error calculating revenue growth:", error);
    return mockDashboardData.revenueGrowth;
  }
}

// Get conversion rate (bookings / leads)
export async function getConversionRate() {
  try {
    const { data: leadsData, error: leadsError } = await supabase
      .from("leads")
      .select("id");
    
    if (leadsError) throw leadsError;
    
    const { data: bookingsData, error: bookingsError } = await supabase
      .from("bookings")
      .select("id");
    
    if (bookingsError) throw bookingsError;
    
    const leadsCount = leadsData?.length || 0;
    const bookingsCount = bookingsData?.length || 0;
    
    const conversionRate = leadsCount ? Math.round((bookingsCount / leadsCount) * 100) : 0;
    return conversionRate;
  } catch (error) {
    console.error("Error calculating conversion rate:", error);
    return mockDashboardData.conversionRate;
  }
}

// Get conversion growth between current and previous month
export async function getConversionGrowth() {
  try {
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    const previousMonthStart = startOfMonth(subMonths(today, 1));
    const previousMonthEnd = endOfMonth(previousMonthStart);
    
    // Current month data
    const { data: currentLeads, error: currentLeadsError } = await supabase
      .from("leads")
      .select("id")
      .gte("created_at", currentMonthStart.toISOString())
      .lte("created_at", today.toISOString());
    
    if (currentLeadsError) throw currentLeadsError;
    
    const { data: currentBookings, error: currentBookingsError } = await supabase
      .from("bookings")
      .select("id")
      .gte("created_at", currentMonthStart.toISOString())
      .lte("created_at", today.toISOString());
    
    if (currentBookingsError) throw currentBookingsError;
    
    // Previous month data
    const { data: previousLeads, error: previousLeadsError } = await supabase
      .from("leads")
      .select("id")
      .gte("created_at", previousMonthStart.toISOString())
      .lte("created_at", previousMonthEnd.toISOString());
    
    if (previousLeadsError) throw previousLeadsError;
    
    const { data: previousBookings, error: previousBookingsError } = await supabase
      .from("bookings")
      .select("id")
      .gte("created_at", previousMonthStart.toISOString())
      .lte("created_at", previousMonthEnd.toISOString());
    
    if (previousBookingsError) throw previousBookingsError;
    
    const currentLeadsCount = currentLeads?.length || 0;
    const currentBookingsCount = currentBookings?.length || 0;
    const previousLeadsCount = previousLeads?.length || 0;
    const previousBookingsCount = previousBookings?.length || 0;
    
    const currentRate = currentLeadsCount ? Math.round((currentBookingsCount / currentLeadsCount) * 100) : 0;
    const previousRate = previousLeadsCount ? Math.round((previousBookingsCount / previousLeadsCount) * 100) : 0;
    
    // Calculate growth percentage
    let growth = 0;
    if (previousRate > 0) {
      growth = currentRate - previousRate;
    } else if (currentRate > 0) {
      growth = currentRate; // If there was no conversion in the previous month but there is now
    }
    
    return {
      growth,
      current: currentRate,
      previous: previousRate
    };
  } catch (error) {
    console.error("Error calculating conversion growth:", error);
    return mockDashboardData.conversionGrowth;
  }
}

// Get monthly data for charts
export async function getMonthlyData() {
  try {
    const today = new Date();
    const months = [];
    
    // Get data for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(today, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = i === 0 ? today : endOfMonth(monthDate);
      const monthName = format(monthDate, 'MMM');
      
      // Get leads for this month
      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select("id")
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString());
      
      if (leadsError) throw leadsError;
      
      // Get conversions (bookings) for this month
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("id, total_amount")
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString());
      
      if (bookingsError) throw bookingsError;
      
      const leadsCount = leadsData?.length || 0;
      const conversionsCount = bookingsData?.length || 0;
      const revenue = (bookingsData || []).reduce((sum, booking) => sum + (parseFloat(booking.total_amount) || 0), 0);
      
      months.push({
        name: monthName,
        month: monthName,
        leads: leadsCount,
        conversions: conversionsCount,
        revenue: revenue,
        revenueInTenK: revenue / 10000
      });
    }
    
    return months;
  } catch (error) {
    console.error("Error generating monthly data:", error);
    return mockDashboardData.monthlyData;
  }
}

// Get recent leads (increase limit and fetch more data)
export async function getRecentLeads(limit = 5) {
  try {
    const { data, error } = await supabase
      .from("leads")
      .select("id, name, email, phone, status, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    return (data || []).map(lead => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      date: format(parseISO(lead.created_at), "dd MMM, yyyy")
    }));
  } catch (error) {
    console.error("Error fetching recent leads:", error);
    return [];
  }
}

// Rename to getUpcomingTours and fetch upcoming tours instead of top tours
export async function getUpcomingTours(limit = 5) {
  try {
    const today = new Date().toISOString();
    
    // Get upcoming tours from itineraries that have a start date in the future
    const { data, error } = await supabase
      .from("itineraries")
      .select(`
        id, 
        name, 
        start_date, 
        end_date, 
        bookings:bookings(count),
        destination
      `)
      .gt("start_date", today)
      .order("start_date", { ascending: true })
      .limit(limit);
    
    if (error) throw error;
    
    return (data || []).map(tour => ({
      id: tour.id,
      name: tour.name,
      destination: tour.destination,
      startDate: format(parseISO(tour.start_date), "dd MMM, yyyy"),
      endDate: tour.end_date ? format(parseISO(tour.end_date), "dd MMM, yyyy") : null,
      duration: calculateDuration(tour.start_date, tour.end_date),
      bookings: tour.bookings[0]?.count || 0
    }));
  } catch (error) {
    console.error("Error fetching upcoming tours:", error);
    return [];
  }
}

// Helper function to calculate tour duration
function calculateDuration(startDate: string, endDate: string | null) {
  if (!startDate || !endDate) return "N/A";
  
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return `${diffDays} days`;
}

// Get upcoming bookings with more detail
export async function getUpcomingBookings(limit = 5) {
  try {
    const today = new Date().toISOString();
    
    // Get upcoming bookings with customer and tour details
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id, 
        status, 
        created_at,
        total_amount,
        tour_date,
        customers:customer_id(id, name, email, phone),
        itineraries:itinerary_id(id, name)
      `)
      .gt("tour_date", today)
      .order("tour_date", { ascending: true })
      .limit(limit);
    
    if (error) throw error;
    
    return (data || []).map(booking => ({
      id: booking.id,
      tourName: booking.itineraries?.name || "Unknown Tour",
      customerName: booking.customers?.name || "Unknown Customer",
      customerEmail: booking.customers?.email || "",
      customerPhone: booking.customers?.phone || "",
      status: booking.status,
      amount: booking.total_amount,
      date: booking.tour_date ? format(parseISO(booking.tour_date), "dd MMM, yyyy") : format(parseISO(booking.created_at), "dd MMM, yyyy")
    }));
  } catch (error) {
    console.error("Error fetching upcoming bookings:", error);
    return [];
  }
}

// Update the main getDashboardData function to use the new functions
export async function getDashboardData() {
  try {
    // Fetch all data in parallel for better performance
    const [
      totalLeads,
      leadsGrowth,
      totalBookings,
      bookingsGrowth,
      totalRevenue,
      revenueGrowth,
      conversionRate,
      conversionGrowth,
      monthlyData,
      recentLeads,
      upcomingTours,
      upcomingBookings
    ] = await Promise.all([
      getTotalLeads(),
      getLeadsGrowth(),
      getTotalBookings(),
      getBookingsGrowth(),
      getTotalRevenue(),
      getRevenueGrowth(),
      getConversionRate(),
      getConversionGrowth(),
      getMonthlyData(),
      getRecentLeads(5),
      getUpcomingTours(5),
      getUpcomingBookings(5)
    ]);
    
    return {
      totalLeads,
      leadsGrowth,
      totalBookings,
      bookingsGrowth,
      totalRevenue,
      revenueGrowth,
      conversionRate,
      conversionGrowth,
      monthlyData,
      recentLeads,
      upcomingTours, // Changed from topTours
      upcomingBookings
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    // Return mock data as fallback
    return {
      ...mockDashboardData,
      upcomingTours: mockDashboardData.topTours // Map old property to new one
    };
  }
} 