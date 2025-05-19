import React, { useState, useEffect } from 'react';
import './App.css';
import AppIcon from './assets/whale.jpg'; // Импорт иконки
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import CatalogPage from './CatalogPage';
import AdminPanelPage from './AdminPanelPage'; // Добавляем импорт новой страницы
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet'

// Фикс для иконок маркеров
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapClickHandler = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
    useMapEvents({
        click: (e) => {
            onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

// Добавим иконку меню для мобильной версии
import { FaSignInAlt, FaUserPlus, FaEnvelope } from 'react-icons/fa';

interface User {
    author_id: string;
    token: string;
    username: string;
    is_scientist: boolean; // Добавляем опциональное поле
}

// Define the WhaleType interface based on backend structure
interface WhaleType {
	id: string; // Assuming uuid.UUID maps to string in JSON
	species_eng: string;
	species_rus: string;
	family: string;
	genus: string;
	conservation_status: string;
}

interface FormData {
    image: File | null;
    preview: string | null;
    latitude: string;
    longitude: string;
    saw_at: string; // Новое поле
    description: string; // Added description field
    name: string; // Added name field (for scientists)
    gender: string; // Added gender field (for scientists)
    whale_type_id: string; // Added whale type ID field (for scientists)
}

interface AuthModalProps {
    authType: 'login' | 'register';
    setAuthType: (type: 'login' | 'register') => void;
    onClose: () => void;
    onAuth: (credentials: {
        email: string;
        password: string;
        username: string;
        isScientist: boolean;
        degree: string;
        rank: string;
        placeOfWork: string;
    }) => void;
    loading: boolean;
    error: string;
}

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
            return 'Пользователь с таким email или именем пользователя уже существует.';
        case 422:
            return 'Не удалось распознать горбатого кита на фотографии.';
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

const App: React.FC = () => {
    const [showAuthWarning, setShowAuthWarning] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authType, setAuthType] = useState<'login' | 'register'>('login');
    const [formData, setFormData] = useState<FormData>({
        image: null,
        preview: null,
        latitude: '',
        longitude: '',
        saw_at: '',
        description: '',
        name: '',
        gender: '',
        whale_type_id: '' // Initialize whale type ID
    });
    const [whaleTypes, setWhaleTypes] = useState<WhaleType[]>([]);
    const [whaleTypesLoading, setWhaleTypesLoading] = useState<boolean>(true);
    const [whaleTypesError, setWhaleTypesError] = useState<string>('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isUploadSuccess, setIsUploadSuccess] = useState(false);

    useEffect(() => {
        const savedUser = localStorage.getItem('whaleUser');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }

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
                setWhaleTypesError(err.message || "Не удалось загрузить виды китов.");
            } finally {
                setWhaleTypesLoading(false);
            }
        };

        fetchWhaleTypes();

    }, []);

    const handleAuth = async (credentials: {
        email: string;
        password: string;
        username: string;
        isScientist: boolean;
        degree: string;
        rank: string;
        placeOfWork: string;
    }) => {
        try {
            setLoading(true);
            setError('');
            const endpoint = authType === 'login' ? 'login' : 'register';
            const role = credentials.isScientist ? 'scientist' : 'user';

            let requestBody: any = {
                email: credentials.email,
                password: credentials.password,
            };

            if (authType === 'register') {
                requestBody = {
                    ...requestBody,
                    username: credentials.username,
                    role: role,
                    ...(credentials.isScientist && {
                        degree: credentials.degree,
                        rank: credentials.rank,
                        place_of_work: credentials.placeOfWork,
                    })
                };
            }

            const response = await fetch(`http://localhost:80/api/v1/public/auth/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorMessage = getErrorMessage(response.status, 'Ошибка авторизации');
                throw new Error(errorMessage);
            }

            const data = JSON.parse(await response.text()) as User;
            localStorage.setItem('whaleUser', JSON.stringify(data));
            setUser(data);
            setShowAuthModal(false);
        } catch (err: any) {
            setError(err.message || 'Произошла ошибка при авторизации');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user) {
            e.preventDefault();
            setShowAuthWarning(true);
            setTimeout(() => {
                setShowAuthWarning(false);
                setShowAuthModal(true);
            }, 1000);
            return;
        }

        const file = e.target.files?.[0];
        if (file) {
            setIsPreviewLoading(true);
            setTimeout(() => { // Имитация загрузки для демонстрации
                setFormData({
                    ...formData,
                    image: file,
                    preview: URL.createObjectURL(file)
                });
                setIsPreviewLoading(false);
            }, 1000);
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return setShowAuthModal(true);

        try {
            setIsLoading(true);
            const formPayload = new FormData();
            formData.image && formPayload.append('image', formData.image);
            formData.latitude && formPayload.append('latitude', formData.latitude);
            formData.longitude && formPayload.append('longitude', formData.longitude);
            formData.saw_at && formPayload.append('saw_at', formData.saw_at);
            formData.description && formPayload.append('description', formData.description);

            if (user && user.is_scientist) {
                formData.name && formPayload.append('name', formData.name);
                formData.gender && formPayload.append('gender', formData.gender);
                formData.whale_type_id && formPayload.append('whale_type_id', formData.whale_type_id);
            }

            const response = await fetch(
                `http://localhost:80/api/v1/private/whale/upload`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${user.token}`
                    },
                    body: formPayload
                }
            );

            if (!response.ok) {
                const errorMessage = getErrorMessage(response.status, 'Не удалось загрузить изображение');
                throw new Error(errorMessage);
            }

            setIsUploadSuccess(true);
            setFormData({
                image: null,
                preview: null,
                latitude: '',
                longitude: '',
                saw_at: '',
                description: '',
                name: '',
                gender: '',
                whale_type_id: ''
            });
            setError('');
        } catch (err: any) {
            setError(err.message || 'Произошла ошибка при загрузке изображения');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('whaleUser');
        setUser(null);
    };

    return (
        <Router>
        <div className="App">
            <header className="app-bar">
                <div className="app-bar-content">
                    <img src={AppIcon} alt="Whale Icon" className="app-icon"/>
                    <Link to="/" className="link">
                       Главная
                    </Link>
                    <Link to="/catalog" className="link">
                        Каталог
                    </Link>
                    {user && user.is_scientist && (
                        <Link to="/admin-panel" className="link">
                            Панель управления
                        </Link>
                    )}
                    <nav className="nav-links">
                        {!user ? (
                            <>
                                <button
                                    className="auth-btn"
                                    onClick={() => {
                                        setAuthType('login');
                                        setShowAuthModal(true);
                                    }}
                                >
                                    <FaSignInAlt/>
                                    <span>Войти</span>
                                </button>
                                <button
                                    className="auth-btn primary"
                                    onClick={() => {
                                        setAuthType('register');
                                        setShowAuthModal(true);
                                    }}
                                >
                                    <FaUserPlus/>
                                    <span>Зарегистрироваться</span>
                                </button>
                            </>
                        ) : (
                            <div className="user-panel">
                                <span className="username-display">{user.username}</span>
                                <button
                                    className="auth-btn"
                                    onClick={handleLogout}
                                >
                                    Выйти
                                </button>
                            </div>
                        )}
                    </nav>
                </div>
            </header>

            <main className="main-content">
            <Routes>
                    <Route path="/" element={
                        <>
                            <div className="hero-section">
                                <h1>Исследуйте морских гигантов</h1>
                                <p className="hero-text">
                                    Присоединяйтесь к нашему сообществу, чтобы отслеживать наблюдения за китами и
                                    вносить
                                    свой вклад в усилия по сохранению морской среды.
                                </p>
                            </div>

                            <div className="upload-card">
                                <h1 className="header-card-main">Форма отправки изображения</h1>
                                <br></br>
                                {isUploadSuccess ? (
                                    <div className="success-message">
                                        <div className="success-icon">✓</div>
                                        <h3>Изображение успешно загружено</h3>
                                        <button
                                            className="upload-another-btn"
                                            onClick={() => {
                                                setFormData({...formData, image: null, preview: null});
                                                setIsUploadSuccess(false);
                                            }}
                                        >
                                            Загрузить ещё
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="upload-form">
                                        <div className="preview-container">
                                            {isPreviewLoading ? (
                                                <div className="loading-spinner"/>
                                            ) : formData.preview ? (
                                                <img src={formData.preview} className="preview-image"/>
                                            ) : (
                                                <div className="upload-placeholder">
                                                    <span>Ни одного изображения не выбрано </span>
                                                </div>
                                            )}
                                        </div>

                                        <label className="file-upload-label">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                required
                                            />
                                            <div className="upload-area">
                                                <h3>{formData.preview ? 'Изменить изображение' : 'Загрузить изображение'}</h3>
                                            </div>
                                        </label>

                                        <div className="coordinates-grid">
                                            <div className="input-group">
                                                <label>Широта</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    placeholder="e.g. 34.0522"
                                                    value={formData.latitude}
                                                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label>Долгота</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    placeholder="e.g. -118.2437"
                                                    value={formData.longitude}
                                                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="map-container full-width-map">
                                            <MapContainer
                                                center={[61, 90]}
                                                zoom={1.5}
                                                className="selection-map"
                                                attributionControl={false}
                                            >
                                                <TileLayer
                                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                />
                                                <MapClickHandler
                                                    onMapClick={(lat, lng) => {
                                                        setFormData({ ...formData, latitude: lat.toFixed(6), longitude: lng.toFixed(6) });
                                                    }}
                                                />
                                                {formData.latitude && formData.longitude && (
                                                    <Marker position={[ parseFloat(formData.latitude), parseFloat(formData.longitude) ]} />
                                                )}
                                            </MapContainer>
                                        </div>

                                        <div className="date-input-container">
                                            <label className="date-label">
                                                Выберите дату встречи:
                                                <input
                                                    type="date"
                                                    value={formData.saw_at}
                                                    onChange={(e) => setFormData({ ...formData, saw_at: e.target.value })}
                                                    max={new Date().toISOString().split('T')[0]}
                                                    className="date-input"
                                                />
                                            </label>
                                        </div>

                                        <div className="input-group description-group">
                                            <label>Описание</label>
                                            <textarea
                                                placeholder="Добавьте описание к вашей фотографии..."
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="description-textarea"
                                            />
                                        </div>

                                        {(user && user.is_scientist) && (
                                            <div className="scientist-fields">
                                                <div className="input-group">
                                                    <label>Имя</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Имя кита"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    />
                                                </div>
                                                <div className="input-group">
                                                    <label>Пол </label>
                                                    <select
                                                        name="gender"
                                                        value={formData.gender}
                                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                                    >
                                                        <option value="" disabled>Выберите пол</option>
                                                        <option value="муж">Мужской</option>
                                                        <option value="жен">Женский</option>
                                                        <option value="детеныш">Детеныш</option>
                                                    </select>
                                                </div>
                                                {/* New Whale Type Selection Dropdown */}
                                                <div className="input-group">
                                                  <label>Вид</label>
                                                  <select
                                                    name="whale_type_id"
                                                    value={formData.whale_type_id}
                                                    onChange={(e) => setFormData({ ...formData, whale_type_id: e.target.value })}
                                                    disabled={whaleTypesLoading || !!whaleTypesError} // Disable if loading or error
                                                  >
                                                    <option value="" disabled>
                                                      {whaleTypesLoading ? "Загрузка видов..." : whaleTypesError ? "Ошибка загрузки" : "Выберите вид кита"}
                                                    </option>
                                                    {!whaleTypesLoading && !whaleTypesError && whaleTypes.map((type) => (
                                                      <option key={type.id} value={type.id}>
                                                        {type.species_rus}
                                                      </option>
                                                    ))}
                                                  </select>
                                                  {whaleTypesError && <div className="error-message small-error">{whaleTypesError}</div>}
                                                </div>
                                            </div>
                                        )}

                                        {error && <div className="error-message">{error}</div>}
                                        <button
                                            type="submit"
                                            className="submit-btn"
                                            disabled={isLoading || !formData.image}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <div className="button-spinner"/>
                                                    Загрузка...
                                                </>
                                            ) : (
                                                'Отправить на проверку'
                                            )}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </>
                    }/>
                <Route path="/catalog" element={<CatalogPage/>}/>
                <Route path="/admin-panel" element={
                    <AdminPanelPage
                        user={user}
                        whaleTypes={whaleTypes}
                        whaleTypesLoading={whaleTypesLoading}
                        whaleTypesError={whaleTypesError}
                    />}
                />
            </Routes>
            </main>

            <footer className="app-footer">
                <p>
                    В случае возникновения вопросов? Свяжитесь по <FaEnvelope style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                    <a href="mailto:okutinda@student.bmstu.ru">okutinda@student.bmstu.ru</a>
                </p>
            </footer>

            {showAuthModal && (
                <AuthModal
                    authType={authType}
                    setAuthType={setAuthType}
                    onClose={() => setShowAuthModal(false)}
                    onAuth={handleAuth}
                    loading={loading}
                    error={error}
                />
            )}

            {showAuthWarning && <AuthWarning/>}
        </div>
        </Router>
    );
};

