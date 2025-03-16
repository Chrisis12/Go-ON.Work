/*
  # Create jobs table and policies

  1. New Tables
    - `jobs`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `employer_id` (uuid, references profiles)
      - `category` (text)
      - `location` (text)
      - `wage` (numeric)
      - `required_skills` (text[])
      - `recommended_skills` (text[])
      - `status` (text)
      - `applications` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `jobs` table
    - Add policies for:
      - Employers can create jobs
      - Everyone can read jobs
      - Employers can update their own jobs
      - Employers can delete their own jobs
*/

CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  employer_id uuid NOT NULL REFERENCES profiles(id),
  category text NOT NULL,
  location text NOT NULL,
  wage numeric NOT NULL,
  required_skills text[] DEFAULT '{}',
  recommended_skills text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'open',
  applications integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT status_check CHECK (status IN ('open', 'in-progress', 'completed'))
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Employers can create jobs
CREATE POLICY "Employers can create jobs"
  ON jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employer'
    )
  );

-- Everyone can read jobs
CREATE POLICY "Everyone can read jobs"
  ON jobs
  FOR SELECT
  TO authenticated
  USING (true);

-- Employers can update their own jobs
CREATE POLICY "Employers can update own jobs"
  ON jobs
  FOR UPDATE
  TO authenticated
  USING (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid());

-- Employers can delete their own jobs
CREATE POLICY "Employers can delete own jobs"
  ON jobs
  FOR DELETE
  TO authenticated
  USING (employer_id = auth.uid());