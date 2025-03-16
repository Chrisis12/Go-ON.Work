-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_worker_rating ON applications;
DROP FUNCTION IF EXISTS update_worker_rating();

-- Create updated function to handle worker rating and completed jobs
CREATE OR REPLACE FUNCTION update_worker_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if a rating was given and it's different from the old rating
  IF NEW.worker_rating IS NOT NULL AND (OLD.worker_rating IS NULL OR NEW.worker_rating != OLD.worker_rating) THEN
    -- Update the worker's rating using the corrected ELO formula
    -- New ELO = Old ELO + 5 × (Rating - 3)
    UPDATE profiles
    SET rating = rating + (5 * (NEW.worker_rating - 3))
    WHERE id = NEW.worker_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER on_worker_rating
  AFTER UPDATE OF worker_rating
  ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_worker_rating();

-- Create function to handle job completion
CREATE OR REPLACE FUNCTION handle_job_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- If the job is being marked as completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update completed_jobs count for all accepted workers
    UPDATE profiles
    SET completed_jobs = completed_jobs + 1
    WHERE id IN (
      SELECT worker_id
      FROM applications
      WHERE job_id = NEW.id
      AND status = 'accepted'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for job completion
CREATE TRIGGER on_job_completion
  AFTER UPDATE OF status
  ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION handle_job_completion();

-- Ensure all workers start with rating 100
UPDATE profiles 
SET rating = 100 
WHERE role = 'worker' AND rating IS NULL;