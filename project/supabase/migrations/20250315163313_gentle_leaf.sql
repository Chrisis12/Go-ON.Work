/*
  # Fix employer rating calculation

  1. Changes
    - Update the employer rating calculation function to properly handle rating updates
    - Ensure each job's contribution is calculated correctly
    - Fix the issue where rating changes were being doubled

  2. Implementation Details
    - Calculate each job's rating adjustment independently
    - Add all adjustments to base rating of 100
    - Trigger recalculation on both INSERT and UPDATE
*/

-- Create or replace function to update employer rating with fixed calculation
CREATE OR REPLACE FUNCTION update_employer_rating()
RETURNS TRIGGER AS $$
DECLARE
  job_ratings RECORD;
  total_adjustment INTEGER := 0;
  final_rating INTEGER;
BEGIN
  -- Calculate rating adjustment for each job
  FOR job_ratings IN (
    SELECT 
      job_id,
      AVG(rating)::DECIMAL as avg_rating,
      COUNT(*) as rater_count
    FROM employer_ratings
    WHERE employer_id = NEW.employer_id
    GROUP BY job_id
  ) LOOP
    -- For each job: 5 * (avg_rating - 3)
    -- This gives us the adjustment for this specific job
    total_adjustment := total_adjustment + ROUND(5 * (job_ratings.avg_rating - 3));
  END LOOP;

  -- Final rating is base rating (100) plus sum of all job adjustments
  final_rating := 100 + total_adjustment;
  
  -- Update employer's rating
  UPDATE profiles
  SET rating = final_rating
  WHERE id = NEW.employer_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_employer_rating ON employer_ratings;

-- Create new trigger that handles both INSERT and UPDATE
CREATE TRIGGER on_employer_rating
AFTER INSERT OR UPDATE ON employer_ratings
FOR EACH ROW
EXECUTE FUNCTION update_employer_rating();