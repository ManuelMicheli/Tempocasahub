-- ============================================================
-- Fix: allow authenticated users to create and update agencies
-- The original migration only had SELECT policy on agencies
-- ============================================================

-- Allow any authenticated user to create an agency
CREATE POLICY "agencies_insert" ON agencies FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow agency members to update their own agency
CREATE POLICY "agencies_update" ON agencies FOR UPDATE
  USING (id IN (SELECT agency_id FROM agents WHERE user_id = auth.uid()));
