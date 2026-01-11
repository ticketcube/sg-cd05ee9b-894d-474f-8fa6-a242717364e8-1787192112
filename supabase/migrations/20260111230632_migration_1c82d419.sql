-- Corrected RLS policies for staff uploads storage bucket
-- These policies check for role='otwstaff' in the profiles table

-- Policy 1: Staff can upload files
CREATE POLICY "Staff can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'staff-uploads' AND
  auth.uid() = owner AND
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'otwstaff')
);

-- Policy 2: Staff can view their uploads
CREATE POLICY "Staff can view their uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'staff-uploads' AND
  owner = auth.uid() AND
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'otwstaff')
);

-- Policy 3: Staff can delete their uploads
CREATE POLICY "Staff can delete their uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'staff-uploads' AND
  owner = auth.uid() AND
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'otwstaff')
);