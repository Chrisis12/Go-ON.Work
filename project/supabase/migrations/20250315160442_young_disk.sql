/*
  # Add employer rating system

  1. Changes
    - Add default rating of 100 to profiles table for employers
    - Add employer_ratings table to track individual ratings from workers
    - Add trigger to update employer rating when new ratings are added

  2. Security
    - Enable RLS on employer_ratings table
    - Add policy for workers to rate employers on completed jobs
    - Add policy for employers to view their own ratings
*/

-- Set default rating of 100 for employers
DO $$
BEGIN
  UPDATE profiles 
  SET rating = 100 
  WHERE role = 'employer' AND rating = 0;
END $$;

-- Create employer ratings table
CREATE TABLE IF NOT EXISTS employer_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  employer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  worker_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  UNIQUE(job_id, worker_id)
);

-- Enable RLS
ALTER TABLE employer_ratings ENABLE ROW LEVEL SECURITY;

-- Create policy for workers to rate employers
CREATE POLICY "Workers can rate employers for completed jobs"
  ON employer_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs j
      INNER JOIN applications a ON a.job_id = j.id
      WHERE j.id = employer_ratings.job_id
      AND j.status = 'completed'
      AND a.worker_id = auth.uid()
      AND a.worker_id = employer_ratings.worker_id
      AND a.status = 'accepted'
    )
  );

-- Create policy for workers to view their ratings
CREATE POLICY "Workers can view their ratings"
  ON employer_ratings
  FOR SELECT
  TO authenticated
  USING (worker_id = auth.uid());

-- Create policy for employers to view their ratings
CREATE POLICY "Employers can view their ratings"
  ON employer_ratings
  FOR SELECT
  TO authenticated
  USING (employer_id = auth.uid());

-- Create function to update employer rating
CREATE OR REPLACE FUNCTION update_employer_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL;
  rating_adjustment INTEGER;
BEGIN
  -- Calculate average rating for the employer
  SELECT AVG(rating)::DECIMAL
  INTO avg_rating
  FROM employer_ratings
  WHERE employer_id = NEW.employer_id;
  
  -- Calculate rating adjustment: 5 * (avg_rating - 3)
  rating_adjustment := ROUND(5 * (avg_rating - 3));
  
  -- Update employer's rating
  UPDATE profiles
  SET rating = 100 + rating_adjustment
  WHERE id = NEW.employer_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rating updates
CREATE TRIGGER on_employer_rating
AFTER INSERT ON employer_ratings
FOR EACH ROW
EXECUTE FUNCTION update_employer_rating();