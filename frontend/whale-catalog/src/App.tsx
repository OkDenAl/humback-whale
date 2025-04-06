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
}

interface AuthModalProps {
    authType: 'login' | 'register';
    setAuthType: (type: 'login' | 'register') => void;
    onClose: () => void;
    onAuth: (credentials: { email: string; password: string; username: string }) => void;
    loading: boolean;
    error: string;
}

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

    const handleAuth = async (credentials: { email: string; password: string; username:string;}) => {
        try {
            setLoading(true);
            const endpoint = authType === 'login' ? 'login' : 'register';
            const response = await fetch(`http://localhost:80/api/v1/public/auth/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });

            if (!response.ok) throw new Error(await response.text());

            const data = await response.json() as User;
            localStorage.setItem('whaleUser', JSON.stringify(data));
            setUser(data);
            setShowAuthModal(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка авторизации');
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
            if (response.ok) {
                setIsUploadSuccess(true);
            }

            if (!response.ok) throw new Error(await response.text());

            setFormData({
                image: null,
                preview: null,
                latitude: '',
                longitude: '',
                saw_at: ''
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка загрузки');
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
                                <span>{user.username}</span>
                                <button
                                    className="logout-btn"
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
                                        <h3 className="header-card">1) Загрузите изображение вашего кита</h3>
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

                                        <h3 className="header-card">2) Выберите локацию, где вы встретили кита на
                                            карте и укажите доп данные</h3>
                                        <div className="map-date-container">
                                            <div className="map-container">
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
                                                            setFormData({
                                                                ...formData,
                                                                latitude: lat.toFixed(6),
                                                                longitude: lng.toFixed(6)
                                                            });
                                                        }}
                                                    />
                                                    {formData.latitude && formData.longitude && (
                                                        <Marker
                                                            position={[
                                                                parseFloat(formData.latitude),
                                                                parseFloat(formData.longitude)
                                                            ]}
                                                        />
                                                    )}
                                                </MapContainer>
                                            </div>

                                            <div className="date-input-container">
                                                <label className="date-label">
                                                    Выберите дату встречи:
                                                    <input
                                                        type="date"
                                                        value={formData.saw_at}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            saw_at: e.target.value
                                                        })}
                                                        max={new Date().toISOString().split('T')[0]}
                                                        className="date-input"
                                                    />
                                                </label>
                                            </div>
                                        </div>

                                        <div className="coordinates-grid">
                                            <div className="input-group">
                                                <label>Широта</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    placeholder="e.g. 34.0522"
                                                    value={formData.latitude}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        latitude: e.target.value
                                                    })}
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label>Долгота</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    placeholder="e.g. -118.2437"
                                                    value={formData.longitude}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        longitude: e.target.value
                                                    })}
                                                />
                                            </div>
                                        </div>

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
        isScientist: false // Новое поле
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!/^\S+@\S+\.\S+$/.test(credentials.email)) {
            alert('Invalid email');
            return;
        }
        if (credentials.password.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }
        onAuth(credentials);
    };

    return (
        <div className="auth-modal" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>{authType === 'login' ? 'Sign In' : 'Sign Up'}</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={credentials.email}
                        onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                        required
                        className="auth-input"
                    />
                    {authType === 'register' && (<input
                            type="username"
                            placeholder="username"
                            value={credentials.username}
                            onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                            required
                            className="auth-input"
                        />
                    )}
                    <input
                        type="password"
                        placeholder="Password"
                        value={credentials.password}
                        onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                        required
                        minLength={6}
                        className="auth-input"
                    />

                    {/* Добавляем чекбокс для ученых */}
                    {authType === 'register' && (
                        <label className="scientist-checkbox">
                            <input
                                type="checkbox"
                                checked={credentials.isScientist}
                                onChange={(e) => setCredentials({...credentials, isScientist: e.target.checked})}
                            />
                            <span className="checkmark"></span>
                            I am a scientist
                        </label>
                    )}

                    <button type="submit" disabled={loading}>
                        {loading ? 'Processing...' : authType === 'login' ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>
                <button
                    className="toggle-auth-type"
                    onClick={() => setAuthType(authType === 'login' ? 'register' : 'login')}
                    disabled={loading}
                >
                    {authType === 'login'
                        ? 'Dont have an account? Sign Up'
                        : 'Already have an account? Sign In'}
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