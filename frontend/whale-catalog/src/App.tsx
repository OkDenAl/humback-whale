import React, { useState, useEffect } from 'react';
import './App.css';
import AppIcon from './assets/whale.jpg'; // Импорт иконки
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import CatalogPage from './CatalogPage';
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
import { FaSignInAlt, FaUserPlus } from 'react-icons/fa';

interface User {
    author_id: string;
    token: string;
    username: string;
    is_scientist: boolean; // Добавляем опциональное поле
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

// Функция для маппинга ошибок бэкенда в сообщения для пользователя
const mapBackendErrorToUserMessage = (error: any, status?: number): string => {
  console.error("Backend Error:", error, "Status:", status); // Логируем ошибку для отладки

  const defaultMessage = "Произошла неизвестная ошибка. Пожалуйста, попробуйте позже.";
  let message = defaultMessage;

  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();

    if (status === 409 || errorMessage.includes("already exists")) {
      message = "Пользователь с таким email или именем пользователя уже существует.";
    } else if (status === 400) {
      // Можно добавить более специфичные проверки для 400, если бэкенд их предоставляет
      message = "Ошибка валидации данных. Пожалуйста, проверьте введенные поля.";
    } else if (status === 422) {
        // Можно добавить более специфичные проверки для 400, если бэкенд их предоставляет
        message = "Не удалось распознать горбатого кита на фотографии.";
      }else if (status === 401 || status === 403 || errorMessage.includes("invalid password")) {
        // Ошибка для входа
        message = "Неверный email или пароль.";
    } else if (status === 500) {
      message = "Произошла ошибка на сервере. Пожалуйста, попробуйте позже.";
    } else {
      // Если есть сообщение от бэкенда, но статус не помог, показываем его (но это менее user-friendly)
      // message = error.message;
      // Или оставляем defaultMessage
    }
  } else if (typeof error === 'string') {
    // На случай, если была брошена просто строка
    if (error.toLowerCase().includes("already exists")) {
       message = "Пользователь с таким email или именем пользователя уже существует.";
    } else {
       message = error; // Показываем строку как есть
    }
  }

  // Обработка ошибок сети (offline и т.д.)
  if (error instanceof TypeError && error.message === "Failed to fetch") {
      message = "Ошибка сети. Проверьте ваше интернет-соединение.";
  }

  return message;
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
        gender: ''
    });
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
        let responseStatus: number | undefined;
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

            responseStatus = response.status;
            const responseText = await response.text();

            if (!response.ok) {
                let errorPayload: any = responseText;
                 try {
                     errorPayload = JSON.parse(responseText);
                 } catch (e) { /* Оставляем текст, если не JSON */ }

                 const error = new Error(errorPayload.message || responseText);
                 (error as any).status = responseStatus;
                 throw error;
            }

            const data = JSON.parse(responseText) as User;
            localStorage.setItem('whaleUser', JSON.stringify(data));
            setUser(data);
            setShowAuthModal(false);
        } catch (err: any) {
            setError(mapBackendErrorToUserMessage(err, err.status || responseStatus));
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
        let responseStatus: number | undefined;
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
            responseStatus = response.status;
            const responseText = await response.text();

            if (!response.ok) {
                 let errorPayload: any = responseText;
                 try {
                     errorPayload = JSON.parse(responseText);
                 } catch (e) { /* Оставляем текст, если не JSON */ }
                 const error = new Error(errorPayload.message || responseText);
                 (error as any).status = responseStatus;
                 throw error;
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
                gender: ''
            });
        } catch (err: any) {
            setError(mapBackendErrorToUserMessage(err, err.status || responseStatus));
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
                                <h1 className="header-card-main">Форма отправки изображения кита</h1>
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
                                                        required // Make selection mandatory if needed
                                                    >
                                                        <option value="" disabled>Выберите пол (если известно)</option>
                                                        <option value="Мужской">Мужской</option>
                                                        <option value="Женский">Женский</option>
                                                        <option value="Детеныш">Детеныш</option>
                                                    </select>
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
            </Routes>
            </main>

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