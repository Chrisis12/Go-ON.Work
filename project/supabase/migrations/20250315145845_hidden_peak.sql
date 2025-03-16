/*
  # Create avatars storage bucket and policies

  1. Storage
    - Create public bucket 'avatars' for storing user profile pictures
    - Enable public access to the bucket
  
  2. Security
    - Add policy for authenticated users to upload their own avatar
    - Add policy for public read access to all avatars
*/

-- Create avatars bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Create policy to allow authenticated users to upload their own avatar
create policy "Users can upload their own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars' AND
  auth.uid()::text = substring(name from '([^/]+)\.[^.]+$')
);

-- Create policy to allow public access to avatars
create policy "Anyone can view avatars"
on storage.objects for select
to public
using ( bucket_id = 'avatars' );