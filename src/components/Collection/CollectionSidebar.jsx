import React, { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight, Folder, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { categoryService } from '../../services/categoryService';
import useLongPress from '../../hooks/useLongPress';
import ContextMenu from '../UI/ContextMenu';
import Modal from '../UI/Modal';
import './CollectionSidebar.css';

const CollectionSidebar = ({ categories, selectedCategoryId, onSelectCategory, onAddCollection, onEditCollection, onDeleteCollection, isCollapsed, onToggle }) => {
    const { user } = useAuth();
    // Internal state moved to parent
    const [contextMenu, setContextMenu] = useState(null);

    // Context Menu Handlers
    const handleContextMenu = (e, category) => {
        e.preventDefault();
        setContextMenu({
            x: e.pageX,
            y: e.pageY,
            item: category
        });
    };

    const handleCloseContextMenu = () => setContextMenu(null);

    const handleDeleteCategory = (catId) => {
        if (window.confirm("정말 이 컬렉션을 삭제하시겠습니까? (포함된 모든 데이터가 삭제됩니다)")) {
            // Call parent handler
            if (onDeleteCollection) onDeleteCollection(catId);
        }
    };

    return (
        <div className={`category-sidebar ${isCollapsed ? 'collapsed' : ''}`}>

            <div className="sidebar-header">
                {!isCollapsed && <h3>Collections</h3>}
                <button
                    className="collapse-btn"
                    onClick={onToggle}
                    title={isCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
                >
                    {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            <div className="sidebar-content">
                {categories.map(cat => (
                    <SidebarItem
                        key={cat.id}
                        category={cat}
                        isSelected={selectedCategoryId === cat.id}
                        isCollapsed={isCollapsed}
                        onClick={() => onSelectCategory(cat)}
                        onContextMenu={(e) => handleContextMenu(e, cat)}
                    />
                ))}
            </div>

            <div className="sidebar-footer">
                <button className="add-collection-btn" onClick={onAddCollection}>
                    <Plus size={20} />
                    {!isCollapsed && <span>New Collection</span>}
                </button>
            </div>

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={handleCloseContextMenu}
                    actions={[
                        {
                            label: '수정',
                            icon: <Edit2 size={16} />,
                            onClick: () => {
                                onEditCollection(contextMenu.item);
                            }
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
        </div>
    );
};

const SidebarItem = ({ category, isSelected, isCollapsed, onClick, onContextMenu }) => {
    const longPressProps = useLongPress(
        (e) => {
            const fakeEvent = {
                preventDefault: () => { },
                pageX: (e.touches ? e.touches[0].clientX : e.clientX) + window.scrollX,
                pageY: (e.touches ? e.touches[0].clientY : e.clientY) + window.scrollY
            };
            onContextMenu(fakeEvent);
        },
        onClick,
        { shouldPreventDefault: false }
    );

    return (
        <div
            className={`sidebar-item ${isSelected ? 'selected' : ''}`}
            style={{ '--cat-color': category.color || '#ccc' }}
            {...longPressProps}
            onContextMenu={onContextMenu}
            title={category.name}
        >
            <div className="cat-icon">
                {/* Use Folder icon colored by category color */}
                <Folder size={20} color={category.color} fill={isSelected ? category.color : 'none'} />
            </div>
            {!isCollapsed && <span className="cat-name">{category.name}</span>}
        </div>
    );
};

export default CollectionSidebar;
