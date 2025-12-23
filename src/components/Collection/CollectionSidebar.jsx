import React, { useState, useEffect, useMemo } from 'react';
import { Plus, ChevronLeft, ChevronRight, Folder, Edit2, Trash2, ChevronDown, FolderPlus, ArrowUp, ArrowDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { categoryService } from '../../services/categoryService';
import useLongPress from '../../hooks/useLongPress';
import ContextMenu from '../UI/ContextMenu';
import './CollectionSidebar.css';

const CollectionSidebar = ({ categories, selectedCategoryId, onSelectCategory, onAddCollection, onEditCollection, onDeleteCollection, onReorderCollection, isCollapsed, onToggle }) => {
    const { user } = useAuth();
    const [contextMenu, setContextMenu] = useState(null);
    // Track expanded folders (set of IDs)
    const [expandedIds, setExpandedIds] = useState(new Set());

    // Drag and Drop State
    const [draggedId, setDraggedId] = useState(null);
    const [dropTarget, setDropTarget] = useState(null); // { id, position: 'above' | 'below' | 'inside' }


    // Auto-expand all folders by default when categories are loaded
    useEffect(() => {
        if (categories && categories.length > 0) {
            const allParentIds = new Set();
            categories.forEach(cat => {
                if (cat.parentId) {
                    allParentIds.add(cat.parentId);
                }
            });
            setExpandedIds(prev => {
                const next = new Set(prev);
                allParentIds.forEach(id => next.add(id));
                return next;
            });
        }
    }, [categories]);

    // Build hierarchy from flat array
    const treeData = useMemo(() => {
        const map = {};
        const roots = [];

        categories.forEach(cat => {
            map[cat.id] = { ...cat, children: [] };
        });

        categories.forEach(cat => {
            if (cat.parentId && map[cat.parentId]) {
                map[cat.parentId].children.push(map[cat.id]);
            } else {
                roots.push(map[cat.id]);
            }
        });

        const sortFn = (a, b) => {
            const orderA = a.order ?? 0;
            const orderB = b.order ?? 0;
            if (orderA !== orderB) return orderA - orderB;
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return dateB - dateA;
        };

        // Sort roots
        roots.sort(sortFn);
        // Sort children recursively
        Object.values(map).forEach(node => {
            if (node.children) node.children.sort(sortFn);
        });

        return roots;
    }, [categories]);

    const handleToggleExpand = (e, id) => {
        e.stopPropagation();
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

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
        if (window.confirm("정말 이 컬렉션을 삭제하시겠습니까? (포함된 모든 하위 데이터가 삭제됩니다)")) {
            if (onDeleteCollection) onDeleteCollection(catId);
        }
    };

    // Drag and Drop Handlers
    const handleDragStart = (e, id) => {
        setDraggedId(id);
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';

        // Timeout to allow the browser to create the drag ghost before we change the style
        setTimeout(() => {
            const el = document.querySelector(`[data-cat-id="${id}"]`);
            if (el) el.classList.add('dragging');
        }, 0);
    };

    const handleDragEnd = (e) => {
        setDraggedId(null);
        setDropTarget(null);
        document.querySelectorAll('.sidebar-item').forEach(el => {
            el.classList.remove('dragging', 'drop-target-above', 'drop-target-below', 'drop-target-inside');
        });
    };

    const handleDragOver = (e, targetId) => {
        e.preventDefault();
        if (draggedId === targetId) return;

        const draggedItem = categories.find(c => c.id === draggedId);
        const targetItem = categories.find(c => c.id === targetId);

        // Only allow dropping if they are siblings (same parentId)
        if (!draggedItem || !targetItem || (draggedItem.parentId || null) !== (targetItem.parentId || null)) {
            if (dropTarget) setDropTarget(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const height = rect.height;

        // 50/50 split for Above/Below
        const position = y < height / 2 ? 'above' : 'below';

        setDropTarget({ id: targetId, position });
    };

    const handleDrop = (e, targetId) => {
        e.preventDefault();
        // BUG FIX: Added dropTarget check and handleDragEnd as cleanup
        if (draggedId === targetId || !draggedId || !dropTarget) {
            handleDragEnd();
            return;
        }

        // Call reorder with detailed drop info
        if (onReorderCollection) {
            onReorderCollection(draggedId, dropTarget.id, dropTarget.position);
        }

        handleDragEnd();
    };

    // Recursive render function
    const renderItems = (items, level = 0) => {
        return items.map(cat => {
            const isExpanded = expandedIds.has(cat.id);
            const hasChildren = cat.children && cat.children.length > 0;
            const isDropTarget = dropTarget?.id === cat.id;

            return (
                <div key={cat.id} className="tree-node-wrapper">
                    <SidebarItem
                        category={cat}
                        isSelected={selectedCategoryId === cat.id}
                        isCollapsed={isCollapsed}
                        level={level}
                        hasChildren={hasChildren}
                        isExpanded={isExpanded}
                        isDragging={draggedId === cat.id}
                        dropPosition={isDropTarget ? dropTarget.position : null}
                        onToggleExpand={(e) => handleToggleExpand(e, cat.id)}
                        onClick={() => onSelectCategory(cat)}
                        onContextMenu={(e) => handleContextMenu(e, cat)}
                        // New DND props
                        onDragStart={(e) => handleDragStart(e, cat.id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, cat.id)}
                        onDrop={(e) => handleDrop(e, cat.id)}
                    />
                    {!isCollapsed && isExpanded && hasChildren && (
                        <div className="tree-children">
                            {renderItems(cat.children, level + 1)}
                        </div>
                    )}
                </div>
            );
        });
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
                {renderItems(treeData)}
            </div>

            <div className="sidebar-footer">
                <button className="add-collection-btn" onClick={() => onAddCollection(null)}>
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
                            label: '하위 컬렉션 추가',
                            icon: <FolderPlus size={16} />,
                            onClick: () => {
                                onAddCollection(contextMenu.item.id);
                                if (!expandedIds.has(contextMenu.item.id)) {
                                    handleToggleExpand({ stopPropagation: () => { } }, contextMenu.item.id);
                                }
                            }
                        },
                        {
                            label: '위로 이동',
                            icon: <ArrowUp size={16} />,
                            onClick: () => {
                                // Find sibling above
                                const current = contextMenu.item;
                                const parentId = current.parentId || null;
                                const siblings = categories
                                    .filter(c => (c.parentId || null) === parentId)
                                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                                const idx = siblings.findIndex(s => s.id === current.id);
                                if (idx > 0) {
                                    onReorderCollection(current.id, siblings[idx - 1].id, 'above');
                                }
                            }
                        },
                        {
                            label: '아래로 이동',
                            icon: <ArrowDown size={16} />,
                            onClick: () => {
                                // Find sibling below
                                const current = contextMenu.item;
                                const parentId = current.parentId || null;
                                const siblings = categories
                                    .filter(c => (c.parentId || null) === parentId)
                                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                                const idx = siblings.findIndex(s => s.id === current.id);
                                if (idx !== -1 && idx < siblings.length - 1) {
                                    onReorderCollection(current.id, siblings[idx + 1].id, 'below');
                                }
                            }
                        },
                        {
                            label: '수정',
                            icon: <Edit2 size={16} />,
                            onClick: () => onEditCollection(contextMenu.item)
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

const SidebarItem = ({
    category, isSelected, isCollapsed, level, hasChildren, isExpanded,
    isDragging, dropPosition, onToggleExpand, onClick, onContextMenu,
    onDragStart, onDragEnd, onDragOver, onDrop
}) => {
    const { cancel, ...longPressHandlers } = useLongPress(
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
            className={`sidebar-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${dropPosition ? `drop-target-${dropPosition}` : ''}`}
            data-cat-id={category.id}
            draggable={!isCollapsed}
            onDragStart={(e) => {
                // Cancel long press if drag starts
                if (cancel) cancel();
                onDragStart(e);
            }}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            onDragLeave={() => { }}
            onDrop={onDrop}
            style={{
                '--cat-color': category.color || '#ccc',
                paddingLeft: isCollapsed ? '0' : `${level * 16 + 12}px`
            }}
            onMouseDown={longPressHandlers.onMouseDown}
            onTouchStart={longPressHandlers.onTouchStart}
            onMouseUp={longPressHandlers.onMouseUp}
            onMouseLeave={longPressHandlers.onMouseLeave}
            onTouchEnd={longPressHandlers.onTouchEnd}
            onContextMenu={onContextMenu}
            title={category.name}
        >
            {!isCollapsed && (
                <div className="expand-chevron-wrapper" onClick={onToggleExpand}>
                    {hasChildren ? (
                        isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                    ) : (
                        <div style={{ width: 14 }} />
                    )}
                </div>
            )}
            <div className="cat-icon">
                <Folder size={18} color={category.color} fill={isSelected ? category.color : 'none'} />
            </div>
            {!isCollapsed && <span className="cat-name">{category.name}</span>}
        </div>
    );
};

export default CollectionSidebar;
