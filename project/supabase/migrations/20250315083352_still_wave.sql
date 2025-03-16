/*
  # Fix job status constraint

  1. Changes
    - Drop existing status check constraint
    - Add new status check constraint with all valid statuses
    - Update existing jobs with invalid statuses to 'open'

  2. Notes
    - Valid statuses: open, in-progress, closed, completed
*/

-- First, drop the existing constraint
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS status_check;

-- Add the new constraint with all valid statuses
ALTER TABLE jobs ADD CONSTRAINT status_check
  CHECK (status = ANY (ARRAY['open'::text, 'in-progress'::text, 'closed'::text, 'completed'::text]));

-- Update any jobs with invalid status to 'open'
UPDATE jobs SET status = 'open' WHERE status NOT IN ('open', 'in-progress', 'closed', 'completed');