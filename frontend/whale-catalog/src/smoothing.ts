import type { SmoothingType } from './types';

export function smoothPath(
    points: Array<{ lat: number; lng: number }>,
    smoothingType: SmoothingType,
    segments: number = 20
): [number, number][] {
    if (points.length < 2 || smoothingType === 'none') {
        return points.map(p => [p.lat, p.lng]);
    }

    switch (smoothingType) {
        case 'quadratic-bezier':
            return quadraticBezier(points, segments);
        case 'cubic-bezier':
            return cubicBezier(points, segments);
        case 'catmull-rom':
            return catmullRomSpline(points, segments);
        case 'b-spline':
            return bSpline(points, segments);
        default:
            return points.map(p => [p.lat, p.lng]);
    }
}

function quadraticBezier(points: Array<{ lat: number; lng: number }>, segments: number): [number, number][] {
    const result: [number, number][] = [];

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];

        let tangentLat = 0;
        let tangentLng = 0;

        if (i > 0) {
            tangentLat = (p1.lat - points[i - 1].lat) / 2;
            tangentLng = (p1.lng - points[i - 1].lng) / 2;
        } else {
            tangentLat = (p1.lat - p0.lat) / 2;
            tangentLng = (p1.lng - p0.lng) / 2;
        }

        const controlLat = p0.lat + tangentLat;
        const controlLng = p0.lng + tangentLng;

        for (let t = 0; t <= 1; t += 1 / segments) {
            const lat = (1 - t) * (1 - t) * p0.lat +
                2 * (1 - t) * t * controlLat +
                t * t * p1.lat;
            const lng = (1 - t) * (1 - t) * p0.lng +
                2 * (1 - t) * t * controlLng +
                t * t * p1.lng;
            result.push([lat, lng]);
        }
    }

    const last = points[points.length - 1];
    result.push([last.lat, last.lng]);

    return result;
}

function cubicBezier(points: Array<{ lat: number; lng: number }>, segments: number): [number, number][] {
    const result: [number, number][] = [];

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];

        const control1Lat = p0.lat + (p1.lat - p0.lat) * 0.25;
        const control1Lng = p0.lng + (p1.lng - p0.lng) * 0.25 + (p1.lat - p0.lat) * 0.2;

        const control2Lat = p0.lat + (p1.lat - p0.lat) * 0.75;
        const control2Lng = p0.lng + (p1.lng - p0.lng) * 0.75 - (p1.lat - p0.lat) * 0.2;

        for (let t = 0; t <= 1; t += 1 / segments) {
            const lat = Math.pow(1 - t, 3) * p0.lat +
                3 * Math.pow(1 - t, 2) * t * control1Lat +
                3 * (1 - t) * Math.pow(t, 2) * control2Lat +
                Math.pow(t, 3) * p1.lat;
            const lng = Math.pow(1 - t, 3) * p0.lng +
                3 * Math.pow(1 - t, 2) * t * control1Lng +
                3 * (1 - t) * Math.pow(t, 2) * control2Lng +
                Math.pow(t, 3) * p1.lng;
            result.push([lat, lng]);
        }
    }

    const last = points[points.length - 1];
    result.push([last.lat, last.lng]);

    return result;
}

function catmullRomSpline(points: Array<{ lat: number; lng: number }>, segments: number): [number, number][] {
    if (points.length < 2) {
        return points.map(p => [p.lat, p.lng]);
    }

    const result: [number, number][] = [];

    if (points.length === 2) {
        for (let t = 0; t <= 1; t += 1 / segments) {
            const lat = points[0].lat + (points[1].lat - points[0].lat) * t;
            const lng = points[0].lng + (points[1].lng - points[0].lng) * t;
            result.push([lat, lng]);
        }
        result.push([points[1].lat, points[1].lng]);
        return result;
    }

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = i > 0 ? points[i - 1] : points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = i < points.length - 2 ? points[i + 2] : points[i + 1];

        for (let t = 0; t < 1; t += 1 / segments) {
            const t2 = t * t;
            const t3 = t2 * t;

            const lat = 0.5 * (
                (2 * p1.lat) +
                (-p0.lat + p2.lat) * t +
                (2 * p0.lat - 5 * p1.lat + 4 * p2.lat - p3.lat) * t2 +
                (-p0.lat + 3 * p1.lat - 3 * p2.lat + p3.lat) * t3
            );

            const lng = 0.5 * (
                (2 * p1.lng) +
                (-p0.lng + p2.lng) * t +
                (2 * p0.lng - 5 * p1.lng + 4 * p2.lng - p3.lng) * t2 +
                (-p0.lng + 3 * p1.lng - 3 * p2.lng + p3.lng) * t3
            );

            result.push([lat, lng]);
        }
    }

    const last = points[points.length - 1];
    result.push([last.lat, last.lng]);

    return result;
}

function bSpline(points: Array<{ lat: number; lng: number }>, segments: number): [number, number][] {
    if (points.length < 3) {
        return points.map(p => [p.lat, p.lng]);
    }

    const result: [number, number][] = [];

    result.push([points[0].lat, points[0].lng]);

    for (let i = 0; i < points.length - 2; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const p2 = points[i + 2];

        const startT = i === 0 ? 1 / segments : 0;

        for (let t = startT; t <= 1; t += 1 / segments) {
            const b0 = (1 - t) * (1 - t) / 2;
            const b1 = (-2 * t * t + 2 * t + 1) / 2;
            const b2 = t * t / 2;

            const lat = b0 * p0.lat + b1 * p1.lat + b2 * p2.lat;
            const lng = b0 * p0.lng + b1 * p1.lng + b2 * p2.lng;

            result.push([lat, lng]);
        }
    }

    const last = points[points.length - 1];
    result.push([last.lat, last.lng]);

    return result;
}

export function getSmoothingName(type: SmoothingType): string {
    const names: Record<SmoothingType, string> = {
        'none': 'Без сглаживания',
        'quadratic-bezier': 'Квадратичная кривая Безье',
        'cubic-bezier': 'Кубическая кривая Безье',
        'catmull-rom': 'Catmull-Rom сплайн',
        'b-spline': 'B-сплайн'
    };
    return names[type] || type;
}