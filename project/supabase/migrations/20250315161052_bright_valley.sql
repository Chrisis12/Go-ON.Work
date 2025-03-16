/*
  # Update employer rating calculation

  1. Changes
    - Modify the employer rating calculation to handle per-job average ratings
    - Update the trigger function to recalculate based on all job averages
*/

-- Create function to update employer rating
CREATE OR REPLACE FUNCTION update_employer_rating()
RETURNS TRIGGER AS $$
DECLARE
  job_averages RECORD;
  total_rating DECIMAL := 0;
  job_count INTEGER := 0;
  final_rating INTEGER;
BEGIN
  -- Calculate average rating for each job
  FOR job_averages IN (
    SELECT 
      job_id,
      AVG(rating)::DECIMAL as avg_rating
    FROM employer_ratings
    WHERE employer_id = NEW.employer_id
    GROUP BY job_id
  ) LOOP
    total_rating := total_rating + job_averages.avg_rating;
    job_count := job_count + 1;
  END LOOP;

  -- Calculate overall average and adjustment
  IF job_count > 0 THEN
    -- Calculate rating adjustment: 5 * (avg_rating - 3)
    final_rating := 100 + ROUND(5 * ((total_rating / job_count) - 3));
  ELSE
    final_rating := 100;
  END IF;
  
  -- Update employer's rating
  UPDATE profiles
  SET rating = final_rating
  WHERE id = NEW.employer_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;