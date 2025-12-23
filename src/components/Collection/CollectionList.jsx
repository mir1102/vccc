import React, { useState, useEffect } from 'react';
import { Plus, LayoutGrid, List as ListIcon, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { categoryService } from '../../services/categoryService';
import { useAuth } from '../../context/AuthContext';
import useLongPress from '../../hooks/useLongPress';
import Modal from '../UI/Modal';
import ContextMenu from '../UI/ContextMenu';
import './CollectionList.css';

import CollectionDetail from '../Item/CollectionDetail';

const CollectionList = ({ onDataChange }) => {
    const { user } = useAuth();
    const [categories, setCategories] = useState([]);
    const [viewMode, setViewMode] = useState('list'); // Default and only mode now
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null); // For detail view

    // Form State
    const [editingCategory, setEditingCategory] = useState(null); // If set, we are editing
    const [categoryName, setCategoryName] = useState('');
    const [categoryColor, setCategoryColor] = useState('#3b82f6');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Action Menu State
    const [activeMenuId, setActiveMenuId] = useState(null);

    useEffect(() => {
        if (user?.uid) {
            loadCategories();
        }
    }, [user]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveMenuId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const loadCategories = async () => {
        if (!user?.uid) return;
        const data = await categoryService.getCategories(user.uid);
        setCategories(data);
    };

    const openAddModal = () => {
        setEditingCategory(null);
        setCategoryName('');
        setCategoryColor('#3b82f6');
        setIsAddModalOpen(true);
    };

    const openEditModal = (cat) => {
        setEditingCategory(cat);
        setCategoryName(cat.name);
        setCategoryColor(cat.color);
        setIsAddModalOpen(true); // Reuse the same modal
        setActiveMenuId(null);
    };

    const handleSaveCategory = async (e) => {
        e.preventDefault();
        if (!categoryName.trim()) return;

        if (editingCategory) {
            // Optimistic Update
            setCategories(prev => prev.map(c =>
                c.id === editingCategory.id
                    ? { ...c, name: categoryName, color: categoryColor }
                    : c
            ));

            // Close modal immediately
            setCategoryName('');
            setIsAddModalOpen(false);
            setEditingCategory(null);

            // Background Sync
            try {
                await categoryService.updateCategory(editingCategory.id, {
                    name: categoryName,
                    color: categoryColor
                });
            } catch (error) {
                console.error("Failed to update category", error);
                // Revert logic could go here
            }

        } else {
            // Optimistic Add with Pre-generated ID
            const newId = categoryService.getNewId();

            const optimisticCat = {
                id: newId,
                name: categoryName,
                color: categoryColor,
                createdAt: new Date()
            };

            setCategories(prev => [optimisticCat, ...prev]);

            // Close modal immediately
            setCategoryName('');
            setIsAddModalOpen(false);

            // Background Sync
            try {
                if (user?.uid) {
                    await categoryService.addCategory(user.uid, {
                        name: categoryName,
                        color: categoryColor
                    }, newId);
                }
            } catch (error) {
                console.error("Failed to add category", error);
                alert("저장에 실패했습니다.");
                // Revert
                setCategories(prev => prev.filter(c => c.id !== newId));
            }
        }
    };

    const handleDeleteCategory = async (catId) => {
        if (!window.confirm("정말 이 컬렉션을 삭제하시겠습니까?")) return;

        const success = await categoryService.deleteCategory(catId);
        if (success) {
            setCategories(categories.filter(c => c.id !== catId));
        } else {
            alert("삭제에 실패했습니다.");
        }
    };

    const toggleMenu = (e, catId) => {
        e.stopPropagation();
        setActiveMenuId(activeMenuId === catId ? null : catId);
    };

    // Context Menu State
    const [contextMenu, setContextMenu] = useState(null); // { x, y, targetId, item }

    const handleContextMenu = (e, category) => {
        e.preventDefault();
        setContextMenu({
            x: e.pageX,
            y: e.pageY,
            targetId: category.id,
            item: category
        });
        setActiveMenuId(null); // Close regular menu if open
    };

    const handleCloseContextMenu = () => {
        setContextMenu(null);
    };

    const openCollectionDetail = (category) => {
        if (contextMenu) return; // Don't open if context menu is active
        setSelectedCategory(category);
    };

    return (
        <div className="collection-list-container">
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={handleCloseContextMenu}
                    actions={[
                        {
                            label: '수정',
                            icon: <Edit2 size={16} />,
                            onClick: () => openEditModal(contextMenu.item)
                        },
                        {
                            label: '삭제',
                            icon: <Trash2 size={16} />,
                            danger: true,
                            onClick: () => handleDeleteCategory(contextMenu.item.id)
                        }
                    ]}
                />
            )}
            <div className="category-header">
                <h3>컬렉션 ({categories.length})</h3>
                <div className="category-actions">
                    <button className="add-btn" onClick={openAddModal}>
                        <Plus size={18} />
                        <span>추가</span>
                    </button>
                </div>
            </div>

            <div className={`categories-grid ${viewMode}`}>
                {categories.map(cat => (
                    <CollectionCard
                        key={cat.id}
                        cat={cat}
                        viewMode={viewMode}
                        onClick={() => openCollectionDetail(cat)}
                        onContextMenu={(e) => handleContextMenu(e, cat)}
                    />
                ))}
            </div>

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title={editingCategory ? "컬렉션 수정" : "컬렉션 추가"}
            >
                <form onSubmit={handleSaveCategory} className="add-cat-form">
                    <div className="form-group">
                        <label>이름</label>
                        <input
                            type="text"
                            placeholder="예: 업무, 독서"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>색상</label>
                        <div className="color-picker-wrapper">
                            <input
                                type="color"
                                value={categoryColor}
                                onChange={(e) => setCategoryColor(e.target.value)}
                            />
                            <span>{categoryColor}</span>
                        </div>
                    </div>
                    <button type="submit" className="submit-btn" disabled={!categoryName.trim()}>
                        저장하기
                    </button>
                </form>
            </Modal>

            {/* Collection Detail Modal */}
            <Modal
                isOpen={!!selectedCategory}
                onClose={() => setSelectedCategory(null)}
                title={selectedCategory ? selectedCategory.name : ''}
            >
                {selectedCategory && (
                    <CollectionDetail
                        category={selectedCategory}
                        onDataChange={onDataChange}
                    />
                )}
            </Modal>
        </div>
    );
};

// Helper Component for Long Press
const CollectionCard = ({ cat, viewMode, onClick, onContextMenu }) => {
    const { cancel, ...longPressHandlers } = useLongPress(
        (e) => {
            // Long Press Action
            let clientX, clientY;
            if (e.touches && e.touches[0]) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            const fakeEvent = {
                preventDefault: () => { },
                pageX: clientX + window.scrollX,
                pageY: clientY + window.scrollY
            };
            onContextMenu(fakeEvent);
        },
        onClick, // Normal Click Action
        { shouldPreventDefault: false, delay: 500 }
    );

    return (
        <div
            className="category-card"
            style={{ borderColor: cat.color }}
            {...longPressHandlers}
            onContextMenu={onContextMenu} // Keep native right click too
        >
            <div className="cat-color-indicator" style={{ backgroundColor: cat.color }}></div>
            <span className="cat-name">{cat.name}</span>
        </div>
    );
};

export default CollectionList;
