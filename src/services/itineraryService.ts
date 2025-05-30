
import { supabase } from "@/integrations/supabase/client";
import { Itinerary } from "@/types/itinerary";

// Fetch itineraries from Supabase
export const fetchItineraries = async (): Promise<Itinerary[]> => {
  const { data, error } = await supabase
    .from("itineraries")
    .select(`
      *,
      customers:client_id (name)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

// Delete itinerary
export const deleteItinerary = async (id: string): Promise<string> => {
  const { error } = await supabase.from("itineraries").delete().eq("id", id);
  if (error) throw error;
  return id;
};

// Update itinerary status
export const updateItineraryStatus = async ({
  id,
  status,
}: {
  id: string;
  status: string;
}): Promise<{ id: string; status: string }> => {
  const { error } = await supabase
    .from("itineraries")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
  return { id, status };
};
