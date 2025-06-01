import React, { useState, useEffect } from 'react';
import './AdminPanelPage.css';

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

type AdminPage = 'whale-types';

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
    const [localWhaleTypes, setLocalWhaleTypes] = useState<WhaleType[]>([]);
    const [newWhaleType, setNewWhaleType] = useState<NewWhaleType>({
        species_eng: '',
        species_rus: '',
        family: '',
        genus: '',
        conservation_status: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (whaleTypes) {
            setLocalWhaleTypes(whaleTypes);
        }
    }, [whaleTypes]);

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

            const whaleTypeData = {
                id: editingWhaleType?.id || '',
                species_eng: editingWhaleType?.species_eng || newWhaleType.species_eng,
                species_rus: editingWhaleType?.species_rus || newWhaleType.species_rus,
                family: editingWhaleType?.family || newWhaleType.family,
                genus: editingWhaleType?.genus || newWhaleType.genus,
                conservation_status: editingWhaleType?.conservation_status || newWhaleType.conservation_status
            };

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token || ''}`
                },
                body: JSON.stringify(whaleTypeData)
            });

            if (!response.ok) {
                const errorMessage = getErrorMessage(response.status, 'Не удалось сохранить вид кита');
                throw new Error(errorMessage);
            }

            if (editingWhaleType) {
                setLocalWhaleTypes(prev => 
                    prev.map(wt => wt.id === editingWhaleType.id ? whaleTypeData : wt)
                );
            } else {
                setLocalWhaleTypes(prev => [...prev, whaleTypeData]);
            }

            setShowNewWhaleTypeModal(false);
            setEditingWhaleType(null);
            setNewWhaleType({
                species_eng: '',
                species_rus: '',
                family: '',
                genus: '',
                conservation_status: ''
            });
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

            setLocalWhaleTypes(prev => prev.filter(wt => wt.id !== id));
            setShowDeleteConfirm(null);
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
                <h2>Доступ запрещен</h2>
                <p>Только ученые имеют доступ к панели управления.</p>
                {}
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
                        ) : localWhaleTypes.length > 0 ? (
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
                                        {localWhaleTypes.map(type => (
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
