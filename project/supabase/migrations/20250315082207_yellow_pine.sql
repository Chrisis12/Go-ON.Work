/*
  # Disable RLS on tables temporarily
  
  1. Changes
    - Disable RLS on profiles table
    - Disable RLS on jobs table
    - Disable RLS on applications table
*/

-- Disable RLS on all tables
alter table profiles disable row level security;
alter table jobs disable row level security;
alter table applications disable row level security;