import React, { useState, useEffect } from 'react';
import './App.css';
import AppIcon from './assets/whale.jpg';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import CatalogPage from './CatalogPage';
import AdminPanelPage from './AdminPanelPage';
import AboutPage from './AboutPage';
import ResetPasswordPage from './ResetPasswordPage';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet'
import { FaSignInAlt, FaUserPlus, FaEnvelope } from 'react-icons/fa';

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

interface User {
    author_id: string;
    token: string;
    username: string;
    is_scientist: boolean;
}

interface WhaleType {
    id: string;
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
    saw_at: string;
    description: string;
    name: string;
    gender: string;
    whale_type_id: string;
}

interface AuthModalProps {
    authType: 'login' | 'register' | 'forgot-password';
    setAuthType: (type: 'login' | 'register' | 'forgot-password') => void;
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
        case 406:
            return 'Неверный пароль.Попробуйте ещё раз.';
        case 409:
            return 'Пользователь с таким email или именем пользователя уже существует.';
        case 422:
            return 'Не удалось идентифицировать объект на изображении.';
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
    const [authType, setAuthType] = useState<'login' | 'register' | 'forgot-password'>('login');
    const [formData, setFormData] = useState<FormData>({
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
    const [whaleTypes, setWhaleTypes] = useState<WhaleType[]>([]);
    const [whaleTypesLoading, setWhaleTypesLoading] = useState<boolean>(true);
    const [whaleTypesError, setWhaleTypesError] = useState<string>('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isUploadSuccess, setIsUploadSuccess] = useState(false);
    const [hasPreviousData, setHasPreviousData] = useState(false);

    useEffect(() => {
        const savedUser = localStorage.getItem('whaleUser');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }

        const savedFormData = localStorage.getItem('previousFormData');
        setHasPreviousData(!!savedFormData);

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
            setTimeout(() => {
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

            const dataToStore = {
                latitude: formData.latitude,
                longitude: formData.longitude,
                saw_at: formData.saw_at,
                description: formData.description,
                name: formData.name,
                gender: formData.gender,
                whale_type_id: formData.whale_type_id,
                timestamp: Date.now()
            };
            localStorage.setItem('previousFormData', JSON.stringify(dataToStore));
            setHasPreviousData(true);

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

    useEffect(() => {
        const checkPreviousData = () => {
            const savedData = localStorage.getItem('previousFormData');
            if (savedData) {
                const data = JSON.parse(savedData);
                const now = Date.now();
                const fifteenMinutes = 15 * 60 * 1000;
                
                if (data.timestamp && (now - data.timestamp) <= fifteenMinutes) {
                    setHasPreviousData(true);
                } else {
                    setHasPreviousData(false);
                    localStorage.removeItem('previousFormData');
                }
            } else {
                setHasPreviousData(false);
            }
        };

        checkPreviousData();
        const interval = setInterval(checkPreviousData, 60000);

        return () => clearInterval(interval);
    }, []);

    const handleRestorePreviousData = () => {
        const savedData = localStorage.getItem('previousFormData');
        if (savedData) {
            const data = JSON.parse(savedData);
            const now = Date.now();
            const fifteenMinutes = 15 * 60 * 1000;
            
            if (data.timestamp && (now - data.timestamp) <= fifteenMinutes) {
                setFormData(prev => ({
                    ...prev,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    saw_at: data.saw_at,
                    description: data.description,
                    name: data.name,
                    gender: data.gender,
                    whale_type_id: data.whale_type_id
                }));
            } else {
                setHasPreviousData(false);
                localStorage.removeItem('previousFormData');
            }
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
                    <Link to="/about" className="link">
                        О проекте
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
                                <h1 className="header-card-main" title="Заполните форму для отправки фотографии кита. Укажите место и время наблюдения, добавьте описание и, если вы ученый, дополнительную информацию о животном.">Форма отправки изображения</h1>
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
                                        {hasPreviousData && (
                                            <button
                                                type="button"
                                                className="restore-data-btn"
                                                onClick={handleRestorePreviousData}
                                                title="Заполнить данные из предыдущей загрузки"
                                            >
                                                Восстановить предыдущие данные
                                            </button>
                                        )}
                                        <div className="coordinates-grid">
                                            <div className="input-group">
                                                <label title="Введите широту места наблюдения в градусах (например: 34.0522)">Широта</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    placeholder="e.g. 34.0522"
                                                    value={formData.latitude}
                                                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label title="Введите долготу места наблюдения в градусах (например: -118.2437)">Долгота</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    placeholder="e.g. -118.2437"
                                                    value={formData.longitude}
                                                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                                    required
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
                                                <h3>{formData.preview ? 'Изменить изображение (jpg, jpeg)' : 'Загрузить изображение (jpg, jpeg)'}</h3>
                                            </div>
                                        </label>

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
                                            <label title="Опишите детали наблюдения: поведение кита, погодные условия, количество особей и т.д.">Описание</label>
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
                                                    <label title="Введите имя если оно известно">Имя</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Имя кита"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    />
                                                </div>
                                                <div className="input-group">
                                                    <label title="Выберите пол особи, если его удалось определить">Пол</label>
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
                                                <div className="input-group">
                                                  <label title="Выберите вид кита из списка. Если вид не определен, оставьте поле пустым">Вид</label>
                                                  <select
                                                    name="whale_type_id"
                                                    value={formData.whale_type_id}
                                                    onChange={(e) => setFormData({ ...formData, whale_type_id: e.target.value })}
                                                    disabled={whaleTypesLoading || !!whaleTypesError}
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

                                        <button
                                            type="submit"
                                            className="submit-btn"
                                            disabled={isLoading || !formData.image || !formData.latitude || !formData.longitude}
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

                                        {error && (
                                            <div className="error-message-container">
                                                <div className="error-message">
                                                    <div className="error-icon">!</div>
                                                    {error}
                                                </div>
                                            </div>
                                        )}
                                    </form>
                                )}
                            </div>
                        </>
                    }/>
                <Route path="/catalog" element={<CatalogPage/>}/>
                <Route path="/about" element={<AboutPage/>}/>
                <Route path="/reset-password" element={<ResetPasswordPage/>}/>
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
    const [resetEmailSent, setResetEmailSent] = useState(false);
    const [resetError, setResetError] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setCredentials({
            ...credentials,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetError('');
        
        if (authType === 'forgot-password') {
            if (!/^\S+@\S+\.\S+$/.test(credentials.email)) {
                setResetError('Некорректный email адрес');
                return;
            }
            
            try {
                const response = await fetch('http://localhost:80/api/v1/public/auth/send-reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: credentials.email })
                });

                if (!response.ok) {
                    const errorMessage = getErrorMessage(response.status, 'Не удалось отправить письмо для сброса пароля');
                    throw new Error(errorMessage);
                }

                setResetEmailSent(true);
            } catch (err: any) {
                setResetError(err.message || 'Произошла ошибка при отправке письма');
            }
            return;
        }

        if (!/^\S+@\S+\.\S+$/.test(credentials.email)) {
            setResetError('Некорректный email адрес');
            return;
        }
        if (credentials.password.length < 6) {
            setResetError('Пароль должен содержать не менее 6 символов');
            return;
        }
        if (authType === 'register' && credentials.isScientist) {
            if (!credentials.degree || !credentials.rank || !credentials.placeOfWork) {
                setResetError('Пожалуйста, заполните все поля для ученого: Ученая степень, Звание, Место работы');
                return;
            }
        }

        onAuth(credentials);
    };

    const renderForm = () => {
        if (authType === 'forgot-password') {
            if (resetEmailSent) {
                return (
                    <div className="reset-success">
                        <h3>Письмо отправлено!</h3>
                        <p>Мы отправили инструкции по сбросу пароля на ваш email.</p>
                        <p>Пожалуйста, проверьте вашу почту и следуйте инструкциям в письме.</p>
                        <button
                            className="toggle-auth-type"
                            onClick={() => {
                                setAuthType('login');
                                setResetEmailSent(false);
                                setResetError('');
                            }}
                        >
                            Вернуться к входу
                        </button>
                    </div>
                );
            }

            return (
                <>
                    <h2 className="log-sel">Восстановление пароля</h2>
                    <p className="reset-info">
                        Введите ваш email, и мы отправим вам инструкции по сбросу пароля.
                    </p>
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
                        <button type="submit" disabled={loading}>
                            {loading ? 'Отправка...' : 'Отправить инструкции'}
                        </button>
                        {resetError && (
                            <div className="error-message-container">
                                <div className="error-message">
                                    <div className="error-icon">!</div>
                                    {resetError}
                                </div>
                            </div>
                        )}
                    </form>
                </>
            );
        }

        return (
            <>
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

                    {authType === 'login' && (
                        <button
                            type="button"
                            className="forgot-password-link"
                            onClick={() => {
                                setAuthType('forgot-password');
                                setResetError('');
                            }}
                            disabled={loading}
                        >
                            Забыли пароль?
                        </button>
                    )}

                    <button type="submit" disabled={loading}>
                        {loading ? 'Обработка...' : authType === 'login' ? 'Войти' : 'Зарегистрироваться'}
                    </button>
                    {resetError && (
                        <div className="error-message-container">
                            <div className="error-message">
                                <div className="error-icon">!</div>
                                {resetError}
                            </div>
                        </div>
                    )}
                </form>
            </>
        );
    };

    return (
        <div className="auth-modal" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                {renderForm()}
                {(authType === 'login' || authType === 'register') && (
                    <>
                        <button
                            className="toggle-auth-type"
                            onClick={() => {
                                setAuthType(authType === 'login' ? 'register' : 'login');
                                setResetError('');
                            }}
                            disabled={loading}
                        >
                            {authType === 'login'
                                ? 'Нет аккаунта? Зарегистрируйтесь'
                                : 'Уже есть аккаунт? Войдите'}
                        </button>
                    </>
                )}
                {error && (
                    <div className="error-message-container">
                        <div className="error-message">
                            <div className="error-icon">!</div>
                            {error}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const AuthWarning: React.FC = () => {
    return (
        <div className="auth-warning">
            ⚠️ Пожалуйста, войдите в систему, чтобы загрузить фотографии
        </div>
    );
};

export default App;