/*
  # Add profile visibility feature

  1. Changes
    - Add `is_visible` column to profiles table
    - Add policy for workers to view other visible worker profiles

  2. Security
    - Only workers can view other worker profiles
    - Workers can only see profiles that are marked as visible
*/

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT false;

-- Create policy for workers to view other visible worker profiles
CREATE POLICY "Workers can view other visible worker profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  (auth.uid() != id) AND  -- Not viewing own profile
  (role = 'worker') AND   -- Profile belongs to a worker
  (is_visible = true) AND -- Profile is visible
  (EXISTS (              -- Viewer is a worker
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'worker'
  ))
);