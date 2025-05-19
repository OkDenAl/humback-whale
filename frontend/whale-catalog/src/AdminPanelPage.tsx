import React, { useState } from 'react';
import './AdminPanelPage.css';

// Define the WhaleType interface based on backend structure (same as in App.tsx)
interface WhaleType {
    id: string;
    species_eng: string;
    species_rus: string;
    family: string;
    genus: string;
    conservation_status: string;
}

interface User {
    author_id: string;
    token: string;
    username: string;
    is_scientist: boolean;
}

interface AdminPanelPageProps {
    user: User | null;
    whaleTypes: WhaleType[];
    whaleTypesLoading: boolean;
    whaleTypesError: string;
}

type AdminPage = 'whale-types' | 'statistics';

interface NewWhaleType {
    species_eng: string;
    species_rus: string;
    family: string;
    genus: string;
    conservation_status: string;
}

const AdminPanelPage: React.FC<AdminPanelPageProps> = ({ user, whaleTypes, whaleTypesLoading, whaleTypesError }) => {
    const [currentPage, setCurrentPage] = useState<AdminPage>('whale-types');
    const [showNewWhaleTypeModal, setShowNewWhaleTypeModal] = useState(false);
    const [editingWhaleType, setEditingWhaleType] = useState<WhaleType | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [newWhaleType, setNewWhaleType] = useState<NewWhaleType>({
        species_eng: '',
        species_rus: '',
        family: '',
        genus: '',
        conservation_status: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
                return 'Такой вид кита уже существует.';
            case 500:
                return 'Внутренняя ошибка сервера. Пожалуйста, попробуйте позже.';
            case 502:
                return 'Сервер временно недоступен. Пожалуйста, попробуйте позже.';
            default:
                return defaultMessage;
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (editingWhaleType) {
            setEditingWhaleType(prev => prev ? { ...prev, [name]: value } : null);
        } else {
            setNewWhaleType(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const url = editingWhaleType 
                ? `http://localhost:80/api/v1/private/whale/types`
                : 'http://localhost:80/api/v1/private/whale/types';
            
            const method = 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token || ''}`
                },
                body: JSON.stringify({
                    id: editingWhaleType?.id || '',
                    species_eng: editingWhaleType?.species_eng || newWhaleType.species_eng,
                    species_rus: editingWhaleType?.species_rus || newWhaleType.species_rus,
                    family: editingWhaleType?.family || newWhaleType.family,
                    genus: editingWhaleType?.genus || newWhaleType.genus,
                    conservation_status: editingWhaleType?.conservation_status || newWhaleType.conservation_status
                })
            });

            if (!response.ok) {
                const errorMessage = getErrorMessage(response.status, 'Не удалось сохранить вид кита');
                throw new Error(errorMessage);
            }

            // Закрываем модальное окно и сбрасываем форму
            setShowNewWhaleTypeModal(false);
            setEditingWhaleType(null);
            setNewWhaleType({
                species_eng: '',
                species_rus: '',
                family: '',
                genus: '',
                conservation_status: ''
            });
            
            // Здесь можно добавить обновление списка типов китов
            // Например, вызвать функцию обновления из родительского компонента
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`http://localhost:80/api/v1/private/whale/types/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${user?.token || ''}`
                }
            });

            if (!response.ok) {
                const errorMessage = getErrorMessage(response.status, 'Не удалось удалить вид кита');
                throw new Error(errorMessage);
            }

            setShowDeleteConfirm(null);
            // Здесь можно добавить обновление списка типов китов
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка');
        }
    };

    const handleEdit = (whaleType: WhaleType) => {
        setEditingWhaleType(whaleType);
        setShowNewWhaleTypeModal(true);
    };

    if (!user || !user.is_scientist) {
        return (
            <div className="access-denied">
                <h2>Access Denied</h2>
                <p>Only scientists can access the admin panel.</p>
                {/* Можно добавить кнопку для входа/регистрации или ссылку на главную */}
            </div>
        );
    }

    const renderContent = () => {
        switch (currentPage) {
            case 'whale-types':
                return (
                    <>
                        {whaleTypesLoading ? (
                            <div className="loading-message">Загрузка списка видов китов...</div>
                        ) : whaleTypesError ? (
                            <div className="error-message">Ошибка загрузки видов китов: {whaleTypesError}</div>
                        ) : whaleTypes.length > 0 ? (
                            <>
                                <table className="whale-types-table">
                                    <thead>
                                        <tr>
                                            <th>Русское название</th>
                                            <th>Английское название</th>
                                            <th>Семейство</th>
                                            <th>Род</th>
                                            <th>Статус сохранения</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {whaleTypes.map(type => (
                                            <tr 
                                                key={type.id}
                                                className="whale-type-row"
                                                onClick={() => handleEdit(type)}
                                            >
                                                <td>{type.species_rus}</td>
                                                <td>{type.species_eng}</td>
                                                <td>{type.family}</td>
                                                <td>{type.genus}</td>
                                                <td>{type.conservation_status}</td>
                                                <td>
                                                    <button 
                                                        className="delete-row-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowDeleteConfirm(type.id);
                                                        }}
                                                    >
                                                        Удалить
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="add-whale-type-container">
                                    <button 
                                        className="add-whale-type-btn"
                                        onClick={() => {
                                            setEditingWhaleType(null);
                                            setShowNewWhaleTypeModal(true);
                                        }}
                                    >
                                        Добавить новый вид
                                    </button>
                                </div>
                            </>
                        ) : (
                            <p className="no-data-message">Виды китов не найдены или еще не загружены.</p>
                        )}
                    </>
                );
            case 'statistics':
                return <h2>Статистика (в разработке)</h2>;
            default:
                return null;
        }
    };

    return (
        <div className="admin-panel-page">
            <div className="admin-content">
                <div className="admin-panel-header">
                    <h1>Панель управления</h1>
                    <nav className="admin-nav-menu">
                        <button 
                            className={`admin-nav-item ${currentPage === 'whale-types' ? 'active' : ''}`}
                            onClick={() => setCurrentPage('whale-types')}
                        >
                            Виды китов
                        </button>
                        <button 
                            className={`admin-nav-item ${currentPage === 'statistics' ? 'active' : ''}`}
                            onClick={() => setCurrentPage('statistics')}
                        >
                            Статистика
                        </button>
                    </nav>
                </div>
                {renderContent()}
            </div>

            {showNewWhaleTypeModal && (
                <div className="modal-overlay" onClick={() => {
                    setShowNewWhaleTypeModal(false);
                    setEditingWhaleType(null);
                }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>{editingWhaleType ? 'Редактировать вид кита' : 'Добавить новый вид кита'}</h2>
                        <form onSubmit={handleSubmit} className="new-whale-type-form">
                            <div className="form-group">
                                <label htmlFor="species_rus">Русское название</label>
                                <input
                                    type="text"
                                    id="species_rus"
                                    name="species_rus"
                                    value={editingWhaleType?.species_rus || newWhaleType.species_rus}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="species_eng">Английское название</label>
                                <input
                                    type="text"
                                    id="species_eng"
                                    name="species_eng"
                                    value={editingWhaleType?.species_eng || newWhaleType.species_eng}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="family">Семейство</label>
                                <input
                                    type="text"
                                    id="family"
                                    name="family"
                                    value={editingWhaleType?.family || newWhaleType.family}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="genus">Род</label>
                                <input
                                    type="text"
                                    id="genus"
                                    name="genus"
                                    value={editingWhaleType?.genus || newWhaleType.genus}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="conservation_status">Статус сохранения</label>
                                <input
                                    type="text"
                                    id="conservation_status"
                                    name="conservation_status"
                                    value={editingWhaleType?.conservation_status || newWhaleType.conservation_status}
                                    onChange={handleInputChange}
                                    placeholder="Например: LC - Вызывающие наименьшие опасения"
                                    required
                                />
                            </div>
                            {error && (
                                <div className="error-message" style={{ 
                                    color: '#dc3545', 
                                    backgroundColor: '#f8d7da', 
                                    padding: '10px', 
                                    borderRadius: '4px', 
                                    marginBottom: '15px',
                                    border: '1px solid #f5c6cb'
                                }}>
                                    {error}
                                </div>
                            )}
                            <div className="modal-buttons">
                                <button 
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Сохранение...' : editingWhaleType ? 'Сохранить' : 'Сохранить'}
                                </button>
                                <button 
                                    onClick={() => {
                                        setShowNewWhaleTypeModal(false);
                                        setEditingWhaleType(null);
                                    }}
                                    disabled={isSubmitting}
                                >
                                    Отменить
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDeleteConfirm && (
                <div className="confirmation-modal">
                    <div className="confirmation-modal-content">
                        <h2>Подтверждение удаления</h2>
                        <p>Вы уверены, что хотите удалить этот вид кита? Это действие нельзя отменить.</p>
                        <div className="modal-buttons">
                            <button 
                                className="confirm-delete-btn"
                                onClick={() => handleDelete(showDeleteConfirm)}
                            >
                                Удалить
                            </button>
                            <button 
                                onClick={() => setShowDeleteConfirm(null)}
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanelPage;
