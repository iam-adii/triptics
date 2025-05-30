import { supabase } from "@/integrations/supabase/client";

/**
 * Ensures that required storage buckets exist
 */
export const ensureStorageBuckets = async () => {
  try {
    console.log("Ensuring storage buckets exist...");
    
    // First check if we can access storage at all
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.warn("Cannot list buckets, may be due to permissions:", error);
        // Instead of failing, we'll try to proceed with upload anyway
        return true;
      }
      
      const userContentBucketExists = buckets.some(bucket => bucket.name === 'user-content');
      
      if (!userContentBucketExists) {
        console.log("Attempting to create user-content storage bucket");
        
        try {
          // Create the user-content bucket
          const { error: createError } = await supabase.storage.createBucket('user-content', {
            public: true,
            fileSizeLimit: 1024 * 1024 * 2, // 2MB limit for files
          });
          
          if (createError) {
            console.warn("Could not create bucket, will try to use it anyway:", createError);
            // Continue anyway, as the bucket might already exist but not be visible to this user
          }
        } catch (bucketError) {
          console.warn("Error creating bucket, will try upload anyway:", bucketError);
        }
      }
    } catch (accessError) {
      console.warn("Error accessing storage, will try upload anyway:", accessError);
    }
    
    return true;
  } catch (error) {
    console.error("Error ensuring storage buckets:", error);
    // Return true anyway to allow the upload to attempt
    return true;
  }
};

/**
 * Uploads a file to a specified bucket and returns the public URL
 */
export const uploadFile = async (
  file: File, 
  bucket: string, 
  path: string
): Promise<string | null> => {
  try {
    if (!file) {
      console.error("No file provided for upload");
      return null;
    }
    
    // Ensure file size is reasonable (under 2MB)
    if (file.size > 2 * 1024 * 1024) {
      throw new Error("File size exceeds 2MB limit");
    }
    
    // Ensure bucket exists using our simplified approach
    await ensureBucketExists(bucket);
    
    console.log(`Uploading file to ${bucket}/${path}`, file.type, file.size);
    
    // Upload the file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true // Overwrite if file exists
      });
      
    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }
    
    console.log("Upload successful:", uploadData);
    
    // Get the public URL
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    if (!data || !data.publicUrl) {
      throw new Error("Failed to get public URL after upload");
    }
    
    console.log("Generated public URL:", data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error; // Rethrow so the caller can handle it
  }
};

/**
 * A simpler direct upload function that doesn't check for buckets
 * This is a fallback approach when the regular upload fails
 */
export const simpleUploadFile = async (
  file: File, 
  bucket: string, 
  path: string
): Promise<string | null> => {
  try {
    if (!file) {
      console.error("No file provided for upload");
      return null;
    }
    
    // Ensure file size is reasonable (under 2MB)
    if (file.size > 2 * 1024 * 1024) {
      throw new Error("File size exceeds 2MB limit");
    }
    
    console.log(`Direct upload attempt to ${bucket}/${path}`, file.type, file.size);
    
    // Direct upload without checking buckets
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true // Overwrite if file exists
      });
      
    if (uploadError) {
      console.error("Direct upload error:", uploadError);
      throw uploadError;
    }
    
    // Get the public URL
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    if (!data || !data.publicUrl) {
      throw new Error("Failed to get public URL after direct upload");
    }
    
    console.log("Direct upload successful, URL:", data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error("Error in direct upload:", error);
    throw error;
  }
};

/**
 * Last resort attempt to ensure the bucket exists
 * This is a simplified approach that just tries to use the bucket directly
 */
export const ensureBucketExists = async (bucketName: string = 'user-content'): Promise<boolean> => {
  try {
    console.log(`Attempting to ensure bucket '${bucketName}' exists...`);
    
    // Try to list files in the bucket - if it exists, this should work
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list();
    
    if (error) {
      console.warn(`Error listing files in bucket '${bucketName}':`, error);
      // Even if there's an error, we'll try to use the bucket anyway
    } else {
      console.log(`Successfully listed files in bucket '${bucketName}'`, data?.length || 0, "files found");
    }
    
    return true;
  } catch (error) {
    console.error(`Error checking bucket '${bucketName}':`, error);
    return false;
  }
} 