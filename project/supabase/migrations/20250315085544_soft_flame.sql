/*
  # Ensure default rating for workers

  1. Changes
    - Set default rating of 100 for all worker profiles
    - Add trigger to automatically set rating to 100 for new worker profiles
    - Set default rating to 0 for non-worker profiles
*/

-- First set the default to 0 for all profiles
ALTER TABLE profiles 
ALTER COLUMN rating SET DEFAULT 0;

-- Update existing workers to have rating of 100
UPDATE profiles 
SET rating = 100 
WHERE role = 'worker' AND (rating IS NULL OR rating = 0);

-- Create function to set default rating based on role
CREATE OR REPLACE FUNCTION set_default_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'worker' THEN
    NEW.rating := 100;
  ELSE
    NEW.rating := 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set default rating on insert
DROP TRIGGER IF EXISTS set_worker_rating ON profiles;
CREATE TRIGGER set_worker_rating
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_default_rating();