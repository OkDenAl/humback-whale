CREATE TABLE IF NOT EXISTS site_user (
     id UUID PRIMARY KEY,
     email TEXT NOT NULL UNIQUE,
     username TEXT NOT NULL UNIQUE,
     password TEXT NOT NULL,
     user_role TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS user_by_email_idx ON site_user USING HASH (email);
CREATE INDEX IF NOT EXISTS user_by_username_idx ON site_user USING HASH (username);