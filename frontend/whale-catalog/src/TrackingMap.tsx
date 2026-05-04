import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,
    useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { loadLandData, checkLandIntersection } from './landIntersection.ts';
import { smoothPath } from './smoothing.ts';
import type { SmoothingType } from './types.ts';
import { WhaleImage } from './whale.ts';
import './TrackingMap.css';

// ========== Вспомогательные функции ==========
const processImageUrl = (url: string) => {
    let processedUrl = decodeURIComponent(url).replace(/\\u0026/g, '&').replace(/ /g, '%20');
    if (processedUrl.includes('humpback-whale-minio:9000')) {
        processedUrl = processedUrl.replace(
            'humpback-whale-minio:9000',
            window.location.hostname + ':9000'
        );
    }
    return processedUrl;
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const groupNearbyImages = (images: WhaleImage[], maxDistance: number = 0.5) => {
    const groups: { [key: string]: WhaleImage[] } = {};
    images.forEach(image => {
        if (!image.latitude || !image.longitude) return;
        let addedToGroup = false;
        Object.keys(groups).forEach(groupKey => {
            const [groupLat, groupLon] = groupKey.split(',').map(Number);
            const distance = calculateDistance(image.latitude, image.longitude, groupLat, groupLon);
            if (distance <= maxDistance) {
                groups[groupKey].push(image);
                addedToGroup = true;
            }
        });
        if (!addedToGroup) {
            const key = `${image.latitude},${image.longitude}`;
            groups[key] = [image];
        }
    });
    return groups;
};

// ========== Типы ==========
interface RoutePoint {
    id: string;
    lat: number;
    lng: number;
    name: string;
    type: 'observation' | 'temporary';
    observation?: WhaleImage;
}

interface TrackingMapProps {
    observations: WhaleImage[];
    trackedWhaleName?: string;
    routeEnabled?: boolean;
    onMarkerClick?: (observation: WhaleImage) => void;
    isScientist?: boolean;
    options?: {
        center?: [number, number];
        zoom?: number;
    };
}

// ========== Компонент ==========
const TrackingMap: React.FC<TrackingMapProps> = ({
                                                     observations,
                                                     trackedWhaleName = '',
                                                     routeEnabled = false,
                                                     onMarkerClick,
                                                     isScientist = false,
                                                     options,
                                                 }) => {
    // Состояния
    const [landData, setLandData] = useState<any>(null);
    const [isLandDataLoading, setIsLandDataLoading] = useState(true);
    const [landCheckEnabled, setLandCheckEnabled] = useState(true);
    const [selectedSmoothingType, setSelectedSmoothingType] = useState<SmoothingType>('catmull-rom');
    const [currentSmoothingType, setCurrentSmoothingType] = useState<SmoothingType>('catmull-rom');
    const [showMarkers, setShowMarkers] = useState(true);
    const [showRouteLines, setShowRouteLines] = useState(true);
    const [draggingEnabled, setDraggingEnabled] = useState(false);
    const [addMode, setAddMode] = useState<'start' | 'end' | null>(null);
    const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
    const [isControlsExpanded, setIsControlsExpanded] = useState(true);
    const [routeVersion, setRouteVersion] = useState(0);

    const bumpRouteVersion = useCallback(() => {
        setRouteVersion(prev => prev + 1);
    }, []);

    // Загрузка данных о суше
    useEffect(() => {
        const loadData = async () => {
            setIsLandDataLoading(true);
            const data = await loadLandData();
            setLandData(data);
            setIsLandDataLoading(false);
        };
        loadData();
    }, []);

    // Инициализация маршрута из наблюдений
    useEffect(() => {
        if (!routeEnabled || !trackedWhaleName) {
            setRoutePoints([]);
            return;
        }

        const filtered = observations
            .filter(obs => obs.name && obs.name.toLowerCase() === trackedWhaleName.toLowerCase())
            .sort((a, b) => new Date(a.saw_at).getTime() - new Date(b.saw_at).getTime())
            .filter(p => p.latitude && p.longitude);

        const newPoints: RoutePoint[] = filtered.map((obs, idx) => ({
            id: obs.id,
            lat: obs.latitude,
            lng: obs.longitude,
            name: obs.name || `Наблюдение ${idx + 1}`,
            type: 'observation',
            observation: obs,
        }));
        setRoutePoints(newPoints);
        bumpRouteVersion();
    }, [observations, trackedWhaleName, routeEnabled]);

    // Вычисление линий маршрута (используем currentSmoothingType)
    const routeLines = useMemo(() => {
        if (routePoints.length < 2) return [];

        const points = routePoints.map(p => ({ lat: p.lat, lng: p.lng }));

        // Без сглаживания – отрезки между исходными точками
        if (currentSmoothingType === 'none') {
            const lines: Array<{ positions: L.LatLngExpression[]; color: string; intersectsLand: boolean }> = [];
            for (let i = 0; i < routePoints.length - 1; i++) {
                const p1 = routePoints[i];
                const p2 = routePoints[i + 1];
                const intersects = landCheckEnabled && landData
                    ? checkLandIntersection(
                        { lat: p1.lat, lng: p1.lng },
                        { lat: p2.lat, lng: p2.lng },
                        landData
                    )
                    : false;
                lines.push({
                    positions: [[p1.lat, p1.lng], [p2.lat, p2.lng]],
                    color: intersects ? '#FF0000' : '#0066FF',
                    intersectsLand: intersects,
                });
            }
            return lines;
        }

        // Сглаженный маршрут – разбиваем на отрезки и проверяем каждый
        const smoothedPositions = smoothPath(points, currentSmoothingType, 100);
        const lines: Array<{ positions: L.LatLngExpression[]; color: string; intersectsLand: boolean }> = [];

        for (let i = 0; i < smoothedPositions.length - 1; i++) {
            const p1 = smoothedPositions[i];
            const p2 = smoothedPositions[i + 1];
            const intersects = landCheckEnabled && landData
                ? checkLandIntersection(
                    { lat: p1[0], lng: p1[1] },
                    { lat: p2[0], lng: p2[1] },
                    landData
                )
                : false;
            lines.push({
                positions: [p1, p2],
                color: intersects ? '#FF0000' : '#0066FF',
                intersectsLand: intersects,
            });
        }

        return lines;
    }, [routePoints, currentSmoothingType, landCheckEnabled, landData, routeVersion]);

    // Применить сглаживание
    const applySmoothing = () => {
        setCurrentSmoothingType(selectedSmoothingType);
        bumpRouteVersion(); // форсируем обновление линий
    };

    const resetSmoothing = () => {
        setSelectedSmoothingType('none');
        setCurrentSmoothingType('none');
        bumpRouteVersion();
    };

    // Обработчик клика на карту – добавляет временную точку в начало или конец
    const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
        if (!isScientist) return;
        if (!addMode) return;

        const lat = e.latlng.lat;
        const lng = e.latlng.lng;


        const newPoint: RoutePoint = {
            id: `temp-${Date.now()}-${Math.random()}`,
            lat,
            lng,
            name: `Точка ${routePoints.length + 1}`,
            type: 'temporary',
        };

        if (addMode === 'start') {
            setRoutePoints(prev => [newPoint, ...prev]);
        } else if (addMode === 'end') {
            setRoutePoints(prev => [...prev, newPoint]);
        }
        bumpRouteVersion();
    }, [isScientist, addMode, routePoints.length]);

    // Компонент для обработки кликов
    const MapClickHandler = () => {
        useMapEvents({ click: handleMapClick });
        return null;
    };

    // Удаление временной точки
    const deleteTempPoint = (id: string) => {
        setRoutePoints(prev => prev.filter(p => p.id !== id));
        bumpRouteVersion();
    };

    // Очистка всех временных точек
    const clearAllTempPoints = () => {
        setRoutePoints(prev => prev.filter(p => p.type === 'observation'));
        bumpRouteVersion();
    };

    // Сброс маршрута к исходным наблюдениям
    const resetRoute = () => {
        if (!trackedWhaleName) return;
        const filtered = observations
            .filter(obs => obs.name && obs.name.toLowerCase() === trackedWhaleName.toLowerCase())
            .sort((a, b) => new Date(a.saw_at).getTime() - new Date(b.saw_at).getTime())
            .filter(p => p.latitude && p.longitude);
        const newPoints: RoutePoint[] = filtered.map((obs, idx) => ({
            id: obs.id,
            lat: obs.latitude,
            lng: obs.longitude,
            name: obs.name || `Наблюдение ${idx + 1}`,
            type: 'observation',
            observation: obs,
        }));
        setRoutePoints(newPoints);
        bumpRouteVersion();
    };

    // Обработчик перетаскивания временной точки
    const handlePointDrag = (id: string, e: L.DragEndEvent) => {
        if (!isScientist) return;
        const newLatLng = e.target.getLatLng();
        // Нормализуем координаты
        const lat = newLatLng.lat;
        const lng = newLatLng.lng;
        setRoutePoints(prev => prev.map(p =>
            p.id === id ? { ...p, lat, lng } : p
        ));
        bumpRouteVersion();
    };

    // Создание иконки для временной точки
    const createTempIcon = () => {
        return L.divIcon({
            className: 'temp-marker',
            html: `<div style="
                width: 30px;
                height: 30px;
                background-color: #33CC33;
                border: 2px solid white;
                border-radius: 50%;
                box-shadow: 0 0 5px rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 16px;
            ">+</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
        });
    };

    // Создание иконки для кластерного маркера
    const createClusterIcon = (imageUrl: string, count: number) => {
        const processedUrl = processImageUrl(imageUrl);
        return L.divIcon({
            html: `<div class="marker-cluster">
                <img src="${processedUrl}" alt="Cluster" class="cluster-image"/>
                <div class="cluster-count">${count}</div>
            </div>`,
            className: '',
            iconSize: L.point(40, 40),
        });
    };

    // Все наблюдения для кластеров
    const groupedObservations = useMemo(() => {
        return groupNearbyImages(observations);
    }, [observations]);

    return (
        <div style={{ position: 'relative', height: '100%', width: '100%' }}>
            <MapContainer
                attributionControl={false}
                center={options?.center || [61, 90]}
                zoom={options?.zoom || 3}
                style={{ height: '100%', width: '100%' }}
                className="tracking-map"
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution=""
                />
                <MapClickHandler />

                {/* Кластеризованные маркеры наблюдений */}
                {showMarkers && (
                    <MarkerClusterGroup
                        chunkedLoading
                        maxClusterRadius={50}
                        spiderfyOnMaxZoom={true}
                        showCoverageOnHover={true}
                        zoomToBoundsOnClick={true}
                        iconCreateFunction={(cluster: { getAllChildMarkers: () => any; }) => {
                            const childMarkers = cluster.getAllChildMarkers();
                            let totalImages = 0;
                            childMarkers.forEach((marker: { getPopup: () => { (): any; new(): any; getContent: { (): any; new(): any; }; }; }) => {
                                const popupContent = marker.getPopup()?.getContent();
                                if (typeof popupContent === 'string') {
                                    const tempDiv = document.createElement('div');
                                    tempDiv.innerHTML = popupContent;
                                    const imagesScroll = tempDiv.querySelector('.images-scroll');
                                    if (imagesScroll) {
                                        totalImages += imagesScroll.children.length;
                                    } else {
                                        totalImages += 1;
                                    }
                                } else {
                                    totalImages += 1;
                                }
                            });

                            const firstMarker = childMarkers[0];
                            const iconHtml = (firstMarker.options.icon as L.DivIcon).options.html;
                            const firstImageUrl = typeof iconHtml === 'string'
                                ? iconHtml.match(/src="([^"]+)"/)?.[1] || ''
                                : '';

                            return createClusterIcon(firstImageUrl, totalImages);
                        }}
                    >
                        {Object.entries(groupedObservations).map(([key, group]) => {
                            const [lat, lng] = key.split(',').map(Number);
                            const firstImage = group[0];
                            const icon = createClusterIcon(firstImage.image_url, group.length);
                            return (
                                <Marker
                                    key={key}
                                    position={[lat, lng]}
                                    icon={icon}
                                    eventHandlers={{
                                        click: () => onMarkerClick?.(firstImage)
                                    }}
                                >
                                    <Popup>
                                        <div className="cluster-content">
                                            <div className="images-scroll">
                                                {group.map(image => (
                                                    <div key={image.id} className="image-item">
                                                        <img src={processImageUrl(image.image_url)} alt={image.description} className="popup-image" />
                                                        <div className="image-info">
                                                            {image.name && <p><strong>Имя:</strong> {image.name}</p>}
                                                            {image.whale_type && (
                                                                <p><strong>Вид:</strong> {image.whale_type.species_rus}</p>
                                                            )}
                                                            <p><strong>Дата:</strong> {new Date(image.saw_at).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {group.length > 1 && (
                                                <div className="location-count">{group.length} изображений в этой точке</div>
                                            )}
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MarkerClusterGroup>
                )}

                {/* Только временные точки маршрута */}
                {showMarkers && routeEnabled && routePoints
                    .filter(p => p.type === 'temporary')
                    .map(point => (
                        <Marker
                            key={point.id}
                            position={[point.lat, point.lng]}
                            icon={createTempIcon()}
                            draggable={isScientist && draggingEnabled}
                            eventHandlers={{
                                dragend: (e) => handlePointDrag(point.id, e as L.DragEndEvent),
                            }}
                        >
                            <Popup>
                                <div>
                                    <strong>{point.name}</strong><br />
                                    <p>Временная точка</p>
                                    <p>Координаты: {point.lat.toFixed(5)}, {point.lng.toFixed(5)}</p>
                                    {isScientist && <button onClick={() => deleteTempPoint(point.id)}>Удалить</button>}
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                {/* Линии маршрута */}
                {showRouteLines && routeLines.map((line, idx) => (
                    <Polyline
                        key={`route-${idx}-${routeVersion}`}
                        positions={line.positions}
                        color={line.color}
                        weight={line.intersectsLand ? 4 : 3}
                        opacity={0.8}
                    />
                ))}
            </MapContainer>

            {/* Панель управления */}
            {routeEnabled && (
                <div className="route-controls-panel-absolute">
                    <div
                        className="route-controls-header"
                        onClick={() => setIsControlsExpanded(!isControlsExpanded)}
                    >
                        <span>Управление маршрутом</span>
                        <button className="route-controls-toggle">
                            {isControlsExpanded ? '−' : '+'}
                        </button>
                    </div>
                    {isControlsExpanded && (
                        <div className="route-controls-content">
                            <div className="controls-section">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={showMarkers}
                                        onChange={e => setShowMarkers(e.target.checked)}
                                    /> Показывать маркеры
                                </label>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={showRouteLines}
                                        onChange={e => setShowRouteLines(e.target.checked)}
                                    /> Показывать линии маршрута
                                </label>
                            </div>

                            {isScientist && (
                                <div className="controls-section">
                                    <h5>Добавление точек</h5>
                                    <div className="button-group">
                                        <button
                                            className={addMode === 'start' ? 'btn-primary' : 'btn-secondary'}
                                            onClick={() => setAddMode(addMode === 'start' ? null : 'start')}
                                        >
                                            {addMode === 'start' ? '✓ Добавление в начало активно' : 'Добавлять в начало'}
                                        </button>
                                        <button
                                            className={addMode === 'end' ? 'btn-primary' : 'btn-secondary'}
                                            onClick={() => setAddMode(addMode === 'end' ? null : 'end')}
                                        >
                                            {addMode === 'end' ? '✓ Добавление в конец активно' : 'Добавлять в конец'}
                                        </button>
                                    </div>
                                    {addMode && (
                                        <div className="info-text" style={{ marginTop: '5px' }}>
                                            👆 Кликните на карту, чтобы добавить точку в {addMode === 'start' ? 'начало' : 'конец'} маршрута
                                        </div>
                                    )}

                                    <div className="controls-section" style={{ marginTop: '10px' }}>
                                        <h5>Редактирование</h5>
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={draggingEnabled}
                                                onChange={e => setDraggingEnabled(e.target.checked)}
                                            /> Перетаскивание временных точек
                                        </label>
                                        <div className="button-group">
                                            <button
                                                onClick={clearAllTempPoints}
                                                className="btn-secondary"
                                                disabled={!routePoints.some(p => p.type === 'temporary')}
                                            >
                                                Очистить временные
                                            </button>
                                            <button onClick={resetRoute} className="btn-secondary">
                                                Сбросить маршрут
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="controls-section">
                                <h5>Сглаживание</h5>
                                <select
                                    value={selectedSmoothingType}
                                    onChange={e => setSelectedSmoothingType(e.target.value as SmoothingType)}
                                >
                                    <option value="none">Без сглаживания</option>
                                    <option value="quadratic-bezier">Квадратичная Безье</option>
                                    <option value="cubic-bezier">Кубическая Безье</option>
                                    <option value="catmull-rom">Catmull-Rom</option>
                                    <option value="b-spline">B-сплайн</option>
                                </select>
                                <div className="button-group">
                                    <button onClick={applySmoothing} className="btn-primary">
                                        Применить
                                    </button>
                                    <button onClick={resetSmoothing} className="btn-secondary">
                                        Сбросить
                                    </button>
                                </div>
                            </div>

                            <div className="controls-section">
                                <h5>Проверка суши</h5>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={landCheckEnabled}
                                        onChange={e => setLandCheckEnabled(e.target.checked)}
                                    /> Проверять пересечения
                                </label>
                                {landCheckEnabled && (
                                    <div className="land-check-status">
                                        {isLandDataLoading ? 'Загрузка...' : (
                                            routeLines.some(l => l.intersectsLand)
                                                ? <span className="warning">⚠️ Есть пересечения</span>
                                                : <span className="success">✓ Над водой</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {routePoints.length > 0 && (
                                <div className="controls-section points-list">
                                    <h5>Точки маршрута ({routePoints.length})</h5>
                                    <div className="points-scroll">
                                        {routePoints.map((p, idx) => (
                                            <div key={p.id} className="point-item">
                                                <span>{idx + 1}. {p.name} ({p.type === 'observation' ? 'набл.' : 'врем.'})</span>
                                                {isScientist && p.type === 'temporary' && (
                                                    <button onClick={() => deleteTempPoint(p.id)} className="delete-point-btn">×</button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TrackingMap;