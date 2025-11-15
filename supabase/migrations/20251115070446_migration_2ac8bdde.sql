-- Add public read policy to city_latlong table
-- This allows the CityCombobox to fetch cities for the dropdown
CREATE POLICY "Anyone can view cities" 
ON city_latlong 
FOR SELECT 
USING (true);