const AuthModal: React.FC<AuthModalProps> = ({
                                                 authType,
                                                 setAuthType,
                                                 onClose,
                                                 onAuth,
                                                 loading,
                                                 error
                                             }) => {
    const [credentials, setCredentials] = useState({
        email: '',
        password: '',
        username: '',
        isScientist: false,
        degree: '',
        rank: '',
        placeOfWork: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setCredentials({
            ...credentials,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Валидация email
        if (!/^\S+@\S+\.\S+$/.test(credentials.email)) {
            alert('Некорректный email адрес.');
            return;
        }
        // Валидация длины пароля
        if (credentials.password.length < 6) {
            alert('Пароль должен содержать не менее 6 символов.');
            return;
        }
        // Валидация обязательных полей для ученого при регистрации
        if (authType === 'register' && credentials.isScientist) {
          if (!credentials.degree || !credentials.rank || !credentials.placeOfWork) {
            alert('Пожалуйста, заполните все поля для ученого: Ученая степень, Звание, Место работы.');
            return; // Прерываем отправку
          }
        }

        // Если все проверки пройдены
        onAuth(credentials);
    };

    return (
        <div className="auth-modal" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2 className="log-sel">{authType === 'login' ? 'Войти' : 'Зарегистрироваться'}</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={credentials.email}
                        onChange={handleInputChange}
                        required
                        className="auth-input"
                    />
                    {authType === 'register' && (
                        <input
                            type="text"
                            name="username"
                            placeholder="Имя пользователя"
                            value={credentials.username}
                            onChange={handleInputChange}
                            required
                            className="auth-input"
                        />
                    )}
                    <input
                        type="password"
                        name="password"
                        placeholder="Пароль"
                        value={credentials.password}
                        onChange={handleInputChange}
                        required
                        className="auth-input"
                    />

                    {/* Поля для регистрации */}
                    {authType === 'register' && (
                        <>
                            <div className="role-selection">
                                <label className="scientist-label">
                                    <input
                                        type="checkbox"
                                        name="isScientist"
                                        checked={credentials.isScientist}
                                        onChange={handleInputChange}
                                    />
                                    Зарегистрироваться как ученый
                                </label>
                            </div>

                            {/* Дополнительные поля для ученых */}
                            {credentials.isScientist && (
                                <>
                                     <input
                                        type="text"
                                        name="degree"
                                        placeholder="Ученая степень"
                                        value={credentials.degree}
                                        onChange={handleInputChange}
                                        className="auth-input"
                                    />
                                    <input
                                        type="text"
                                        name="rank"
                                        placeholder="Звание"
                                        value={credentials.rank}
                                        onChange={handleInputChange}
                                        className="auth-input"
                                    />
                                     <input
                                        type="text"
                                        name="placeOfWork"
                                        placeholder="Место работы"
                                        value={credentials.placeOfWork}
                                        onChange={handleInputChange}
                                        className="auth-input"
                                    />
                                </>
                            )}
                        </>
                    )}

                    <button type="submit" disabled={loading}>
                        {loading ? 'Обработка...' : authType === 'login' ? 'Войти' : 'Зарегистрироваться'}
                    </button>
                </form>
                <button
                    className="toggle-auth-type"
                    onClick={() => setAuthType(authType === 'login' ? 'register' : 'login')}
                    disabled={loading}
                >
                    {authType === 'login'
                        ? 'Нет аккаунта? Зарегистрируйтесь'
                        : 'Уже есть аккаунт? Войдите'}
                </button>
                {error && <div className="error">{error}</div>}
            </div>
        </div>
    );
};

// Создаем новый компонент AuthWarning
const AuthWarning: React.FC = () => {
    return (
        <div className="auth-warning">
            ⚠️ Please sign in to upload photos
        </div>
    );
};

export default App;