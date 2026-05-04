import * as turf from '@turf/turf';

export async function loadLandData(): Promise<GeoJSON.FeatureCollection | GeoJSON.Feature | null> {
    try {
        const response = await import('/data/ne_110m_land.json?url');
        const dataUrl = response.default;
        const fetchResponse = await fetch(dataUrl);

        if (fetchResponse.ok) {
            const geojson = await fetchResponse.json();
            return geojson;
        }
    } catch {
    }

    const paths = [
        `${import.meta.env.BASE_URL}data/ne_110m_land.json`,
        '/data/ne_110m_land.json',
        './data/ne_110m_land.json',
    ];

    for (const path of paths) {
        try {
            const response = await fetch(path);

            if (response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const geojson = await response.json();
                    return geojson;
                }
            }
        } catch {
            continue;
        }
    }

    return null;
}


function normalizeLng(lng: number): number {
    let normalized = lng;
    while (normalized > 180) normalized -= 360;
    while (normalized < -180) normalized += 360;
    return normalized;
}


function normalizeLat(lat: number): number {
    if (lat > 90) return 90;
    if (lat < -90) return -90;
    return lat;
}

export function checkLandIntersection(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number },
    landData: GeoJSON.FeatureCollection | GeoJSON.Feature | null
): boolean {
    if (!landData) {
        return false;
    }

    try {
        // Нормализуем координаты
        const p1 = {
            lat: normalizeLat(point1.lat),
            lng: normalizeLng(point1.lng)
        };
        const p2 = {
            lat: normalizeLat(point2.lat),
            lng: normalizeLng(point2.lng)
        };

        const line = turf.lineString([
            [p1.lng, p1.lat],
            [p2.lng, p2.lat]
        ]);

        if (landData.type === 'FeatureCollection') {
            for (const feature of landData.features) {
                if (turf.booleanIntersects(line, feature)) {
                    return true;
                }
            }
            return false;
        } else if (landData.type === 'Feature') {
            return turf.booleanIntersects(line, landData);
        }

        return false;
    } catch (error) {
        console.error('Error checking intersection:', error);
        return false;
    }
}

export function checkSmoothedPathIntersection(
    positions: [number, number][],
    landData: GeoJSON.FeatureCollection | GeoJSON.Feature | null
): boolean {
    if (!landData || positions.length < 2) {
        return false;
    }

    try {
        for (let i = 0; i < positions.length - 1; i++) {
            // Нормализуем координаты каждой точки в отрезке
            const p1 = {
                lat: normalizeLat(positions[i][0]),
                lng: normalizeLng(positions[i][1])
            };
            const p2 = {
                lat: normalizeLat(positions[i + 1][0]),
                lng: normalizeLng(positions[i + 1][1])
            };

            const line = turf.lineString([
                [p1.lng, p1.lat],
                [p2.lng, p2.lat]
            ]);

            if (landData.type === 'FeatureCollection') {
                for (const feature of landData.features) {
                    if (turf.booleanIntersects(line, feature)) {
                        return true;
                    }
                }
            } else if (landData.type === 'Feature') {
                if (turf.booleanIntersects(line, landData)) {
                    return true;
                }
            }
        }

        return false;
    } catch (error) {
        console.error('Error checking smoothed path intersection:', error);
        return false;
    }
}