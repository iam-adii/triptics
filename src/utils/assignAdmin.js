import { supabase } from "@/integrations/supabase/client";

/**
 * Assigns admin role to a user with the given email
 * @param {string} email - The email of the user to make admin
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const assignAdminRole = async (email = "admin@admin.com") => {
  try {
    console.log(`Attempting to assign admin role to user with email: ${email}`);
    
    // 1. Get the user by email
    const { data: userData, error: userError } = await supabase
      .from("user_settings")
      .select("user_id, role_id")
      .eq("email", email)
      .single();

    if (userError) {
      console.error("Error fetching user:", userError);
      return false;
    }

    if (!userData) {
      console.error("User not found with email:", email);
      return false;
    }

    console.log("Found user:", userData);

    // 2. Get the admin role
    const { data: roleData, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("name", "admin")
      .single();

    if (roleError) {
      console.error("Error fetching admin role:", roleError);
      return false;
    }

    console.log("Found admin role:", roleData);

    // 3. Assign admin role to the user
    const { error: updateError } = await supabase
      .from("user_settings")
      .update({ role_id: roleData.id })
      .eq("user_id", userData.user_id);

    if (updateError) {
      console.error("Error updating user role:", updateError);
      return false;
    }

    console.log(`Successfully assigned admin role to user with email: ${email}`);
    return true;
  } catch (error) {
    console.error("Error in assignAdminRole:", error);
    return false;
  }
};

// Execute the function when the file is run directly
if (typeof window !== "undefined") {
  assignAdminRole().then(result => {
    console.log("Operation result:", result ? "Success" : "Failed");
  });
} 