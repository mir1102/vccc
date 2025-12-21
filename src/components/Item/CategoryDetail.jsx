import React, { useState, useEffect } from 'react';
import { itemService } from '../../services/itemService';
import ItemList from './ItemList';
import ItemInput from './ItemInput';
import { ArrowLeft, LayoutGrid, List } from 'lucide-react';

// This component can be used inside a Modal or as a full page
const CategoryDetail = ({ category, onBack, onDataChange }) => {
    const [items, setItems] = useState([]);
    const [viewMode, setViewMode] = useState('list');
    const [isLoading, setIsLoading] = useState(true);

    const userId = 'demo-user'; // Replace later

    useEffect(() => {
        loadItems();
    }, [category.id]);

    const loadItems = async () => {
        setIsLoading(true);
        const data = await itemService.getItemsByCategory(userId, category.id);
        setItems(data);
        setIsLoading(false);
    };

    const handleAddItem = async (itemData) => {
        // 1. Generate ID
        const newId = itemService.getNewId();

        // 2. Prepare Optimistic Item
        const newItem = {
            id: newId,
            ...itemData,
            categoryId: category.id,
            createdAt: new Date()
        };

        // 3. Update UI Immediately
        setItems([newItem, ...items]);
        if (onDataChange) onDataChange();

        // 4. Background Sync
        try {
            await itemService.addItem(userId, {
                ...itemData,
                categoryId: category.id
            }, newId);
        } catch (error) {
            console.error("Failed to sync item", error);
            alert("저장에 실패했습니다.");
            // Revert
            setItems(prev => prev.filter(i => i.id !== newId));
            if (onDataChange) onDataChange();
        }
    };

    const handleToggleItem = async (itemId, isCompleted) => {
        // Optimistic update
        setItems(items.map(item =>
            item.id === itemId ? { ...item, isCompleted } : item
        ));
        await itemService.updateItem(itemId, { isCompleted });
        if (onDataChange) onDataChange();
    };

    const handleDeleteItem = async (itemId) => {
        if (window.confirm('정말 삭제하시겠습니까?')) {
            setItems(items.filter(item => item.id !== itemId));
            await itemService.deleteItem(itemId);
            if (onDataChange) onDataChange();
        }
    };

    return (
        <div className="category-detail">
            {/* Header logic might be handled by Modal, but adding internal nav just in case */}
            <div className="detail-controls" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <div className="view-toggles" style={{ display: 'flex', gap: '4px' }}>
                    <button
                        onClick={() => setViewMode('list')}
                        style={{ padding: '6px', opacity: viewMode === 'list' ? 1 : 0.4 }}
                    >
                        <List size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('card')}
                        style={{ padding: '6px', opacity: viewMode === 'card' ? 1 : 0.4 }}
                    >
                        <LayoutGrid size={20} />
                    </button>
                </div>
            </div>

            <ItemInput onAdd={handleAddItem} />

            {isLoading ? (
                <div>Loading...</div>
            ) : (
                <ItemList
                    items={items}
                    viewMode={viewMode}
                    onItemToggle={handleToggleItem}
                    onItemDelete={handleDeleteItem}
                />
            )}
        </div>
    );
};

export default CategoryDetail;
