CREATE TABLE IF NOT EXISTS humpback_whale (
    id UUID PRIMARY KEY,
    author_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL,
    object_id uuid NOT NULL,
    longitude FLOAT,
    latitude FLOAT,
    description TEXT,
    whale_type TEXT
);

CREATE INDEX IF NOT EXISTS humpback_whale_created_at_idx ON humpback_whale (created_at);
CREATE INDEX IF NOT EXISTS humpback_whale_author_id_idx ON humpback_whale (author_id, created_at);
CREATE INDEX IF NOT EXISTS humpback_whale_whale_type_idx ON humpback_whale (whale_type);



