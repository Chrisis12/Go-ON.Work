/*
  # Fix profiles table RLS policies

  1. Security Changes
    - Add INSERT policy to allow authenticated users to create their own profile
    - Modify existing policies to be more specific about columns
    - Ensure proper security while allowing profile creation

  2. Changes
    - Add new INSERT policy
    - Update existing SELECT and UPDATE policies
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create comprehensive policies
CREATE POLICY "Users can create their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);