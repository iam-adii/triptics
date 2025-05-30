-- Function to create a storage bucket with proper permissions
CREATE OR REPLACE FUNCTION public.create_storage_bucket(bucket_id TEXT, public_bucket BOOLEAN DEFAULT TRUE)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
  -- Check if bucket exists
  SELECT EXISTS (
    SELECT 1
    FROM storage.buckets
    WHERE name = bucket_id
  ) INTO bucket_exists;

  -- Create bucket if it doesn't exist
  IF NOT bucket_exists THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES (bucket_id, bucket_id, public_bucket);
    
    -- Add policies for the bucket
    -- Read policy
    INSERT INTO storage.policies (name, bucket_id, definition, owner)
    VALUES (
      'Public Read Access',
      bucket_id,
      jsonb_build_object(
        'bucket_id', bucket_id,
        'operation', 'read'
      ),
      'authenticated'
    );
    
    -- Write policy for authenticated users
    INSERT INTO storage.policies (name, bucket_id, definition, owner)
    VALUES (
      'Authenticated Users Upload',
      bucket_id,
      jsonb_build_object(
        'bucket_id', bucket_id,
        'operation', 'write'
      ),
      'authenticated'
    );
    
    -- Update policy for authenticated users
    INSERT INTO storage.policies (name, bucket_id, definition, owner)
    VALUES (
      'Authenticated Users Update',
      bucket_id,
      jsonb_build_object(
        'bucket_id', bucket_id,
        'operation', 'update'
      ),
      'authenticated'
    );
    
    RETURN TRUE;
  ELSE
    -- Bucket already exists
    RETURN FALSE;
  END IF;
END;
$$; 