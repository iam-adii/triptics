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

// Get recent leads
export async function getRecentLeads(limit = 3) {
  try {
    const { data, error } = await supabase
      .from("leads")
      .select("id, first_name, last_name, email, status, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      return data.map(lead => ({
        id: lead.id,
        name: `${lead.first_name} ${lead.last_name}`,
        email: lead.email,
        status: lead.status,
        date: format(parseISO(lead.created_at), 'dd MMM, yyyy')
      }));
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching recent leads:", error);
    return [];
  }
}

// Get top tours by bookings/revenue
export async function getTopTours(limit = 3) {
  try {
    // Get all tours
    const { data: tours, error: toursError } = await supabase
      .from("tours")
      .select("id, name, duration");
    
    if (toursError) throw toursError;
    
    // Get all bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("tour_id, total_amount");
    
    if (bookingsError) throw bookingsError;
    
    // Calculate tour stats
    const tourStats = tours.map(tour => {
      const tourBookings = bookings.filter(booking => booking.tour_id === tour.id);
      const revenue = tourBookings.reduce((sum, booking) => sum + (parseFloat(booking.total_amount) || 0), 0);
      
      return {
        id: tour.id,
        name: tour.name,
        duration: `${tour.duration} days`,
        bookings: tourBookings.length,
        revenue
      };
    });
    
    // Sort by revenue and return top tours
    return tourStats
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
      
  } catch (error) {
    console.error("Error fetching top tours:", error);
    return mockDashboardData.topTours;
  }
}

