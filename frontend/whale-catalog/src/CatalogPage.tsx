import React, { useState, useEffect } from 'react';
import './CatalogPage.css';
import TrackingMap from './TrackingMap';
import { WhaleType, WhaleImage } from './whale.ts';

// Вспомогательные функции (оставлены, т.к. используются для обработки изображений в сетке и ошибок API)
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

const CatalogPage: React.FC = () => {
    // Состояния фильтров
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
    const [error, setError] = useState('');
    const [modalError, setModalError] = useState('');
    const [selectedImage, setSelectedImage] = useState<WhaleImage | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [imageToDeleteId, setImageToDeleteId] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
    const [deleteError, setDeleteError] = useState<string>('');
    const [isFiltersExpanded, setIsFiltersExpanded] = useState<boolean>(true);
    const [editData, setEditData] = useState({
        description: '',
        whale_type_id: '',
        name: '',
        gender: ''
    });

    // Состояние для включения режима построения маршрута
    const [routeEnabled, setRouteEnabled] = useState<boolean>(false);

    const user = localStorage.getItem('whaleUser') ? JSON.parse(localStorage.getItem('whaleUser')!) : null;
    const isScientist = user?.is_scientist || false;
    const token = user?.token;

    // Построение строки запроса для фильтров
    const buildQueryString = () => {
        const params = new URLSearchParams();
        if (filters.whale_type_id) params.append('whale_type_id', filters.whale_type_id);
        if (filters.username) params.append('username', filters.username);
        if (filters.name) params.append('name', filters.name);
        if (filters.gender) params.append('gender', filters.gender);
        params.append('limit', filters.limit.toString());
        return params.toString();
    };

    // Загрузка списка видов китов
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

    // Загрузка изображений
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

    // Сброс фильтров
    const resetFilters = () => {
        setFilters({
            whale_type_id: '',
            username: '',
            limit: 10,
            name: '',
            gender: ''
        });
        setRouteEnabled(false);
        fetchImages(`http://localhost:80/api/v1/public/whale/images?limit=10`);
    };

    // Загрузка начальных данных
    useEffect(() => {
        fetchWhaleTypes();
        fetchImages();
    }, []);

    // Обработчики пагинации
    const handlePagination = (url: string) => {
        fetchImages(url);
    };

    // Обработчики изменения фильтров
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value
        });
    };

    // Отправка формы фильтров
    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchImages();
    };

    // Клик по карточке изображения (для учёных – открыть модалку редактирования)
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

    // Сохранение изменений
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

    // Изменение полей редактирования
    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Клик по кнопке удаления
    const handleDeleteClick = (e: React.MouseEvent, imageId: string) => {
        e.stopPropagation();
        setImageToDeleteId(imageId);
        setDeleteError('');
        setShowDeleteModal(true);
    };

    // Подтверждение удаления
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

    // Отмена удаления
    const handleCancelDelete = () => {
        setShowDeleteModal(false);
        setImageToDeleteId(null);
        setDeleteError('');
    };

    // Обработчик клика по маркеру на карте
    const handleMarkerClick = (image: WhaleImage) => {
        handleImageClick(image);
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
            <br />

            {/* Новый контейнер: фильтры слева, карта справа */}
            <div className="filters-map-layout">
                <div className="filters-sidebar">
                    <form
                        onSubmit={handleFilterSubmit}
                        className={`filters-form-static ${!isFiltersExpanded ? 'collapsed' : ''}`}
                    >
                        <div className="filter-header">
                            <h3>Фильтры поиска</h3>
                            <button
                                type="button"
                                className="filter-toggle-btn-static"
                                onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                                title={isFiltersExpanded ? "Свернуть фильтры" : "Развернуть фильтры"}
                            >
                                {isFiltersExpanded ? '−' : '+'}
                            </button>
                        </div>

                        {isFiltersExpanded && (
                            <>
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

                                <div className="filter-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input
                                            type="checkbox"
                                            checked={routeEnabled}
                                            onChange={(e) => setRouteEnabled(e.target.checked)}
                                            disabled={!filters.name.trim()}
                                        />
                                        <span>Построить маршрут по имени</span>
                                    </label>
                                    {!filters.name.trim() && (
                                        <small className="hint" style={{ color: '#666' }}>
                                            Укажите имя кита для активации
                                        </small>
                                    )}
                                </div>

                                <div className="filter-buttons">
                                    <button type="submit" className="search-btn">
                                        Поиск
                                    </button>
                                    <button type="button" onClick={resetFilters} className="reset-btn">
                                        Сбросить
                                    </button>
                                </div>
                            </>
                        )}
                    </form>
                </div>

                <div className="map-container">
                    <TrackingMap
                        observations={images}
                        trackedWhaleName={filters.name}
                        routeEnabled={routeEnabled}
                        onMarkerClick={handleMarkerClick}
                        isScientist={isScientist}
                        options={{ center: [61, 90], zoom: 3 }}
                    />
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
                                    <option value="">
                                        {whaleTypesLoading ? "Загрузка видов..." : "Не выбран"}
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