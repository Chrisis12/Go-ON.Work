/*
  # Add applications table and update profiles

  1. New Tables
    - `applications`
      - `id` (uuid, primary key)
      - `job_id` (uuid, references jobs)
      - `worker_id` (uuid, references profiles)
      - `status` (text: pending, accepted, rejected)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Profile Updates
    - Add contact information fields to profiles table
      - `phone` (text)
      - `address` (text)
      - `bio` (text)

  3. Security
    - Enable RLS on applications table
    - Add policies for workers to create and read their applications
    - Add policies for employers to read and update applications for their jobs
*/

-- Add new fields to profiles
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE profiles ADD COLUMN phone text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'address') THEN
    ALTER TABLE profiles ADD COLUMN address text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') THEN
    ALTER TABLE profiles ADD COLUMN bio text;
  END IF;
END $$;

-- Create applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  worker_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(job_id, worker_id)
);

-- Enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'applications' 
    AND policyname = 'Workers can create applications'
  ) THEN
    CREATE POLICY "Workers can create applications"
      ON applications
      FOR INSERT
      TO authenticated
      WITH CHECK (
        worker_id = auth.uid() AND
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role = 'worker'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'applications' 
    AND policyname = 'Workers can read own applications'
  ) THEN
    CREATE POLICY "Workers can read own applications"
      ON applications
      FOR SELECT
      TO authenticated
      USING (
        worker_id = auth.uid()
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'applications' 
    AND policyname = 'Employers can read applications for their jobs'
  ) THEN
    CREATE POLICY "Employers can read applications for their jobs"
      ON applications
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM jobs
          WHERE jobs.id = applications.job_id
          AND jobs.employer_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'applications' 
    AND policyname = 'Employers can update application status'
  ) THEN
    CREATE POLICY "Employers can update application status"
      ON applications
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM jobs
          WHERE jobs.id = applications.job_id
          AND jobs.employer_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM jobs
          WHERE jobs.id = applications.job_id
          AND jobs.employer_id = auth.uid()
        )
      );
  END IF;
END $$;