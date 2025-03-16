/*
  # Update job completion handling

  1. Changes
    - Add function to increment completed jobs count for workers
    - Add trigger to handle job completion
*/

-- Create function to increment completed jobs
CREATE OR REPLACE FUNCTION increment_completed_jobs(worker_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET completed_jobs = COALESCE(completed_jobs, 0) + 1
  WHERE id = worker_id;
END;
$$ LANGUAGE plpgsql;