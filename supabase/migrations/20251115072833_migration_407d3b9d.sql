-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "ticketmaster_events_public_read" ON ticketmaster_events;

-- Create a new policy that allows public (anon + authenticated) read access
CREATE POLICY "ticketmaster_events_public_read" 
ON ticketmaster_events 
FOR SELECT 
TO public
USING (true);