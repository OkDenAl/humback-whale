export interface Point {
    id: number;
    name: string;
    lat: number;
    lng: number;
    groupId: number;
}

export interface Group {
    id: number;
    name: string;
    color: string;
    smoothing?: SmoothingType;
}

export interface Line {
    positions: [number, number][];
    color: string;
    groupId: number;
    pointIds: [number, number];
    intersectsLand?: boolean;
}

export interface MapClickHandlerProps {
    onMapClick: (latlng: { lat: number; lng: number }) => void;
    isAddingMode: boolean;
}

export interface EditingPoint {
    id: number;
    lat: string;
    lng: string;
}

export type SmoothingType = 'none' | 'quadratic-bezier' | 'cubic-bezier' | 'catmull-rom' | 'b-spline';