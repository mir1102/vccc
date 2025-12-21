import React, { useState, useEffect } from 'react';
import { Plus, LayoutGrid, List as ListIcon, MoreVertical } from 'lucide-react';
import { categoryService } from '../../services/categoryService';
import Modal from '../UI/Modal';
import './CategoryList.css';

import CategoryDetail from '../Item/CategoryDetail';

const CategoryList = ({ onDataChange }) => {
    const [categories, setCategories] = useState([]);
    const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null); // For detail view

    // Form State
    const [editingCategory, setEditingCategory] = useState(null); // If set, we are editing
    const [categoryName, setCategoryName] = useState('');
    const [categoryColor, setCategoryColor] = useState('#3b82f6');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Action Menu State
    const [activeMenuId, setActiveMenuId] = useState(null);

    // Mock User ID
    const userId = 'demo-user';

    useEffect(() => {
        loadCategories();
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveMenuId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const loadCategories = async () => {
        const data = await categoryService.getCategories(userId);
        if (data.length === 0) {
            setCategories([
                { id: '1', name: '업무', color: '#ef4444', createdAt: new Date() },
                { id: '2', name: '운동', color: '#22c55e', createdAt: new Date() },
                { id: '3', name: '취미', color: '#a855f7', createdAt: new Date() }
            ]);
        } else {
            setCategories(data);
        }
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
                await categoryService.addCategory(userId, {
                    name: categoryName,
                    color: categoryColor
                }, newId);
            } catch (error) {
                console.error("Failed to add category", error);
                alert("저장에 실패했습니다.");
                // Revert
                setCategories(prev => prev.filter(c => c.id !== newId));
            }
        }
    };

    const handleDeleteCategory = async (catId) => {
        if (!window.confirm("정말 이 카테고리를 삭제하시겠습니까?")) return;

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

    const openCategoryDetail = (category) => {
        setSelectedCategory(category);
    };

    return (
        <div className="category-list-container">
            <div className="category-header">
                <h3>카테고리 ({categories.length})</h3>
                <div className="category-actions">
                    <button
                        className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                    >
                        <ListIcon size={18} />
                    </button>
                    <button
                        className={`view-btn ${viewMode === 'card' ? 'active' : ''}`}
                        onClick={() => setViewMode('card')}
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button className="add-btn" onClick={openAddModal}>
                        <Plus size={18} />
                        <span>추가</span>
                    </button>
                </div>
            </div>

            <div className={`categories-grid ${viewMode}`}>
                {categories.map(cat => (
                    <div
                        key={cat.id}
                        className="category-card"
                        style={{ borderColor: cat.color }}
                        onClick={() => openCategoryDetail(cat)}
                    >
                        <div className="cat-color-indicator" style={{ backgroundColor: cat.color }}></div>
                        <span className="cat-name">{cat.name}</span>

                        <div className="cat-menu-wrapper">
                            <button className="cat-more" onClick={(e) => toggleMenu(e, cat.id)}>
                                <MoreVertical size={16} />
                            </button>

                            {activeMenuId === cat.id && (
                                <div className="cat-dropdown-menu">
                                    <button onClick={(e) => { e.stopPropagation(); openEditModal(cat); }}>수정</button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }} className="delete-opt">삭제</button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title={editingCategory ? "카테고리 수정" : "카테고리 추가"}
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

            {/* Category Detail Modal */}
            <Modal
                isOpen={!!selectedCategory}
                onClose={() => setSelectedCategory(null)}
                title={selectedCategory ? selectedCategory.name : ''}
            >
                {selectedCategory && (
                    <CategoryDetail
                        category={selectedCategory}
                        onDataChange={onDataChange}
                    />
                )}
            </Modal>
        </div>
    );
};

export default CategoryList;
