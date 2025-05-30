import { API_ENDPOINTS } from "@/config/api";
import { get } from "@/utils/api";
import { supabase } from "@/integrations/supabase/client";

// Define search result types
export type SearchResultType = 'customer' | 'booking' | 'lead' | 'itinerary' | 'payment' | 'navigation' | 'hotel';

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: SearchResultType;
  url: string;
}

/**
 * Perform a search across all data types
 * @param query Search query string
 * @returns Promise with search results
 */
export async function searchAll(query: string): Promise<SearchResult[]> {
  // Return empty results for empty queries
  if (!query || query.trim().length < 2) {
    return [];
  }

  const searchTerm = query.trim().toLowerCase();
  let results: SearchResult[] = [];

  try {
    // Try to fetch from Supabase
    try {
      // Search customers
      const { data: customers } = await supabase
        .from("customers")
        .select("id, name, email, phone")
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .limit(5);
      
      if (customers && customers.length > 0) {
        customers.forEach(customer => {
          results.push({
            id: customer.id,
            title: customer.name,
            subtitle: `${customer.email || 'No email'} | ${customer.phone || 'No phone'}`,
            type: 'customer',
            url: `/customers?id=${customer.id}`
          });
        });
      }

      // Search bookings
      const { data: bookings } = await supabase
        .from("bookings")
        .select(`
          id, 
          start_date, 
          end_date, 
          status, 
          total_amount,
          customers (id, name),
          tours (id, name)
        `)
        .or(`status.ilike.%${searchTerm}%`)
        .limit(5);
      
      if (bookings && bookings.length > 0) {
        bookings.forEach(booking => {
          const customerName = booking.customers && booking.customers[0] ? booking.customers[0].name : 'Unknown Customer';
          const tourName = booking.tours && booking.tours[0] ? booking.tours[0].name : 'Unknown Tour';
          
          results.push({
            id: booking.id,
            title: `Booking: ${tourName}`,
            subtitle: `${customerName} | ${booking.status} | ${new Date(booking.start_date).toLocaleDateString()}`,
            type: 'booking',
            url: `/bookings?id=${booking.id}`
          });
        });
      }

      // Search leads
      const { data: leads } = await supabase
        .from("leads")
        .select("id, name, email, phone, source, status")
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,source.ilike.%${searchTerm}%`)
        .limit(5);
      
      if (leads && leads.length > 0) {
        leads.forEach(lead => {
          results.push({
            id: lead.id,
            title: lead.name,
            subtitle: `${lead.email || 'No email'} | ${lead.status || 'New'} | ${lead.source || 'Unknown source'}`,
            type: 'lead',
            url: `/leads?id=${lead.id}`
          });
        });
      }

      // Search hotels
      const { data: hotels } = await supabase
        .from("hotels")
        .select("id, name, city, state, country, star_category")
        .or(`name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,country.ilike.%${searchTerm}%`)
        .limit(5);
      
      if (hotels && hotels.length > 0) {
        hotels.forEach(hotel => {
          results.push({
            id: hotel.id,
            title: hotel.name,
            subtitle: `${hotel.city}, ${hotel.state || ''}, ${hotel.country} | ${hotel.star_category} Star`,
            type: 'hotel',
            url: `/hotels?id=${hotel.id}`
          });
        });
      }

      // Add navigation items if we have a very small result set
      if (results.length < 3) {
        // Add common navigation targets
        const navPages = [
          { path: 'dashboard', title: 'Dashboard', keywords: ['home', 'dashboard', 'main', 'overview'] },
          { path: 'customers', title: 'Customers', keywords: ['customer', 'client', 'traveler'] },
          { path: 'bookings', title: 'Bookings', keywords: ['booking', 'reservation', 'tour', 'trip'] },
          { path: 'leads', title: 'Leads', keywords: ['lead', 'prospect', 'inquiry'] },
          { path: 'payments', title: 'Payments', keywords: ['payment', 'transaction', 'money', 'finance'] },
          { path: 'calendar', title: 'Calendar', keywords: ['calendar', 'schedule', 'date', 'event'] },
          { path: 'hotels', title: 'Hotels', keywords: ['hotel', 'accommodation', 'stay', 'lodging'] },
          { path: 'reports', title: 'Reports', keywords: ['report', 'analytics', 'statistics', 'data'] },
          { path: 'settings', title: 'Settings', keywords: ['setting', 'configuration', 'profile', 'account'] }
        ];
        
        navPages.forEach(page => {
          if (
            page.title.toLowerCase().includes(searchTerm) ||
            page.keywords.some(keyword => keyword.includes(searchTerm))
          ) {
            results.push({
              id: page.path,
              title: page.title,
              subtitle: `Navigate to ${page.title}`,
              type: 'navigation',
              url: `/${page.path}`
            });
          }
        });
      }
    } catch (error) {
      console.log("Supabase search failed, using mock data:", error);
      
      // Use API fallback if available
      try {
        const response = await get(API_ENDPOINTS.search.universal, { q: searchTerm });
        
        if (response?.data?.results?.length > 0) {
          // Format API results
          const apiResults = response.data.results.map((item: any) => ({
            id: item.id,
            title: item.title,
            subtitle: item.description,
            type: item.type as SearchResultType,
            url: item.url
          }));
          
          results = [...results, ...apiResults];
        }
      } catch (apiError) {
        console.error("API search also failed:", apiError);
      }
    }
    
    // Sort results by relevance - exact matches first
    results.sort((a, b) => {
      const aExactMatch = a.title.toLowerCase() === searchTerm;
      const bExactMatch = b.title.toLowerCase() === searchTerm;
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      const aStartsWith = a.title.toLowerCase().startsWith(searchTerm);
      const bStartsWith = b.title.toLowerCase().startsWith(searchTerm);
      
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      return 0;
    });
    
    return results;
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

/**
 * Get the icon name for a result type
 */
export function getIconForType(type: SearchResultType): string {
  switch (type) {
    case 'customer': return 'user';
    case 'booking': return 'package';
    case 'payment': return 'credit-card';
    case 'lead': return 'users';
    case 'itinerary': return 'map';
    case 'navigation': return 'layout-dashboard';
    case 'hotel': return 'hotel';
    default: return 'search';
  }
}

/**
 * Get display name for a result type
 */
export function getTypeDisplayName(type: SearchResultType): string {
  switch (type) {
    case 'customer': return 'Customer';
    case 'booking': return 'Booking';
    case 'payment': return 'Payment';
    case 'lead': return 'Lead';
    case 'itinerary': return 'Itinerary';
    case 'navigation': return 'Page';
    case 'hotel': return 'Hotel';
    default: return ((type as string).charAt(0).toUpperCase() + (type as string).slice(1));
  }
} 