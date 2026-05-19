-- Migration 005: Add avatar_url column to users

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create uploads directory reference (for documentation)
-- Note: In production, consider using cloud storage like S3, Cloudinary, etc.
-- The local file system storage is suitable for development and small deployments

