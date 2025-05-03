-- Remove columns from site_user table
ALTER TABLE site_user
DROP COLUMN IF EXISTS degree,
DROP COLUMN IF EXISTS rank,
DROP COLUMN IF EXISTS place_of_work,
DROP COLUMN IF EXISTS is_verified;