// Get upcoming bookings
export async function getUpcomingBookings(limit = 3) {
  try {
    // Get latest bookings regardless of date
    const { data: bookingsData, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, tour_id, customer_id, status, created_at, start_date")
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (bookingsError) throw bookingsError;
    
    if (!bookingsData || bookingsData.length === 0) {
      return [];
    }
    
    // Get tours data
    const tourIds = [...new Set(bookingsData.map(booking => booking.tour_id))];
    const { data: toursData, error: toursError } = await supabase
      .from("tours")
      .select("id, name")
      .in("id", tourIds);
    
    if (toursError) throw toursError;
    
    // Get customers data
    const customerIds = [...new Set(bookingsData.map(booking => booking.customer_id))];
    const { data: customersData, error: customersError } = await supabase
      .from("customers")
      .select("id, first_name, last_name")
      .in("id", customerIds);
    
    if (customersError) throw customersError;
    
    // Map tours and customers to bookings
    return bookingsData.map(booking => {
      const tour = toursData.find(t => t.id === booking.tour_id) || { name: "Unknown Tour" };
      const customer = customersData.find(c => c.id === booking.customer_id) || { first_name: "Unknown", last_name: "Customer" };
      
      return {
        id: booking.id,
        tourName: tour.name,
        customerName: `${customer.first_name} ${customer.last_name}`,
        status: booking.status,
        date: format(parseISO(booking.created_at), 'dd MMM, yyyy')
      };
    });
  } catch (error) {
    console.error("Error fetching latest bookings:", error);
    return [];
  }
}

// Get dashboard data - optimized version with batched queries
export async function getDashboardData() {
  try {
    // Current date and time range calculations
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    const previousMonthStart = startOfMonth(subMonths(today, 1));
    const previousMonthEnd = endOfMonth(previousMonthStart);
    
    // Parallel fetch for all necessary data
    const [
      leadsData,
      bookingsData,
      monthlyData,
      toursData
    ] = await Promise.all([
      // 1. Fetch all leads with minimal fields for stats
      supabase
        .from("leads")
        .select("id, first_name, last_name, email, status, created_at"),
      
      // 2. Fetch all bookings with minimal fields for stats
      supabase
        .from("bookings")
        .select("id, tour_id, customer_id, status, total_amount, created_at, start_date")
        .order("created_at", { ascending: false }),
      
      // 3. Get monthly data
      getMonthlyData(),
      
      // 4. Fetch tours data for stats
      supabase
        .from("tours")
        .select("id, name, duration")
    ]);
    
    // Handle errors
    if (leadsData.error) throw leadsData.error;
    if (bookingsData.error) throw bookingsData.error;
    if (toursData.error) throw toursData.error;
    
    // Get customers data for bookings
    const customerIds = [...new Set(bookingsData.data.map(booking => booking.customer_id).filter(Boolean))];
    const customersData = customerIds.length > 0 ? 
      await supabase
        .from("customers")
        .select("id, first_name, last_name")
        .in("id", customerIds) : 
      { data: [] };
    
    if (customersData.error) throw customersData.error;
    
    // Process all data
    
    // 1. Process leads data
    const allLeads = leadsData.data || [];
    const totalLeads = allLeads.length;
    
    const currentMonthLeads = allLeads.filter(lead => 
      new Date(lead.created_at) >= currentMonthStart && 
      new Date(lead.created_at) <= today
    );
    
    const previousMonthLeads = allLeads.filter(lead => 
      new Date(lead.created_at) >= previousMonthStart && 
      new Date(lead.created_at) <= previousMonthEnd
    );
    
    const currentLeadsCount = currentMonthLeads.length;
    const previousLeadsCount = previousMonthLeads.length;
    
    let leadsGrowth = 0;
    if (previousLeadsCount > 0) {
      leadsGrowth = Math.round(((currentLeadsCount - previousLeadsCount) / previousLeadsCount) * 100);
    } else if (currentLeadsCount > 0) {
      leadsGrowth = 100;
    }
    
    // 2. Process bookings data
    const allBookings = bookingsData.data || [];
    const totalBookings = allBookings.length;
    
    const currentMonthBookings = allBookings.filter(booking => 
      new Date(booking.created_at) >= currentMonthStart && 
      new Date(booking.created_at) <= today
    );
    
    const previousMonthBookings = allBookings.filter(booking => 
      new Date(booking.created_at) >= previousMonthStart && 
      new Date(booking.created_at) <= previousMonthEnd
    );
    
    const currentBookingsCount = currentMonthBookings.length;
    const previousBookingsCount = previousMonthBookings.length;
    
    let bookingsGrowth = 0;
    if (previousBookingsCount > 0) {
      bookingsGrowth = Math.round(((currentBookingsCount - previousBookingsCount) / previousBookingsCount) * 100);
    } else if (currentBookingsCount > 0) {
      bookingsGrowth = 100;
    }
    
    // 3. Process revenue data
    const totalRevenue = allBookings.reduce((sum, booking) => sum + (parseFloat(booking.total_amount) || 0), 0);
    
    const currentMonthRevenue = currentMonthBookings.reduce(
      (sum, booking) => sum + (parseFloat(booking.total_amount) || 0), 0
    );
    
    const previousMonthRevenue = previousMonthBookings.reduce(
      (sum, booking) => sum + (parseFloat(booking.total_amount) || 0), 0
    );
    
    let revenueGrowth = 0;
    if (previousMonthRevenue > 0) {
      revenueGrowth = Math.round(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100);
    } else if (currentMonthRevenue > 0) {
      revenueGrowth = 100;
    }
    
    // 4. Process conversion data
    const conversionRate = totalLeads ? Math.round((totalBookings / totalLeads) * 100) : 0;
    
    const currentConversionRate = currentLeadsCount 
      ? Math.round((currentBookingsCount / currentLeadsCount) * 100) 
      : 0;
    
    const previousConversionRate = previousLeadsCount 
      ? Math.round((previousBookingsCount / previousLeadsCount) * 100) 
      : 0;
    
    let conversionGrowth = 0;
    if (previousConversionRate > 0) {
      conversionGrowth = Math.round(((currentConversionRate - previousConversionRate) / previousConversionRate) * 100);
    } else if (currentConversionRate > 0) {
      conversionGrowth = 100;
    }
    
    // 5. Process recent leads
    const recentLeads = allLeads
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)
      .map(lead => ({
        id: lead.id,
        name: `${lead.first_name} ${lead.last_name}`,
        email: lead.email,
        status: lead.status,
        date: format(parseISO(lead.created_at), 'dd MMM, yyyy')
      }));
    
    // 6. Process top tours
    const tours = toursData.data || [];
    const tourStats = tours.map(tour => {
      const tourBookings = allBookings.filter(booking => booking.tour_id === tour.id);
      const revenue = tourBookings.reduce((sum, booking) => sum + (parseFloat(booking.total_amount) || 0), 0);
      
      return {
        id: tour.id,
        name: tour.name,
        duration: `${tour.duration} days`,
        bookings: tourBookings.length,
        revenue
      };
    });
    
    const topTours = tourStats
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);
    
    // 7. Process upcoming bookings
    const customers = customersData.data || [];
    const upcomingBookings = allBookings
      .slice(0, 3)
      .map(booking => {
        const tour = tours.find(t => t.id === booking.tour_id) || { name: "Unknown Tour" };
        const customer = customers.find(c => c.id === booking.customer_id) || { first_name: "Unknown", last_name: "Customer" };
        
        return {
          id: booking.id,
          tourName: tour.name,
          customerName: `${customer.first_name} ${customer.last_name}`,
          status: booking.status,
          date: format(parseISO(booking.created_at), 'dd MMM, yyyy')
        };
      });
    
    // Return aggregated dashboard data
    return {
      totalLeads,
      leadsGrowth: { 
        growth: leadsGrowth, 
        current: currentLeadsCount, 
        previous: previousLeadsCount 
      },
      totalBookings,
      bookingsGrowth: { 
        growth: bookingsGrowth, 
        current: currentBookingsCount, 
        previous: previousBookingsCount 
      },
      totalRevenue,
      revenueGrowth: { 
        growth: revenueGrowth, 
        current: currentMonthRevenue, 
        previous: previousMonthRevenue 
      },
      conversionRate,
      conversionGrowth: { 
        growth: conversionGrowth, 
        current: currentConversionRate, 
        previous: previousConversionRate 
      },
      monthlyData,
      recentLeads,
      topTours,
      upcomingBookings
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    // Return mock data as fallback only if everything fails
    return {
      ...mockDashboardData,
      recentLeads: await getRecentLeads().catch(() => []),
      topTours: await getTopTours().catch(() => mockDashboardData.topTours),
      upcomingBookings: await getUpcomingBookings().catch(() => [])
    };
  }
} 