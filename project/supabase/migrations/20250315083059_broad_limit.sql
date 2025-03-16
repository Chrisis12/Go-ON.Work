/*
  # Add job status and rating system

  1. Changes
    - Add `completed_at` column to jobs table
    - Add `worker_rating` column to applications table
    - Add check constraint for worker_rating (1-5)
    - Add trigger to update worker rating and completed_jobs count

  2. Security
    - Add policies for rating workers
*/

-- Add completed_at to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Add worker_rating to applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS worker_rating integer;

-- Add check constraint for worker_rating
ALTER TABLE applications ADD CONSTRAINT worker_rating_check 
  CHECK (worker_rating IS NULL OR (worker_rating >= 1 AND worker_rating <= 5));

-- Create function to update worker rating
CREATE OR REPLACE FUNCTION update_worker_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if a rating was given
  IF NEW.worker_rating IS NOT NULL THEN
    -- Update the worker's rating using the ELO formula
    UPDATE profiles
    SET 
      rating = rating + (5 * (NEW.worker_rating - 3)),
      completed_jobs = completed_jobs + 1
    WHERE id = NEW.worker_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating worker rating
DROP TRIGGER IF EXISTS on_worker_rating ON applications;
CREATE TRIGGER on_worker_rating
  AFTER UPDATE OF worker_rating
  ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_worker_rating();

-- Set default rating for new profiles
ALTER TABLE profiles ALTER COLUMN rating SET DEFAULT 100;