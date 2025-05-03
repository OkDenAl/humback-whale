CREATE TABLE IF NOT EXISTS whale_type (
    id UUID PRIMARY KEY,
    species_eng TEXT NOT NULL UNIQUE,
    species_rus TEXT NOT NULL UNIQUE,
    family TEXT,
    genus TEXT,
    conservation_status TEXT
);