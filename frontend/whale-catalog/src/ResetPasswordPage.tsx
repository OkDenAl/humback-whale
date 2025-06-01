import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './App.css';

const ResetPasswordPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    const [passwords, setPasswords] = useState({
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswords(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!token) {
            setError('Неверная ссылка для сброса пароля');
            return;
        }

        if (passwords.password.length < 6) {
            setError('Пароль должен содержать не менее 6 символов');
            return;
        }

        if (passwords.password !== passwords.confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('http://localhost:80/api/v1/public/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: token,
                    password: passwords.password
                })
            });

            if (!response.ok) {
                const errorMessage = getErrorMessage(response.status, 'Не удалось сбросить пароль');
                throw new Error(errorMessage);
            }

            setSuccess(true);
            setTimeout(() => {
                navigate('/');
            }, 1000);
        } catch (err: any) {
            setError(err.message || 'Произошла ошибка при сбросе пароля');
        } finally {
            setLoading(false);
        }
    };

    const getErrorMessage = (status: number, defaultMessage: string): string => {
        switch (status) {
            case 400:
                return 'Некорректные данные. Пожалуйста, проверьте введенную информацию.';
            case 401:
                return 'Недействительная ссылка для сброса пароля.';
            case 403:
                return 'Ссылка для сброса пароля истекла.';
            case 404:
                return 'Ссылка для сброса пароля не найдена.';
            case 500:
                return 'Внутренняя ошибка сервера. Пожалуйста, попробуйте позже.';
            default:
                return defaultMessage;
        }
    };

    if (success) {
        return (
            <div className="reset-success-page">
                <div className="success-message">
                    <div className="success-icon">✓</div>
                    <h3>Пароль успешно изменен!</h3>
                    <p>Вы будете перенаправлены на главную страницу через несколько секунд...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="reset-password-page">
            <div className="reset-password-container">
                <h2>Сброс пароля</h2>
                <p className="reset-info">
                    Введите новый пароль и подтвердите его
                </p>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input
                            type="password"
                            name="password"
                            placeholder="Новый пароль"
                            value={passwords.password}
                            onChange={handleInputChange}
                            required
                            className="auth-input"
                        />
                    </div>
                    <div className="input-group">
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Подтвердите пароль"
                            value={passwords.confirmPassword}
                            onChange={handleInputChange}
                            required
                            className="auth-input"
                        />
                    </div>
                    <button type="submit" disabled={loading} className="submit-btn">
                        {loading ? 'Сохранение...' : 'Сохранить новый пароль'}
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
            </div>
        </div>
    );
};

export default ResetPasswordPage; 