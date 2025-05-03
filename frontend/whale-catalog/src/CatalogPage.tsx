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

interface WhaleType {
    id: string; // Assuming uuid.UUID maps to string in JSON
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
    whale_type: WhaleType | null; // Can be null if not set
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

    // console.log(processedUrl)

    return processedUrl;
};

const CatalogPage: React.FC = () => {
    const [filters, setFilters] = useState({
        whale_type_id: '',
        username: '',
        limit: 10
    });
    const [images, setImages] = useState<WhaleImage[]>([]);
    const [whaleTypes, setWhaleTypes] = useState<WhaleType[]>([]); // State for whale types
    const [whaleTypesLoading, setWhaleTypesLoading] = useState<boolean>(true); // Loading state for types
    const [whaleTypesError, setWhaleTypesError] = useState<string>(''); // Error state for types
    const [pagination, setPagination] = useState<{
        next: string | null;
        prev: string | null
    }>({ next: null, prev: null });
    const [loading, setLoading] = useState(true);
    const [saveLoading, setSaveLoading] = useState(false); // Loading state for save operation
    const [error, setError] = useState('')
    const [modalError, setModalError] = useState(''); // Separate error state for the modal
    const [selectedImage, setSelectedImage] = useState<WhaleImage | null>(null);
    // Update editData state to include name and gender
    const [editData, setEditData] = useState({
        description: '',
        whale_type_id: '',
        name: '',
        gender: ''
    });

// Проверка прав пользователя
    const user = localStorage.getItem('whaleUser') ? JSON.parse(localStorage.getItem('whaleUser')!) : null;
    const isScientist = user?.is_scientist || false;
    const token = user?.token;

    const buildQueryString = () => {
        const params = new URLSearchParams();
        if (filters.whale_type_id) params.append('whale_type_id', filters.whale_type_id);
        if (filters.username) params.append('username', filters.username);
        params.append('limit', filters.limit.toString());
        return params.toString();
    };

    // Fetch whale types when component mounts
    const fetchWhaleTypes = async () => {
        setWhaleTypesLoading(true);
        setWhaleTypesError('');
        try {
            const response = await fetch('http://localhost:80/api/v1/public/whale/types');
            if (!response.ok) {
                 const errorText = await response.text();
                 try {
                    const errorJson = JSON.parse(errorText);
                    throw new Error(errorJson.message || `HTTP error! status: ${response.status}`);
                 } catch(e) {
                     throw new Error(errorText || `HTTP error! status: ${response.status}`);
                 }
            }
            const responseData = await response.json();
            const data: WhaleType[] = responseData.whale_types;
            setWhaleTypes(data);
        } catch (err: any) {
            console.error("Failed to fetch whale types:", err);
            // Use the main error state for catalog-level errors
            setError(err.message || "Не удалось загрузить виды китов для фильтров.");
        } finally {
            setWhaleTypesLoading(false);
        }
    };


    const handleImageClick = (image: WhaleImage) => {
        // Allow editing only if user is a scientist
        if (isScientist) {
            setSelectedImage(image);
            // Set initial editData including new fields
            setEditData({
                description: image.description || '',
                whale_type_id: image.whale_type ? image.whale_type.id : '', // Use the ID
                name: image.name || '',
                gender: image.gender || ''
            });
            setModalError(''); // Clear previous modal errors
        } else {
            // Optional: Show a message or do nothing if not a scientist
            console.log("Только ученые могут редактировать.");
        }
    };

// Обработчик сохранения изменений
    const handleSave = async () => {
        if (!selectedImage || !token) return;

        setSaveLoading(true);
        setModalError(''); // Clear previous errors

        try {
            // Construct the update payload with all editable fields
            const updatePayload = {
                description: editData.description,
                whale_type: editData.whale_type_id, // Send ID as whale_type
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
                const errorText = await response.text();
                let errorMessage = `Ошибка сохранения: ${response.status}`;
                try {
                  const errorJson = JSON.parse(errorText);
                  errorMessage = errorJson.message || errorText || errorMessage;
                } catch(e) {
                  errorMessage = errorText || errorMessage;
                }
                throw new Error(errorMessage);
            }

             // Find the updated whale type object from the state for optimistic update
            const updatedWhaleType = whaleTypes.find(wt => wt.id === editData.whale_type_id) || null;

            // Update the image in the state optimistically
            setImages(images.map(img =>
                img.id === selectedImage.id
                    ? {
                        ...img,
                        description: editData.description,
                        whale_type: updatedWhaleType, // Update with the full object or null
                        name: editData.name,
                        gender: editData.gender
                      }
                    : img
            ));
            setSelectedImage(null); // Close modal on success
        } catch (err: any) {
            console.error('Ошибка сохранения:', err);
            setModalError(err.message || 'Не удалось сохранить изменения');
        } finally {
            setSaveLoading(false);
        }
    };

    const fetchImages = async (url?: string) => {
        setError(''); // Clear previous page-level errors
        setLoading(true);
        try {
            url = url || `http://localhost:80/api/v1/public/whale/images?${buildQueryString()}`;
            const response = await fetch(url);

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                  const errorJson = JSON.parse(errorText);
                  errorMessage = errorJson.message || errorText || errorMessage;
                } catch(e) {
                  errorMessage = errorText || errorMessage;
                }
                 throw new Error(errorMessage);
            }

            const data = await response.json();

            // Декодируем URL параметры для изображений
            const processedImages = data.whale_images.map((img: WhaleImage) => ({
                ...img,
                image_url: processImageUrl(img.image_url),
                // Ensure whale_type is null if backend sends empty object or similar
                whale_type: img.whale_type && img.whale_type.id ? img.whale_type : null
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
            whale_type_id: '', // Reset whale_type_id
            username: '',
            limit: 10
        });
        // Need to manually trigger fetch after resetting state
        // buildQueryString will use the new (empty) filters
        fetchImages(`http://localhost:80/api/v1/public/whale/images?limit=10`);
    };

    useEffect(() => {
        fetchWhaleTypes(); // Fetch types first
        fetchImages();     // Then fetch initial images
    }, []); // Fetch on initial mount

    const handlePagination = (url: string) => {
        fetchImages(url);
    };

    // Handle changes in edit form fields
    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditData(prev => ({
            ...prev,
            [name]: value
        }));
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

    if (loading && images.length === 0) return <div className="loading">Загружаем изображения китов...</div>;
    // Show loading indicator without replacing content if loading more images
    const showLoadingIndicator = (loading && images.length > 0) || saveLoading;

    return (
        <div className="catalog-container">
            {showLoadingIndicator && <div className="loading-indicator">{saveLoading ? 'Сохранение...' : 'Загрузка...'}</div>}
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
                        <label>ID Типа кита:</label>
                        <input
                            type="text"
                            name="whale_type_id"
                            value={filters.whale_type_id}
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
                                                            {/* Display whale_type_eng or rus in map popup */}
                                                            {image.whale_type && (image.whale_type.species_eng || image.whale_type.species_rus) ? (
                                                                <div>Тип: {image.whale_type.species_eng || image.whale_type.species_rus}</div>
                                                            ) : (
                                                                <div>Тип: Не определен</div>
                                                            )}
                                                            <div>Автор: {image.username}</div>
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
                        key={image.id}
                        className={`${isScientist ? 'editable image-card' : 'image-card'}`}
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
                            {/* Display name if available as title */}
                            {image.name && <h2 className="whale-name">{image.name}</h2>}

                            {/* Taxonomy Box */}
                            {image.whale_type && (
                                <div className="taxonomy-box">
                                    {image.whale_type.family && <p><strong>Семейство:</strong> {image.whale_type.family}</p>}
                                    {image.whale_type.genus && <p><strong>Род:</strong> {image.whale_type.genus}</p>}
                                    {image.whale_type.species_eng && <p><strong>Вид (Lat):</strong> {image.whale_type.species_eng}</p>}
                                    {image.whale_type.species_rus && <p><strong>Вид (Rus):</strong> {image.whale_type.species_rus}</p>}
                                    {image.whale_type.conservation_status && <p><strong>Статус:</strong> {image.whale_type.conservation_status}</p>}
                                </div>
                            )}

                            {/* Display gender with emoji */}
                            {image.gender && (
                                <p className="whale-gender">
                                    <strong>Пол:</strong>
                                    {image.gender === 'муж' ? ' Мужской ♂️' :
                                     image.gender === 'жен' ? ' Женский♀️' :
                                     image.gender === 'детеныш' ? ' 👶 Детеныш' : ` ${image.gender}`}
                                </p>
                            )}

                            {/* Display Description */}
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