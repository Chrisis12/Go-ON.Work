/*
  # Update employer rating calculation

  1. Changes
    - Modify the employer rating calculation to sum the individual job rating adjustments
    - Each job's rating adjustment is calculated as: 5 * (avg_job_rating - 3)
    - The employer's final rating is: 100 + sum of all job rating adjustments

  2. Technical Details
    - Updates the update_employer_rating() function
    - No schema changes required
    - Maintains all existing RLS policies and triggers
*/

-- Create or replace function to update employer rating with new calculation
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
      AVG(rating)::DECIMAL as avg_rating
    FROM employer_ratings
    WHERE employer_id = NEW.employer_id
    GROUP BY job_id
  ) LOOP
    -- For each job: 5 * (avg_rating - 3)
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