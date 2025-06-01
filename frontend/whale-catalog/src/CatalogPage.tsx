import React, { useState, useEffect } from 'react';
import './CatalogPage.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface WhaleType {
    id: string;
    species_eng: string;
    species_rus: string;
    family: string;
    genus: string;
    conservation_status: string;
}

interface WhaleImage {
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

const processImageUrl = (url: string) => {
    let processedUrl = decodeURIComponent(url)
        .replace(/\\u0026/g, '&')
        .replace(/ /g, '%20');

    if (processedUrl.includes('humpback-whale-minio:9000')) {
        processedUrl = processedUrl.replace(
            'humpback-whale-minio:9000',
            window.location.hostname + ':9000'
        );
    }

    return processedUrl;
};

const getErrorMessage = (status: number, defaultMessage: string): string => {
    switch (status) {
        case 400:
            return 'Некорректные данные. Пожалуйста, проверьте введенную информацию.';
        case 401:
            return 'Необходима авторизация. Пожалуйста, войдите в систему.';
        case 403:
            return 'У вас нет прав для выполнения этого действия.';
        case 404:
            return 'Запрашиваемый ресурс не найден.';
        case 409:
            return 'Конфликт данных. Пожалуйста, проверьте введенную информацию.';
        case 422:
            return 'Не удалось обработать запрос. Пожалуйста, проверьте данные.';
        case 500:
            return 'Внутренняя ошибка сервера. Пожалуйста, попробуйте позже.';
        case 502:
            return 'Сервер временно недоступен. Пожалуйста, попробуйте позже.';
        case 503:
            return 'Сервис временно недоступен. Пожалуйста, попробуйте позже.';
        case 504:
            return 'Превышено время ожидания ответа от сервера. Пожалуйста, попробуйте позже.';
        default:
            return defaultMessage;
    }
};

interface ClusterClickEvent {
    layer: {
        getBounds: () => L.LatLngBounds;
    };
    target: {
        _map: L.Map;
    };
}

interface CustomMarkerCluster {
    getChildCount: () => number;
    getAllChildMarkers: () => L.Marker[];
}

const CatalogPage: React.FC = () => {
    const [filters, setFilters] = useState({
        whale_type_id: '',
        username: '',
        limit: 8,
        name: '',
        gender: ''
    });
    const [images, setImages] = useState<WhaleImage[]>([]);
    const [whaleTypes, setWhaleTypes] = useState<WhaleType[]>([]);
    const [whaleTypesLoading, setWhaleTypesLoading] = useState<boolean>(true);
    const [whaleTypesError, setWhaleTypesError] = useState<string>('');
    const [pagination, setPagination] = useState<{
        next: string | null;
        prev: string | null
    }>({ next: null, prev: null });
    const [loading, setLoading] = useState(true);
    const [saveLoading, setSaveLoading] = useState(false);
    const [error, setError] = useState('')
    const [modalError, setModalError] = useState('');
    const [selectedImage, setSelectedImage] = useState<WhaleImage | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [imageToDeleteId, setImageToDeleteId] = useState<string | null>(null);
    const [trackedImageId, setTrackedImageId] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
    const [deleteError, setDeleteError] = useState<string>('');
    const [isFiltersExpanded, setIsFiltersExpanded] = useState<boolean>(true);
    const [editData, setEditData] = useState({
        description: '',
        whale_type_id: '',
        name: '',
        gender: ''
    });

    const [clusterZoom, setClusterZoom] = useState<number>(1.5);

    const EXPANDED_ZOOM_LEVEL = 8;

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    const groupNearbyImages = (images: WhaleImage[], maxDistance: number = 0.5) => {
        const groups: { [key: string]: WhaleImage[] } = {};
        
        images.forEach(image => {
            if (!image.latitude || !image.longitude) return;
            
            let addedToGroup = false;
            
            Object.keys(groups).forEach(groupKey => {
                const [groupLat, groupLon] = groupKey.split(',').map(Number);
                const distance = calculateDistance(
                    image.latitude,
                    image.longitude,
                    groupLat,
                    groupLon
                );
                
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

    const user = localStorage.getItem('whaleUser') ? JSON.parse(localStorage.getItem('whaleUser')!) : null;
    const isScientist = user?.is_scientist || false;
    const token = user?.token;

    const buildQueryString = () => {
        const params = new URLSearchParams();
        if (filters.whale_type_id) params.append('whale_type_id', filters.whale_type_id);
        if (filters.username) params.append('username', filters.username);
        if (filters.name) params.append('name', filters.name);
        if (filters.gender) params.append('gender', filters.gender);
        params.append('limit', filters.limit.toString());
        return params.toString();
    };

    const fetchWhaleTypes = async () => {
        setWhaleTypesLoading(true);
        setWhaleTypesError('');
        try {
            const response = await fetch('http://localhost:80/api/v1/public/whale/types');
            if (!response.ok) {
                const errorMessage = getErrorMessage(response.status, 'Не удалось загрузить виды китов');
                throw new Error(errorMessage);
            }
            const responseData = await response.json();
            const data: WhaleType[] = responseData.whale_types;
            setWhaleTypes(data);
        } catch (err: any) {
            console.error("Failed to fetch whale types:", err);
            setError(err.message || "Не удалось загрузить виды китов для фильтров.");
        } finally {
            setWhaleTypesLoading(false);
        }
    };

    const handleImageClick = (image: WhaleImage) => {
        if (isScientist) {
            setSelectedImage(image);
            setEditData({
                description: image.description || '',
                whale_type_id: image.whale_type ? image.whale_type.id : '',
                name: image.name || '',
                gender: image.gender || ''
            });
            setModalError('');
        } else {
            console.log("Только ученые могут редактировать.");
        }
    };

    const handleSave = async () => {
        if (!selectedImage || !token) return;

        setSaveLoading(true);
        setModalError('');

        try {
            const updatePayload = {
                description: editData.description,
                whale_type: editData.whale_type_id,
                name: editData.name,
                gender: editData.gender
            };

            const response = await fetch(
                `http://localhost:80/api/v1/private/whale/update/${selectedImage.id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatePayload)
                }
            );

            if (!response.ok) {
                const errorMessage = getErrorMessage(response.status, 'Не удалось сохранить изменения');
                throw new Error(errorMessage);
            }

            const updatedWhaleType = whaleTypes.find(wt => wt.id === editData.whale_type_id) || null;

            setImages(images.map(img =>
                img.id === selectedImage.id
                    ? {
                        ...img,
                        description: editData.description,
                        whale_type: updatedWhaleType,
                        name: editData.name,
                        gender: editData.gender
                      }
                    : img
            ));
            setSelectedImage(null);
        } catch (err: any) {
            console.error('Ошибка сохранения:', err);
            setModalError(err.message || 'Не удалось сохранить изменения');
        } finally {
            setSaveLoading(false);
        }
    };

    const fetchImages = async (url?: string) => {
        setError('');
        setLoading(true);
        try {
            url = url || `http://localhost:80/api/v1/public/whale/images?${buildQueryString()}`;
            const response = await fetch(url);

            if (!response.ok) {
                const errorMessage = getErrorMessage(response.status, 'Не удалось загрузить изображения');
                throw new Error(errorMessage);
            }

            const data = await response.json();

            const processedImages = data.whale_images.map((img: WhaleImage) => ({
                ...img,
                image_url: processImageUrl(img.image_url),
                whale_type: img.whale_type && img.whale_type.id ? img.whale_type : null
            }));

            setImages(processedImages);
            setPagination({
                next: data.next_page_url,
                prev: data.prev_page_url
            });

        } catch (err: any) {
            setError(err.message || 'Ошибка загрузки изображений');
        } finally {
            setLoading(false);
        }
    };

    const resetFilters = () => {
        setFilters({
            whale_type_id: '',
            username: '',
            limit: 10,
            name: '',
            gender: ''
        });
        setTrackedImageId(null);
        fetchImages(`http://localhost:80/api/v1/public/whale/images?limit=10`);
    };

    useEffect(() => {
        fetchWhaleTypes();
        fetchImages();
    }, []);

    const handlePagination = (url: string) => {
        fetchImages(url);
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value
        });
    };

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchImages();
    };

    const handleDeleteClick = (e: React.MouseEvent, imageId: string) => {
        e.stopPropagation();
        setImageToDeleteId(imageId);
        setDeleteError('');
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!imageToDeleteId || !token) return;

        setDeleteLoading(true);
        setDeleteError('');

        try {
            const response = await fetch(
                `http://localhost:80/api/v1/private/whale/${imageToDeleteId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                }
            );

            if (!response.ok) {
                const errorMessage = getErrorMessage(response.status, 'Не удалось удалить изображение');
                throw new Error(errorMessage);
            }

            setImages(prevImages => prevImages.filter(img => img.id !== imageToDeleteId));
            setShowDeleteModal(false);
            setImageToDeleteId(null);

        } catch (err: any) {
            console.error('Ошибка удаления:', err);
            setDeleteError(err.message || 'Не удалось удалить изображение');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleCancelDelete = () => {
        setShowDeleteModal(false);
        setImageToDeleteId(null);
        setDeleteError('');
    };

    const handleTrackClick = (image: WhaleImage) => {
        const newFilters = {
            whale_type_id: image.whale_type?.id || '',
            username: '',
            limit: filters.limit,
            name: image.name || '',
            gender: image.gender || ''
        };
        setFilters(newFilters);
        setTrackedImageId(image.id);

        const params = new URLSearchParams();
        if (newFilters.whale_type_id) params.append('whale_type_id', newFilters.whale_type_id);
        if (newFilters.name) params.append('name', newFilters.name);
        if (newFilters.gender) params.append('gender', newFilters.gender);
        params.append('limit', newFilters.limit.toString());

        fetchImages(`http://localhost:80/api/v1/public/whale/images?${params.toString()}`);
    };

    if (loading && images.length === 0) return (
        <div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Загружаем каталог китов...</div>
        </div>
    );

    const showLoadingIndicator = (loading && images.length > 0) || saveLoading;

    return (
        <div className="catalog-container">
            {showLoadingIndicator && (
                <div className="loading-indicator">
                    <div className="loading-spinner"></div>
                    <span>{saveLoading ? 'Сохранение...' : 'Загрузка...'}</span>
                </div>
            )}
            {error && (
                <div className="error-banner">
                    ⚠️ {error}
                    <button onClick={() => setError('')}>×</button>
                </div>
            )}

            <h1>Каталог изображений</h1>
            <br></br>

            <div className="filters-map-container">
                <form
                    onSubmit={handleFilterSubmit}
                    className={`filters-form ${!isFiltersExpanded ? 'collapsed' : ''}`}
                >
                    <button
                        type="button"
                        className="filter-toggle-btn"
                        onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                        title={isFiltersExpanded ? "Свернуть фильтры" : "Развернуть фильтры"}
                    >
                        {isFiltersExpanded ? '−' : '+'}
                    </button>

                    <h3>Фильтры поиска</h3>

                    <div className="filter-group">
                        <label>Вид кита:</label>
                        <select
                            name="whale_type_id"
                            value={filters.whale_type_id}
                            onChange={handleFilterChange}
                            className="filter-input"
                            disabled={whaleTypesLoading}
                        >
                            <option value="">Любой вид</option>
                            {!whaleTypesLoading && whaleTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                    {type.species_rus} ({type.species_eng})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Имя кита:</label>
                        <input
                            type="text"
                            name="name"
                            value={filters.name}
                            onChange={handleFilterChange}
                            className="filter-input"
                        />
                    </div>

                    <div className="filter-group">
                        <label>Пол:</label>
                        <select
                            name="gender"
                            value={filters.gender}
                            onChange={handleFilterChange}
                            className="filter-input"
                        >
                            <option value="">Любой</option>
                            <option value="муж">Мужской</option>
                            <option value="жен">Женский</option>
                            <option value="детеныш">Детеныш</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Имя пользователя:</label>
                        <input
                            type="text"
                            name="username"
                            value={filters.username}
                            onChange={handleFilterChange}
                            className="filter-input"
                        />
                    </div>

                    <div className="filter-group">
                        <label>Количество изображений на странице: {filters.limit}</label>
                        <input
                            type="range"
                            min="1"
                            max="30"
                            value={filters.limit}
                            onChange={(e) => setFilters({...filters, limit: Number(e.target.value)})}
                            className="limit-slider"
                        />
                    </div>

                    <div className="filter-buttons">
                        <button type="submit" className="search-btn">
                            Поиск
                        </button>
                        <button type="button" onClick={resetFilters} className="reset-btn">
                            Сбросить
                        </button>
                    </div>
                </form>

                <div className="map-container">
                    <MapContainer
                        center={[61, 90]}
                        zoom={clusterZoom}
                        className="leaflet-map"
                        style={{ border: '2px solid var(--primary-blue)', borderRadius: '8px' }}
                        attributionControl={false}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MarkerClusterGroup
                            chunkedLoading
                            maxClusterRadius={50}
                            spiderfyOnMaxZoom={true}
                            showCoverageOnHover={true}
                            zoomToBoundsOnClick={true}
                            eventHandlers={{
                                clusterclick: (e: ClusterClickEvent) => {
                                    const bounds = e.layer.getBounds();
                                    const center = bounds.getCenter();
                                    setClusterZoom(EXPANDED_ZOOM_LEVEL);
                                    e.target._map.setView(center, EXPANDED_ZOOM_LEVEL);
                                }
                            }}
                            iconCreateFunction={(cluster: CustomMarkerCluster) => {
                                const childMarkers = cluster.getAllChildMarkers();
                                let totalImages = 0;

                                childMarkers.forEach(marker => {
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

                                return L.divIcon({
                                    html: `<div class="marker-cluster">
                                        <img src="${firstImageUrl}" alt="Cluster" class="cluster-image"/>
                                        <div class="cluster-count">${totalImages}</div>
                                    </div>`,
                                    className: '',
                                    iconSize: L.point(40, 40)
                                });
                            }}
                        >
                            {Object.entries(groupNearbyImages(images)).map(([key, group]) => {
                                const [lat, lng] = key.split(',').map(Number);
                                const firstImage = group[0];

                                const customIcon = L.divIcon({
                                    className: '',
                                    html: `<div class="custom-marker-icon">
                                        <img src="${processImageUrl(firstImage.image_url)}" alt="Whale"/>
                                        ${group.length > 1 ? `
                                            <div class="marker-count-badge" title="${group.length} в этой точке">
                                                <span class="marker-count">${group.length}</span>
                                            </div>
                                        ` : ''}
                                    </div>`,
                                    iconSize: [40, 40],
                                    iconAnchor: [20, 40],
                                    popupAnchor: [0, -42]
                                });

                                return (
                                    <Marker 
                                        key={key} 
                                        position={[lat, lng]} 
                                        icon={customIcon}
                                    >
                                        <Popup className="cluster-popup">
                                            <div className="cluster-content">
                                                <div className="images-scroll">
                                                    {group.map((image) => (
                                                        <div key={image.id} className="image-item">
                                                            <img
                                                                src={image.image_url}
                                                                alt={image.description}
                                                                className="popup-image"
                                                            />
                                                            <div className="image-info">
                                                                {image.name && <p><strong>Имя:</strong> {image.name}</p>}
                                                                {image.whale_type && (
                                                                    <p><strong>Вид:</strong> {image.whale_type.species_rus} ({image.whale_type.species_eng})</p>
                                                                )}
                                                                {image.gender && <p><strong>Пол:</strong> {image.gender}</p>}
                                                                <p><strong>Встреча:</strong> {new Date(image.saw_at).toLocaleDateString()}</p>
                                                                <div className="popup-action-buttons">
                                                                    <button
                                                                        className="track-btn"
                                                                        onClick={() => handleTrackClick(image)}
                                                                        disabled={trackedImageId === image.id}
                                                                    >
                                                                        Отследить
                                                                    </button>
                                                                    <button
                                                                        className="cancel-track-btn"
                                                                        onClick={resetFilters}
                                                                        disabled={trackedImageId !== image.id}
                                                                    >
                                                                        Отмена
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                {group.length > 1 && (
                                                    <div className="location-count">
                                                        {group.length} изображений в этой точке
                                                    </div>
                                                )}
                                            </div>
                                        </Popup>
                                    </Marker>
                                );
                            })}
                        </MarkerClusterGroup>
                    </MapContainer>
                </div>
            </div>

            <div className="image-grid">
                {images.map((image) => (
                    <div
                        key={image.id}
                        className={`${isScientist ? 'editable image-card' : 'image-card'}`}
                        onClick={() => handleImageClick(image)}
                    >
                        {isScientist && (
                            <button
                                className="delete-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(e, image.id);
                                }}
                                title="Удалить изображение"
                                style={{ display: 'flex' }}
                            >
                                ×
                            </button>
                        )}
                        <img
                            src={image.image_url}
                            alt={image.description || "Whale image"}
                            className="whale-image"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'assets/placeholder-image.webp';
                            }}
                        />
                        <div className="image-meta">
                            <h2 className="whale-name">{image.name || "Без имени"}</h2>

                            <div className="taxonomy-box">
                                {image.whale_type ? (
                                    <>
                                        {image.whale_type.family && <p><strong>Семейство:</strong> {image.whale_type.family}</p>}
                                        {image.whale_type.genus && <p><strong>Род:</strong> {image.whale_type.genus}</p>}
                                        {image.whale_type.species_eng && <p><strong>Вид (Lat):</strong> {image.whale_type.species_eng}</p>}
                                        {image.whale_type.species_rus && <p><strong>Вид (Rus):</strong> {image.whale_type.species_rus}</p>}
                                        {image.whale_type.conservation_status && <p><strong>Статус:</strong> {image.whale_type.conservation_status}</p>}
                                    </>
                                ) : (
                                    <p><strong>Вид:</strong> Вид не определен</p>
                                )}
                            </div>

                            {image.gender && (
                                <p className="whale-gender">
                                    <strong>Пол:</strong>
                                    {image.gender === 'муж' ? ' Мужской ♂️' :
                                     image.gender === 'жен' ? ' Женский♀️' :
                                     image.gender === 'детеныш' ? ' 👶 Детеныш' : ` ${image.gender}`}
                                </p>
                            )}

                            <p className="descr"><strong>Описание:</strong> {image.description || "Без описания"}</p>

                            <div className="meta-info">
                                <div className="user-info">
                                    <span className="author">👤 {image.username}</span>
                                    <span className="date">
                    🗓 {new Date(image.saw_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                  </span>
                                </div>

                                {(image.latitude || image.longitude) && (
                                    <div className="coordinates">
                                        📍 Координаты: {image.latitude?.toFixed(4)}, {image.longitude?.toFixed(4)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {selectedImage && (
                <div className="edit-modal">
                    <div className="edit-modal-content">
                        <h2>Редактирование наблюдения</h2>

                        <img
                            src={selectedImage.image_url}
                            alt={selectedImage.description}
                            className="modal-image"
                        />

                        <div className="edit-form">
                            <label>
                                Описание:
                                <textarea
                                    value={editData.description}
                                    onChange={handleEditChange}
                                    name="description"
                                />
                            </label>

                            <label>
                                Имя:
                                <input
                                    type="text"
                                    value={editData.name}
                                    onChange={handleEditChange}
                                    name="name"
                                />
                            </label>

                            <label>
                                Пол:
                                <select
                                    name="gender"
                                    value={editData.gender}
                                    onChange={handleEditChange}
                                >
                                    <option value="" disabled>Выберите пол</option>
                                    <option value="муж">Мужской</option>
                                    <option value="жен">Женский</option>
                                    <option value="детеныш">Детеныш</option>
                                </select>
                            </label>

                            <label>
                                Вид кита:
                                <select
                                    name="whale_type_id"
                                    value={editData.whale_type_id}
                                    onChange={handleEditChange}
                                    disabled={whaleTypesLoading}
                                >
                                    <option value="" disabled>
                                        {whaleTypesLoading ? "Загрузка видов..." : "Выберите вид"}
                                    </option>
                                    {!whaleTypesLoading && whaleTypes.map((type) => (
                                        <option key={type.id} value={type.id}>
                                            {type.species_rus} ({type.species_eng})
                                        </option>
                                    ))}
                                </select>
                                {whaleTypesError && <div className="error-message modal-error" style={{fontSize: '0.8em', padding: '0.5rem'}}>{whaleTypesError}</div>}
                            </label>

                            {modalError && (
                                <div className="error-message modal-error">
                                    {modalError}
                                    <button onClick={() => setModalError('')}>×</button>
                                </div>
                            )}

                            <div className="modal-buttons">
                                <button onClick={handleSave} disabled={saveLoading}>
                                    {saveLoading ? 'Сохранение...' : 'Сохранить'}
                                </button>
                                <button onClick={() => setSelectedImage(null)} disabled={saveLoading}>
                                    Отменить
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="confirmation-modal1">
                    <div className="confirmation-modal-content1">
                        <h2>Подтверждение удаления</h2>
                        <p>Вы уверены, что хотите удалить это изображение? Это действие необратимо.</p>

                        {deleteError && (
                             <div className="error-message modal-error">
                               {deleteError}
                               <button onClick={() => setDeleteError('')}>×</button>
                             </div>
                         )}

                        <div className="modal-buttons">
                            <button
                                onClick={handleConfirmDelete}
                                disabled={deleteLoading}
                                className="confirm-delete-btn"
                            >
                                {deleteLoading ? 'Удаление...' : 'Удалить'}
                            </button>
                            <button onClick={handleCancelDelete} disabled={deleteLoading}>
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="pagination">
                {pagination.prev && (
                    <button
                        onClick={() => handlePagination(pagination.prev!)}
                        className="pagination-btn"
                    >
                        ← Назад
                    </button>
                )}

                {pagination.next && (
                    <button
                        onClick={() => handlePagination(pagination.next!)}
                        className="pagination-btn"
                    >
                        Вперёд →
                    </button>
                )}
            </div>
        </div>
    );
};

export default CatalogPage;