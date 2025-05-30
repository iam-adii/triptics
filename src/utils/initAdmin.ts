import { supabase } from "@/integrations/supabase/client";

/**
 * Initialize the admin user in the system
 * This is useful for setting up the initial admin user when the application is first deployed
 */
export const initializeFirstUserAsAdmin = async (): Promise<boolean> => {
  try {
    // First, try to make admin@admin.com an admin
    const result = await makeSpecificUserAdmin("admin@admin.com");
    if (result) {
      return true;
    }
    
    // If that fails, fall back to making the first user an admin
    return await makeFirstUserAdmin();
  } catch (error) {
    console.error("Error in initializeFirstUserAsAdmin:", error);
    return false;
  }
};

/**
 * Make a specific user an admin by email
 */
const makeSpecificUserAdmin = async (email: string): Promise<boolean> => {
  try {
    // Get the user by email from user_settings
    const { data: userData, error: userError } = await supabase
      .from("user_settings")
      .select("user_id, role_id")
      .eq("email", email)
      .single();

    if (userError) {
      console.error(`User ${email} not found in user_settings:`, userError);
      return false;
    }

    // If the user already has a role, check if it's admin
    if (userData.role_id) {
      // Get the role name
      const { data: roleData } = await supabase
        .from("roles")
        .select("name")
        .eq("id", userData.role_id)
        .single();

      if (roleData && roleData.name === "admin") {
        console.log(`User ${email} is already an admin`);
        return true;
      }
    }

    // Get the admin role
    const { data: adminRole, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("name", "admin")
      .single();

    if (roleError) {
      console.error("Error fetching admin role:", roleError);
      return false;
    }

    // Assign admin role to the user
    const { error: updateError } = await supabase
      .from("user_settings")
      .update({ role_id: adminRole.id })
      .eq("user_id", userData.user_id);

    if (updateError) {
      console.error("Error updating user role:", updateError);
      return false;
    }

    console.log(`Successfully made ${email} an admin`);
    return true;
  } catch (error) {
    console.error(`Error making ${email} an admin:`, error);
    return false;
  }
};

/**
 * Make the first user in the system an admin
 */
const makeFirstUserAdmin = async (): Promise<boolean> => {
  try {
    // Get the first user in the system
    const { data: userData, error: userError } = await supabase
      .from("user_settings")
      .select("user_id, role_id")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (userError) {
      console.error("Error fetching first user:", userError);
      return false;
    }

    // If the user already has a role, do nothing
    if (userData.role_id) {
      console.log("First user already has a role assigned");
      return true;
    }

    // Get the admin role
    const { data: roleData, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("name", "admin")
      .single();

    if (roleError) {
      console.error("Error fetching admin role:", roleError);
      return false;
    }

    // Assign admin role to the first user
    const { error: updateError } = await supabase
      .from("user_settings")
      .update({ role_id: roleData.id })
      .eq("user_id", userData.user_id);

    if (updateError) {
      console.error("Error updating user role:", updateError);
      return false;
    }

    console.log("Successfully initialized first user as admin");
    return true;
  } catch (error) {
    console.error("Error in makeFirstUserAdmin:", error);
    return false;
  }
}; 