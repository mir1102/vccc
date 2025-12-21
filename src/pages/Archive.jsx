import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { itemService } from '../services/itemService';
import { RefreshCcw, Trash2, Archive as ArchiveIcon } from 'lucide-react';
import './Archive.css';

const Archive = () => {
    const { user } = useAuth();
    const [archivedItems, setArchivedItems] = useState([]);

    useEffect(() => {
        if (user?.uid) {
            loadArchivedItems();
        }
    }, [user]);

    const loadArchivedItems = async () => {
        if (user?.uid) {
            const allItems = await itemService.getAllItems(user.uid);
            setArchivedItems(allItems.filter(item => item.isArchived));
        }
    };

    const handleUnarchive = async (item) => {
        await itemService.updateItem(item.id, { isArchived: false });
        loadArchivedItems(); // Refresh
    };

    const handleDeletePermanently = async (item) => {
        if (confirm("정말로 영구 삭제하시겠습니까?")) {
            await itemService.deleteItem(item.id);
            loadArchivedItems(); // Refresh
        }
    };

    return (
        <div className="archive-container">
            <header className="archive-header">
                <h1><ArchiveIcon size={24} style={{ marginRight: '8px' }} />보관함</h1>
            </header>

            <div className="archived-list">
                {archivedItems.length === 0 ? (
                    <div className="empty-state">
                        <ArchiveIcon size={48} color="#d1d5db" />
                        <p>보관된 항목이 없습니다.</p>
                    </div>
                ) : (
                    archivedItems.map(item => (
                        <div key={item.id} className="archived-item">
                            <div className="item-content">
                                <span className="item-text">{item.content || '제목 없음'}</span>
                                <span className="item-date">{new Date(item.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                            </div>
                            <div className="archived-actions">
                                <button onClick={() => handleUnarchive(item)} title="복구" className="action-btn restore">
                                    <RefreshCcw size={16} />
                                    <span>복구</span>
                                </button>
                                <button onClick={() => handleDeletePermanently(item)} title="영구 삭제" className="action-btn delete">
                                    <Trash2 size={16} />
                                    <span>삭제</span>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Archive;
