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
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;

-- Create applications table
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

-- Policies for workers
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

CREATE POLICY "Workers can read own applications"
  ON applications
  FOR SELECT
  TO authenticated
  USING (
    worker_id = auth.uid()
  );

-- Policies for employers
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