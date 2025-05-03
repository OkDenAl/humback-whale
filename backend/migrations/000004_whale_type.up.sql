CREATE TABLE IF NOT EXISTS whale_type (
    id UUID PRIMARY KEY,
    species_eng TEXT NOT NULL UNIQUE,
    species_rus TEXT NOT NULL UNIQUE,
    family TEXT,
    genus TEXT,
    conservation_status TEXT
);

INSERT INTO whale_type (id, species_eng, species_rus, family, genus, conservation_status)
VALUES
    (gen_random_uuid(), 'Megaptera novaeangliae', 'Горбатый Кит', 'Balaenopteridae', 'Megaptera', 'Least Concern'),
    (gen_random_uuid(), 'Balaenoptera musculus', 'Голубой Кит', 'Balaenopteridae', 'Balaenoptera', 'Endangered');