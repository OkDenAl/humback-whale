import React, { useState, useEffect } from 'react';
import './CatalogPage.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Фикс для иконок маркеров
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface WhaleImage {
    id: string;
    author_id: string;
    username: string;
    created_at: string;
    saw_at: string;
    longitude: number;
    latitude: number;
    description: string;
    whale_type: string;
    image_url: string;
    can_edit?: boolean;
}

interface GroupedImages {
    [key: string]: WhaleImage[];
}

const groupImagesByLocation = (images: WhaleImage[]): GroupedImages => {
    return images.reduce((acc, image) => {
        if (image.latitude && image.longitude) {
            // Округляем координаты до 4 знаков для группировки
            const key = `${image.latitude.toFixed(4)},${image.longitude.toFixed(4)}`;
            if (!acc[key]) acc[key] = [];
            acc[key].push(image);
        }
        return acc;
    }, {} as GroupedImages);
};

const processImageUrl = (url: string) => {
    // Декодируем URL и заменяем экранированные символы
    let processedUrl = decodeURIComponent(url)
        .replace(/\\u0026/g, '&')
        .replace(/ /g, '%20');

    // Если используется внутренний адрес Minio, заменяем на прокси
    if (processedUrl.includes('humpback-whale-minio:9000')) {
        processedUrl = processedUrl.replace(
            'humpback-whale-minio:9000',
            window.location.hostname + ':9000'
        );
    }

    console.log(processedUrl)

    return processedUrl;
};

const CatalogPage: React.FC = () => {
    const [filters, setFilters] = useState({
        whale_type: '',
        username: '',
        limit: 10
    });
    const [images, setImages] = useState<WhaleImage[]>([]);
    const [pagination, setPagination] = useState<{
        next: string | null;
        prev: string | null
    }>({ next: null, prev: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('')
    const [selectedImage, setSelectedImage] = useState<WhaleImage | null>(null);
    const [editData, setEditData] = useState({ description: '', whale_type: '' });

// Проверка прав пользователя
    const isScientist = localStorage.getItem('whaleUser')
        ? JSON.parse(localStorage.getItem('whaleUser')!).is_scientist
        : false;

    const buildQueryString = () => {
        const params = new URLSearchParams();
        if (filters.whale_type) params.append('whale_type', filters.whale_type);
        if (filters.username) params.append('username', filters.username);
        params.append('limit', filters.limit.toString());
        return params.toString();
    };

    const handleImageClick = (image: WhaleImage) => {
        console.log(isScientist)
        if (isScientist) {
            setSelectedImage(image);
            setEditData({
                description: image.description,
                whale_type: image.whale_type
            });
        }
    };

// Обработчик сохранения изменений
    const handleSave = async () => {
        if (!selectedImage) return;

        try {
            const response = await fetch(
                `http://localhost:80/api/v1/private/whale/update/${selectedImage.id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${JSON.parse(localStorage.getItem('whaleUser')!).token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(editData)
                }
            );

            if (!response.ok) throw new Error('Ошибка сохранения');

            // Обновляем данные в состоянии
            setImages(images.map(img =>
                img.id === selectedImage.id
                    ? { ...img, ...editData }
                    : img
            ));
            setSelectedImage(null);
        } catch (err) {
            console.error('Ошибка:', err);
            alert('Не удалось сохранить изменения');
        }
    };

    const fetchImages = async (url?: string) => {
        try {
            setLoading(true);
            url = url || `http://localhost:80/api/v1/public/whale/images?${buildQueryString()}`;
            const response = await fetch(url);

            if (!response.ok) {
                switch (response.status) {
                    case 400:
                        throw new Error('Invalid request parameters');
                    case 404:
                        throw new Error('Resource not found');
                    case 500:
                        throw new Error('Internal server error');
                    default:
                        throw new Error(`HTTP error! status: ${response.status}`);
                }
            }


            const data = await response.json();

            // Декодируем URL параметры для изображений
            const processedImages = data.whale_images.map((img: WhaleImage) => ({
                ...img,
                image_url: processImageUrl(img.image_url)
            }));

            setImages(processedImages);
            setPagination({
                next: data.next_page_url,
                prev: data.prev_page_url
            });

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error loading images');
        } finally {
            setLoading(false);
        }
    };

    const resetFilters = () => {
        setFilters({
            whale_type: '',
            username: '',
            limit: 10
        });
        fetchImages(); // Вызываем обновление данных
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const handlePagination = (url: string) => {
        fetchImages(url);
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value
        });
    };

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchImages();
    };

    if (loading) return <div className="loading">Загружаем изображения китов...</div>;

    return (
        <div className="catalog-container">
            {error && (
                <div className="error-banner">
                    ⚠️ {error}
                    <button onClick={() => setError('')}>×</button>
                </div>
            )}

            <h1>Каталог горбатых китов</h1>
            <br></br>

            <div className="filters-map-container">
                {/* Фильтры */}
                <form onSubmit={handleFilterSubmit} className="filters-form">
                    <div className="filter-group">
                        <label>Тип кита:</label>
                        <input
                            type="text"
                            name="whale_type"
                            value={filters.whale_type}
                            onChange={handleFilterChange}
                            className="filter-input"
                        />
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
                        <label>Колиечество изображений на странице: {filters.limit}</label>
                        <input
                            type="range"
                            min="1"
                            max="50"
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

                {/* Карта */}
                <div className="map-container">
                    <MapContainer
                        center={[61, 90]}
                        zoom={1.5}
                        className="leaflet-map"
                        style={{ border: '2px solid var(--primary-blue)', borderRadius: '8px' }}
                        attributionControl={false}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {Object.entries(groupImagesByLocation(images)).map(([key, group]) => {
                            const [lat, lng] = key.split(',').map(Number);
                            return (
                                <Marker key={key} position={[lat, lng]}>
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
                                                            {image.whale_type && <div>Type: {image.whale_type}</div>}
                                                            <div>By: {image.username}</div>
                                                            <div>{new Date(image.saw_at).toLocaleDateString()}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {group.length > 1 && (
                                                <div className="cluster-count">
                                                    {group.length} изображений в этом районе
                                                </div>
                                            )}
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                </div>
            </div>

            <div className="image-grid">
                {images.map((image) => (
                    <div
                        className={`${isScientist ? 'editable' : 'image-card'}`}
                        onClick={() => handleImageClick(image)}
                    >
                        <img
                            src={image.image_url}
                            alt={image.description || "Whale image"}
                            className="whale-image"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'assets/placeholder-image.webp';
                            }}
                        />
                        <div className="image-meta">
                            <h3>{image.whale_type || "Неизвестный тип кита"}</h3>
                            <p className="descr">{image.description || "Без описания"}</p>

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
                                Тип кита:
                                <input
                                    type="text"
                                    value={editData.whale_type}
                                    onChange={(e) => setEditData({...editData, whale_type: e.target.value})}
                                />
                            </label>

                            <label>
                                Описание:
                                <textarea
                                    value={editData.description}
                                    onChange={(e) => setEditData({...editData, description: e.target.value})}
                                />
                            </label>

                            <div className="modal-buttons">
                                <button onClick={handleSave}>Сохранить</button>
                                <button onClick={() => setSelectedImage(null)}>Отменить</button>
                            </div>
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