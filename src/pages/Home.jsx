import React, { useState, useEffect } from 'react';
import CalendarView from '../components/Calendar/CalendarView';
import CollectionSidebar from '../components/Collection/CollectionSidebar';
import CollectionDetail from '../components/Item/CollectionDetail';
import CollectionItemModal from '../components/Item/CollectionItemModal';
import Modal from '../components/UI/Modal';
import SchemaBuilder from '../components/Collection/SchemaBuilder';
import { categoryService } from '../services/categoryService';
import { itemService } from '../services/itemService'; // Import
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
    const { user } = useAuth();
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Main View Toggle State
    const [mainViewMode, setMainViewMode] = useState(() => localStorage.getItem('homeViewMode') || 'calendar');

    // Load Categories
    useEffect(() => {
        if (user?.uid) {
            loadCategories();
        }
    }, [user]);

    const loadCategories = async () => {
        if (!user?.uid) return;
        const data = await categoryService.getCategories(user.uid);
        setCategories(data);
    };

    // Persist View Mode
    const handleViewModeChange = (mode) => {
        setMainViewMode(mode);
        localStorage.setItem('homeViewMode', mode);
    };

    // Add/Edit Collection Modal State
    const [editingCategory, setEditingCategory] = useState(null);
    // Add Collection Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [modalStep, setModalStep] = useState(1); // 1: Info, 2: Schema
    const [newCollectionName, setNewCollectionName] = useState('');
    const [newCollectionColor, setNewCollectionColor] = useState('#3b82f6');
    const [newCollectionSchema, setNewCollectionSchema] = useState([]); // Array of { id, name, type }

    const handleDataChange = () => {
        // Just reload items if needed, or maybe categories too if items affect counts (not yet)
    };

    const handleEditCollection = (category) => {
        setEditingCategory(category);
        setNewCollectionName(category.name);
        setNewCollectionColor(category.color || '#3b82f6');
        setNewCollectionSchema(category.schema || []);
        setIsAddModalOpen(true);
    };

    const handleSaveCollection = async (e) => {
        e.preventDefault();
        if (!newCollectionName.trim() || !user?.uid) return;

        let updatedCategory;

        if (editingCategory) {
            // Update Existing - Optimistic
            updatedCategory = {
                ...editingCategory,
                name: newCollectionName,
                color: newCollectionColor,
                schema: newCollectionSchema,
                updatedAt: new Date()
            };

            console.log("Saving Collection:", updatedCategory);
            console.log("Current Selected:", selectedCategory);
            console.log("IDs Match:", selectedCategory?.id === editingCategory.id);

            // Update local categories list immediately
            setCategories(prev => prev.map(c => c.id === editingCategory.id ? updatedCategory : c));

            // Update selected category if it's the one being edited
            if (selectedCategory && selectedCategory.id === editingCategory.id) {
                console.log("Updating Selected Category State");
                setSelectedCategory(updatedCategory);
            } else {
                console.log("Skipping Selected Category Update");
            }

            // Sync to Backend
            await categoryService.updateCategory(editingCategory.id, {
                name: newCollectionName,
                color: newCollectionColor,
                schema: newCollectionSchema
            });

            await loadCategories(); // Force Sync

        } else {
            // Create New - Optimistic
            const newId = categoryService.getNewId();
            updatedCategory = {
                id: newId,
                userId: user.uid,
                name: newCollectionName,
                color: newCollectionColor,
                schema: newCollectionSchema,
                createdAt: new Date() // Temporary stamp
            };

            // Update local list
            setCategories(prev => [updatedCategory, ...prev]);

            // Sync to Backend
            await categoryService.addCategory(user.uid, {
                name: newCollectionName,
                color: newCollectionColor,
                schema: newCollectionSchema
            }, newId);
        }

        // Force reload from backend to ensure consistency
        await loadCategories();

        setIsAddModalOpen(false);
        setNewCollectionName('');
        setNewCollectionColor('#3b82f6');
        setNewCollectionSchema([]); // Reset schema
        setEditingCategory(null);
    };

    const handleDeleteCollection = async (catId) => {
        // Optimistic update
        setCategories(prev => prev.filter(c => c.id !== catId));
        if (selectedCategory && selectedCategory.id === catId) {
            setSelectedCategory(null);
        }
        await categoryService.deleteCategory(catId);
    };

    // Reset form when modal is closed manually
    const handleCloseModal = () => {
        setIsAddModalOpen(false);
        setNewCollectionName('');
        setNewCollectionColor('#3b82f6');
        setNewCollectionSchema([]);
        setEditingCategory(null);
    };

    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

    // --- QUICK ADD LOGIC (Global) ---
    const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
    const [quickAddDate, setQuickAddDate] = useState(null);
    const [isCollectionSelectModalOpen, setIsCollectionSelectModalOpen] = useState(false);
    const [quickAddTargetCategory, setQuickAddTargetCategory] = useState(null);

    const handleCalendarQuickAdd = (date) => {
        if (categories.length === 0) {
            alert("항목을 추가할 컬렉션이 없습니다. 먼저 새 컬렉션을 만들어주세요.");
            return;
        }

        setQuickAddDate(date);

        // Logic to determine target category
        // If user is actively looking at a collection
        if (activeCategory) {
            // If only 1 exists, use it.
            if (categories.length === 1) {
                setQuickAddTargetCategory(categories[0]);
                setIsQuickAddModalOpen(true);
            } else {
                // Multiple exist -> Ask user
                setIsCollectionSelectModalOpen(true);
            }
        } else {
            // If in Calendar view
            if (categories.length === 1) {
                setQuickAddTargetCategory(categories[0]);
                setIsQuickAddModalOpen(true);
            } else {
                // Multiple exist -> Ask user
                setIsCollectionSelectModalOpen(true);
            }
        }
    };

    const handleSelectCollectionForQuickAdd = (category) => {
        setQuickAddTargetCategory(category);
        setIsCollectionSelectModalOpen(false);
        setIsQuickAddModalOpen(true); // Open the Item Form
    };

    const handleQuickItemSave = async (itemPayload) => {
        if (!quickAddTargetCategory || !user?.uid) return;

        try {
            const newId = itemService.getNewId();
            await itemService.addItem(user.uid, {
                ...itemPayload,
                categoryId: quickAddTargetCategory.id
            }, newId);

            // Refresh items? 
            // If CategoryDetail is open for this category, it handles changes via onDataChange?
            // But we are outside. We might need to trigger a refresh if we are viewing the calendar.
            // Calendar loads items by date range. adding item with date should refresh calendar.
            // We need a refresh trigger for CalendarView.
            setCalendarRefreshTrigger(prev => prev + 1);

        } catch (error) {
            console.error("Quick Add Failed", error);
            alert("저장 실패");
        }
    };

    // Calendar Refresh Trigger
    const [calendarRefreshTrigger, setCalendarRefreshTrigger] = useState(0);

    // Fixed widths as per user request (Resize removed)
    const LEFT_SIDEBAR_WIDTH = 260;
    const COLLAPSED_SIDEBAR_WIDTH = 70; // Width when collapsed
    const RIGHT_PANEL_WIDTH = 500; // Increased default for better Calendar visibility

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Calculate current widths based on state
    const currentSidebarWidth = isSidebarCollapsed ? COLLAPSED_SIDEBAR_WIDTH : LEFT_SIDEBAR_WIDTH;

    // Derive activeCategory from selectedCategory state
    const activeCategory = selectedCategory;

    return (
        <div className="home-container">

            {/* Content Area with Side Panel */}
            <div className="home-content-wrapper" style={{ display: 'flex', width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>

                {/* MAIN VIEW AREA */}
                <div className="main-view-area" style={{ flex: '1', minWidth: '0', height: '100%', transition: 'all 0.3s' }}>
                    {mainViewMode === 'calendar' ? (
                        <div className="calendar-section full-height">
                            <CalendarView
                                refreshTrigger={calendarRefreshTrigger}
                                onQuickAdd={handleCalendarQuickAdd}
                            />
                        </div>
                    ) : (
                        <div className="bottom-split-view full-height">
                            {/* Fixed Left Sidebar with Dynamic Width */}
                            <div style={{
                                width: currentSidebarWidth,
                                minWidth: currentSidebarWidth,
                                position: 'relative',
                                height: '100%',
                                borderRight: '1px solid var(--border-color)',
                                transition: 'width 0.3s ease'
                            }}>
                                <CollectionSidebar
                                    categories={categories}
                                    selectedCategoryId={activeCategory?.id}
                                    onSelectCategory={(cat) => setSelectedCategory(cat)}
                                    // Pass Toggle state
                                    isCollapsed={isSidebarCollapsed}
                                    onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}

                                    onAddCollection={() => {
                                        setEditingCategory(null);
                                        setNewCollectionName('');
                                        setNewCollectionColor('#3b82f6');
                                        setNewCollectionSchema([]);
                                        setModalStep(1);
                                        setIsAddModalOpen(true);
                                    }}
                                    onEditCollection={(cat) => {
                                        handleEditCollection(cat);
                                        setModalStep(1);
                                    }}
                                    onDeleteCollection={handleDeleteCollection}
                                />
                            </div>

                            <div className="main-content-area" style={{ flex: 1, overflow: 'hidden', minWidth: 0, backgroundColor: 'var(--bg-color)' }}>
                                {activeCategory ? (
                                    <div className="collection-view" style={{ width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                        <div className="collection-header" style={{
                                            padding: '16px 24px',
                                            borderBottom: '1px solid var(--border-color)',
                                            backgroundColor: 'var(--card-bg)',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}>
                                            <h2 style={{ margin: 0, color: activeCategory.color }}>{activeCategory.name}</h2>
                                        </div>
                                        {/* Pass container ref or ensure Detail takes height */}
                                        <div style={{ flex: 1, overflow: 'hidden', backgroundColor: 'var(--bg-color)' }}>
                                            <CollectionDetail
                                                key={activeCategory.updatedAt ? activeCategory.updatedAt.toString() : activeCategory.id}
                                                category={activeCategory}
                                                onDataChange={handleDataChange}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="empty-state" style={{ color: 'var(--text-secondary)' }}>
                                        <p>컬렉션을 선택하여 내용을 확인하세요.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* HANDLE FOR SIDE PANEL */}
                <button
                    className={`side-panel-handle ${isSidePanelOpen ? 'open' : ''}`}
                    onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                    style={{ right: isSidePanelOpen ? `${RIGHT_PANEL_WIDTH}px` : '0' }}
                    title={isSidePanelOpen ? "패널 닫기" : "보조 패널 열기"}
                >
                    {isSidePanelOpen ? '→' : '←'}
                </button>

                {/* SIDE PANEL (COMPLEMENTARY VIEW) */}
                <div
                    className={`side-panel ${isSidePanelOpen ? 'open' : ''}`}
                    style={{
                        width: isSidePanelOpen ? `${RIGHT_PANEL_WIDTH}px` : '0',
                        opacity: isSidePanelOpen ? 1 : 0
                    }}
                >
                    {/* Scenario A: Main is Calendar -> Panel is Collection */}
                    {mainViewMode === 'calendar' && (
                        <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: '400px', backgroundColor: 'var(--bg-color)' }}>
                            <div className="panel-header" style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', color: 'var(--text-color)', backgroundColor: 'var(--card-bg)' }}>
                                데이터 목록
                            </div>
                            <div className="bottom-split-view full-height" style={{ borderRadius: 0 }}>
                                <CollectionSidebar
                                    categories={categories}
                                    selectedCategoryId={activeCategory?.id}
                                    onSelectCategory={(cat) => setSelectedCategory(cat)}
                                    // ... other props ...
                                    onAddCollection={() => { /* ... */ }}
                                    onEditCollection={() => { /* ... */ }}
                                    onDeleteCollection={handleDeleteCollection}
                                />
                                {activeCategory && (
                                    <div className="main-content-area" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, background: 'var(--bg-color)', display: activeCategory ? 'flex' : 'none' }}>
                                        <div className="collection-view" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                            <div className="collection-header" style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', backgroundColor: 'var(--card-bg)' }}>
                                                <button onClick={() => setSelectedCategory(null)} style={{ marginRight: '8px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-color)' }}>← 목록</button>
                                                <h2 style={{ color: activeCategory.color, fontSize: '1.2rem', margin: 0 }}>{activeCategory.name}</h2>
                                            </div>
                                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                                <CollectionDetail
                                                    key={activeCategory.updatedAt ? activeCategory.updatedAt.toString() : activeCategory.id}
                                                    category={activeCategory}
                                                    onDataChange={handleDataChange}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Scenario B: Main is Collection -> Panel is Calendar */}
                    {mainViewMode !== 'calendar' && (
                        <div className="panel-content" style={{ height: '100%', overflow: 'hidden', backgroundColor: 'var(--bg-color)' }}>
                            <div className="panel-header" style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', color: 'var(--text-color)', backgroundColor: 'var(--card-bg)' }}>
                                캘린더
                            </div>
                            <div style={{ height: 'calc(100% - 50px)', overflow: 'hidden' }}>
                                <CalendarView
                                    refreshTrigger={calendarRefreshTrigger}
                                    onQuickAdd={handleCalendarQuickAdd}
                                />
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* Quick Add Modal (Global) */}
            {quickAddTargetCategory && (
                <CollectionItemModal
                    isOpen={isQuickAddModalOpen}
                    onClose={() => setIsQuickAddModalOpen(false)}
                    category={quickAddTargetCategory}
                    onSave={handleQuickItemSave}
                    initialDate={quickAddDate}
                />
            )}

            {/* Collection Selection Modal */}
            <Modal
                isOpen={isCollectionSelectModalOpen}
                onClose={() => setIsCollectionSelectModalOpen(false)}
                title="어디에 추가할까요?"
            >
                <div className="collection-select-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => handleSelectCollectionForQuickAdd(cat)}
                            style={{
                                padding: '12px 16px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--card-bg)',
                                color: 'var(--text-color)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'var(--surface-color)'}
                            onMouseLeave={(e) => e.target.style.background = 'var(--card-bg)'}
                        >
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: cat.color }} />
                            <span style={{ fontSize: '1rem', fontWeight: '500' }}>{cat.name}</span>
                        </button>
                    ))}
                </div>
            </Modal>

            <Modal
                isOpen={isAddModalOpen}
                onClose={handleCloseModal}
                title={editingCategory ? "컬렉션 수정" : "새 컬렉션 만들기"}
            >
                <div className="wizard-container">
                    {/* Step Indicator */}
                    <div className="wizard-steps" style={{ display: 'flex', gap: '8px', marginBottom: '20px', padding: '0 4px' }}>
                        <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: modalStep >= 1 ? 'var(--primary-color)' : '#e5e7eb', transition: 'all 0.3s' }}></div>
                        <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: modalStep >= 2 ? 'var(--primary-color)' : '#e5e7eb', transition: 'all 0.3s' }}></div>
                    </div>

                    <form onSubmit={handleSaveCollection} className="add-cat-form">

                        {/* STEP 1: Basic Info */}
                        {modalStep === 1 && (
                            <div className="wizard-step-content user-select-none">
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px', color: 'var(--text-color)' }}>
                                    1. 기본 정보 입력
                                </h3>
                                <div className="form-group">
                                    <label>이름</label>
                                    <input
                                        type="text"
                                        placeholder="예: 프로젝트 A, 개인 일정"
                                        value={newCollectionName}
                                        onChange={(e) => setNewCollectionName(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group">
                                    <label>색상</label>
                                    <div className="color-picker-wrapper">
                                        <input
                                            type="color"
                                            value={newCollectionColor}
                                            onChange={(e) => setNewCollectionColor(e.target.value)}
                                        />
                                        <span>{newCollectionColor}</span>
                                    </div>
                                </div>

                                <div className="wizard-actions" style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        className="submit-btn"
                                        onClick={() => {
                                            if (newCollectionName.trim()) setModalStep(2);
                                        }}
                                        disabled={!newCollectionName.trim()}
                                        style={{ width: 'auto', padding: '10px 24px' }}
                                    >
                                        다음: 필드 설정 &gt;
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: Schema Builder */}
                        {modalStep === 2 && (
                            <div className="wizard-step-content">
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px', color: 'var(--text-color)' }}>
                                    2. 데이터 구조(필드) 설정
                                </h3>

                                {/* Schema Builder */}
                                <SchemaBuilder
                                    schema={newCollectionSchema}
                                    onChange={setNewCollectionSchema}
                                />

                                <div className="wizard-actions" style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                                    <button
                                        type="button"
                                        className="cancel-btn"
                                        onClick={() => setModalStep(1)}
                                        style={{ padding: '10px 20px' }}
                                    >
                                        &lt; 이전
                                    </button>
                                    <button type="submit" className="submit-btn" style={{ flex: 1 }}>
                                        {editingCategory ? "수정 완료" : "생성 완료"}
                                    </button>
                                </div>
                            </div>
                        )}

                    </form>
                </div>
            </Modal>
        </div>
    );
};

export default Home;
