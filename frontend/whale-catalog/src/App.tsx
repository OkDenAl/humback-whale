import React, { useState, useEffect } from 'react';
import './App.css';
import AppIcon from './assets/react.svg'; // Импорт иконки

// Добавим иконку меню для мобильной версии
import { FaSignInAlt, FaUserPlus } from 'react-icons/fa';

interface User {
    author_id: string;
    token: string;
    username: string;
    isScientist?: boolean; // Добавляем опциональное поле
}

interface FormData {
    image: File | null;
    preview: string | null;
    latitude: string;
    longitude: string;
}

interface AuthModalProps {
    authType: 'login' | 'register';
    setAuthType: (type: 'login' | 'register') => void;
    onClose: () => void;
    onAuth: (credentials: { email: string; password: string }) => void;
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
        longitude: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const savedUser = localStorage.getItem('whaleUser');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    const handleAuth = async (credentials: { email: string; password: string }) => {
        try {
            setLoading(true);
            const endpoint = authType === 'login' ? 'login' : 'register';
            const response = await fetch(`http://localhost:80/api/v1/public/auth/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
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
            setFormData({
                ...formData,
                image: file,
                preview: URL.createObjectURL(file)
            });
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return setShowAuthModal(true);

        try {
            setLoading(true);
            const formPayload = new FormData();
            formData.image && formPayload.append('image', formData.image);
            formData.latitude && formPayload.append('latitude', formData.latitude);
            formData.longitude && formPayload.append('longitude', formData.longitude);

            const response = await fetch(
                `http://localhost:80/api/v1/private/upload/${user.author_id}`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${user.token}`
                    },
                    body: formPayload
                }
            );

            if (!response.ok) throw new Error(await response.text());

            alert('Изображение успешно загружено!');
            setFormData({ image: null, preview: null, latitude: '', longitude: '' });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка загрузки');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('whaleUser');
        setUser(null);
    };

    return (
        <div className="App">
            <header className="app-bar">
                <div className="app-bar-content">
                    <div className="logo">
                        <img src={AppIcon} alt="Whale Icon" className="app-icon"/>
                        <span>WhaleCatalog</span>
                    </div>

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
                                    <span>Sign In</span>
                                </button>
                                <button
                                    className="auth-btn primary"
                                    onClick={() => {
                                        setAuthType('register');
                                        setShowAuthModal(true);
                                    }}
                                >
                                    <FaUserPlus/>
                                    <span>Register</span>
                                </button>
                            </>
                        ) : (
                            <div className="user-panel">
                                <span>Welcome, {user.username}</span>
                                <button
                                    className="logout-btn"
                                    onClick={handleLogout}
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </nav>
                </div>
            </header>

            <main className="main-content">
                <div className="hero-section">
                    <h1>Discover the Ocean Giants</h1>
                    <p className="hero-text">
                        Join our community to track whale sightings and contribute
                        to marine conservation efforts worldwide.
                    </p>
                </div>

                <div className="upload-card">
                    <h2 className="upload-title">
                        Report a Sighting
                    </h2>

                    <form onSubmit={handleSubmit} className="upload-form">
                        <div className="preview-container">
                            {formData.preview ? (
                                <img
                                    src={formData.preview}
                                    alt="Preview"
                                    className="preview-image"
                                />
                            ) : (
                                <div className="upload-placeholder">
                                <span>No image selected</span>
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
                                {formData.preview ? 'Change Photo' : 'Select Photo'}
                            </div>
                        </label>

                        <div className="coordinates-grid">
                            <div className="input-group">
                                <label>Latitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="e.g. 34.0522"
                                    value={formData.latitude}
                                    onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                                />
                            </div>
                            <div className="input-group">
                                <label>Longitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="e.g. -118.2437"
                                    value={formData.longitude}
                                    onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={loading}
                        >
                            {loading ? 'Uploading...' : 'Submit Sighting'}
                        </button>

                        {error && <div className="error-message">{error}</div>}
                    </form>
                </div>
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

            {showAuthWarning && <AuthWarning />}
        </div>
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