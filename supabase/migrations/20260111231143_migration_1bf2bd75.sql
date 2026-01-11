-- Drop the incorrect policies
DROP POLICY IF EXISTS "Staff can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Staff can view their uploads" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete their uploads" ON storage.objects;

-- Create corrected policies that check user_profiles table
CREATE POLICY "Staff can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'staff-uploads' AND
  auth.uid() = owner AND
  auth.uid() IN (SELECT user_id FROM user_profiles WHERE role = 'otwstaff')
);

CREATE POLICY "Staff can view their uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'staff-uploads' AND
  owner = auth.uid() AND
  auth.uid() IN (SELECT user_id FROM user_profiles WHERE role = 'otwstaff')
);

CREATE POLICY "Staff can delete their uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'staff-uploads' AND
  owner = auth.uid() AND
  auth.uid() IN (SELECT user_id FROM user_profiles WHERE role = 'otwstaff')
);