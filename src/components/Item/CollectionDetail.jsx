import React, { useState, useEffect } from 'react';
import { itemService } from '../../services/itemService';
import { useAuth } from '../../context/AuthContext';
import ItemList from './ItemList';
import ItemInput from './ItemInput';
import DynamicTable from './DynamicTable'; // Import
import Modal from '../UI/Modal';
import CollectionItemModal from './CollectionItemModal'; // Import
import './ModalForm.css'; // New Styles
import { ArrowLeft, LayoutGrid, List, Plus, Upload, X as XIcon, Star } from 'lucide-react';

// This component can be used inside a Modal or as a full page
const CollectionDetail = ({ category, onBack, onDataChange }) => {
    console.log("CollectionDetail Rendered with:", category.name, category.schema);
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [viewMode, setViewMode] = useState('list');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user?.uid) {
            loadItems();
        }
    }, [category.id, user]);

    const loadItems = async () => {
        if (!user?.uid) return;
        setIsLoading(true);
        const data = await itemService.getItemsByCategory(user.uid, category.id);
        setItems(data);
        setIsLoading(false);
    };

    const handleAddItem = async (itemData) => { // itemData can be { content... } or { customValues... }
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
            if (user?.uid) {
                await itemService.addItem(user.uid, {
                    ...itemData,
                    categoryId: category.id
                }, newId);
            }
        } catch (error) {
            console.error("Failed to sync item", error);
            alert("저장에 실패했습니다.");
            // Revert
            setItems(prev => prev.filter(i => i.id !== newId));
            if (onDataChange) onDataChange();
        }
    };

    const handleUpdateItem = async (itemId, updates) => {
        // Optimistic update
        setItems(items.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
        ));
        // Background Sync
        try {
            await itemService.updateItem(itemId, updates);
        } catch (error) {
            console.error("Failed to update item", error);
        }
        if (onDataChange) onDataChange();
    };

    const handleToggleItem = async (itemId, isCompleted) => {
        handleUpdateItem(itemId, { isCompleted });
    };

    const handleDeleteItem = async (itemId) => {
        if (window.confirm('정말 삭제하시겠습니까?')) {
            setItems(items.filter(item => item.id !== itemId));
            await itemService.deleteItem(itemId);
            if (onDataChange) onDataChange();
        }
    };

    // Item Add Modal State
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);

    const handleModalSubmit = (itemData) => {
        handleAddItem(itemData);
        setIsAddItemModalOpen(false);
    };

    return (
        <div className="category-detail">
            {/* Modal for Adding Item */}
            {category.schema && (
                <CollectionItemModal
                    isOpen={isAddItemModalOpen}
                    onClose={() => setIsAddItemModalOpen(false)}
                    category={category}
                    onSave={handleModalSubmit}
                />
            )}

            {/* Header logic might be handled by Modal, but adding internal nav just in case */}
            {!category.schema && (
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
            )}

            {category.schema && category.schema.length > 0 ? (
                // Dynamic Table View for Custom Schema
                <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                        <button
                            onClick={() => setIsAddItemModalOpen(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                backgroundColor: 'var(--primary-color)',
                                color: '#ffffff', // Ensure text is readable on primary color
                                borderRadius: '6px',
                                border: 'none',
                                fontWeight: '500',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}
                        >
                            <Plus size={16} /> 새 항목 추가
                        </button>
                    </div>

                    {isLoading ? (
                        <div>Loading...</div>
                    ) : (
                        <DynamicTable
                            key={JSON.stringify(category.schema)}
                            schema={category.schema}
                            items={items}
                            onAddItem={handleAddItem}
                            onDeleteItem={handleDeleteItem}
                            onUpdateItem={handleUpdateItem}
                        />
                    )}
                </>
            ) : (
                // Standard List View
                <>
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
                </>
            )
            }
        </div >
    );
};

export default CollectionDetail;
