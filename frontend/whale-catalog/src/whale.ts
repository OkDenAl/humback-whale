// src/types/whale.ts
export interface WhaleType {
    id: string;
    species_eng: string;
    species_rus: string;
    family: string;
    genus: string;
    conservation_status: string;
}

export interface WhaleImage {
    id: string;
    author_id: string;
    username: string;
    name: string;
    gender: string;
    created_at: string;
    saw_at: string;
    longitude: number;
    latitude: number;
    description: string;
    whale_type: WhaleType | null;
    image_url: string;
    can_edit?: boolean;
}