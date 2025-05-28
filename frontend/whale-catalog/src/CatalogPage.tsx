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

const CatalogPage: React.FC = () => {
    const [filters, setFilters] = useState({
        whale_type_id: '',
        username: '',
        limit: 10,
        name: '',
        gender: ''
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
    // State for delete confirmation
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [imageToDeleteId, setImageToDeleteId] = useState<string | null>(null);
    const [trackedImageId, setTrackedImageId] = useState<string | null>(null); // Track which image's filters are active
    const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
    const [deleteError, setDeleteError] = useState<string>('');
    // State for filter panel visibility
    const [isFiltersExpanded, setIsFiltersExpanded] = useState<boolean>(true);
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

    console.log('User:', user);
    console.log('Is Scientist:', isScientist);

    const buildQueryString = () => {
        const params = new URLSearchParams();
        if (filters.whale_type_id) params.append('whale_type_id', filters.whale_type_id);
        if (filters.username) params.append('username', filters.username);
        if (filters.name) params.append('name', filters.name);
        if (filters.gender) params.append('gender', filters.gender);
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
            whale_type_id: '', // Reset whale_type_id
            username: '',
            limit: 10,
            name: '',
            gender: ''
        });
        setTrackedImageId(null); // Clear tracked image on manual reset
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

    // Function to open delete confirmation modal
    const handleDeleteClick = (e: React.MouseEvent, imageId: string) => {
        e.stopPropagation(); // Prevent event bubbling
        setImageToDeleteId(imageId);
        setDeleteError(''); // Clear previous delete errors
        setShowDeleteModal(true);
    };

    // Function to handle confirmed deletion
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

    // Function to cancel deletion
    const handleCancelDelete = () => {
        setShowDeleteModal(false);
        setImageToDeleteId(null);
        setDeleteError(''); // Clear error on cancel
    };

    // Function to handle track button click in map popup
    const handleTrackClick = (image: WhaleImage) => {
        const newFilters = {
            whale_type_id: image.whale_type?.id || '',
            username: '', // Don't include username in tracking
            limit: filters.limit, // Keep current limit
            name: image.name || '',
            gender: image.gender || ''
        };
        setFilters(newFilters);
        setTrackedImageId(image.id); // Set the currently tracked image ID

        // Construct the URL with new filters
        const params = new URLSearchParams();
        if (newFilters.whale_type_id) params.append('whale_type_id', newFilters.whale_type_id);
        if (newFilters.name) params.append('name', newFilters.name);
        if (newFilters.gender) params.append('gender', newFilters.gender);
        params.append('limit', newFilters.limit.toString());

        // Automatically fetch images with the new filters
        fetchImages(`http://localhost:80/api/v1/public/whale/images?${params.toString()}`);
    };

    if (loading && images.length === 0) return (
        <div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Загружаем каталог китов...</div>
        </div>
    );
    // Show loading indicator without replacing content if loading more images
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
                {/* Фильтры - Now absolutely positioned */}
                <form
                    onSubmit={handleFilterSubmit}
                    className={`filters-form ${!isFiltersExpanded ? 'collapsed' : ''}`}
                >
                    {/* Toggle Button */}
                     <button
                        type="button"
                        className="filter-toggle-btn"
                        onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                        title={isFiltersExpanded ? "Свернуть фильтры" : "Развернуть фильтры"}
                    >
                        {isFiltersExpanded ? '−' : '+'}
                    </button>

                    <h3>Фильтры поиска</h3>

                    {/* Whale Type Dropdown Filter */}
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

                    {/* Name Filter */}
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

                    {/* Gender Filter */}
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
                            const firstImage = group[0];

                            // Create custom icon with the first image thumbnail
                            const customIcon = L.divIcon({
                                className: '', // No specific container class needed here
                                html: `<div class="custom-marker-icon"><img src="${processImageUrl(firstImage.image_url)}" alt="Whale"/></div>`,
                                iconSize: [40, 40], // Size of the icon
                                iconAnchor: [20, 40], // Point of the icon corresponding to marker's location (bottom center)
                                popupAnchor: [0, -42] // Point from which the popup should open (adjust slightly for border)
                            });

                            return (
                                <Marker key={key} position={[lat, lng]} icon={customIcon}>
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

                                                            {image.whale_type ? (
                                                                <> {/* Use fragment to group whale type info */}
                                                                    <p><strong>Вид:</strong> {image.whale_type.species_rus || 'N/A'} ({image.whale_type.species_eng || 'N/A'})</p>
                                                                </>
                                                            ) : (
                                                                <p><strong>Вид:</strong> Не определен</p>
                                                            )}

                                                            {image.gender && <p><strong>Пол:</strong> {image.gender === 'муж' ? ' Мужской ♂️' : image.gender === 'жен' ? ' Женский♀️' : image.gender === 'детеныш' ? 'Детеныш 👶' : image.gender}</p>}

                                                            <p><strong>Встреча:</strong> {new Date(image.saw_at).toLocaleDateString()}</p>

                                                            {/* Action Buttons: Track / Cancel */}
                                                            <div className="popup-action-buttons">
                                                                <button
                                                                    className="track-btn"
                                                                    onClick={() => handleTrackClick(image)}
                                                                    disabled={trackedImageId === image.id} // Disable if already tracked
                                                                >
                                                                    Отследить
                                                                </button>
                                                                <button
                                                                    className="cancel-track-btn"
                                                                    onClick={resetFilters} // Reset filters cancels tracking
                                                                    disabled={trackedImageId !== image.id} // Enable only if this image is tracked
                                                                >
                                                                    Отмена
                                                                </button>
                                                            </div>
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
                        {/* Add delete button for scientists */}
                        {isScientist && (
                            <button
                                className="delete-btn"
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent event bubbling
                                    handleDeleteClick(e, image.id);
                                }}
                                title="Удалить изображение"
                                style={{ display: 'flex' }} // Ensure button is displayed
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

            {/* Delete Confirmation Modal */}
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