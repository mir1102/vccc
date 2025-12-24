import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, FileText, Check, ArrowRight, Tag, LayoutList, Clock, Image, Link as LinkIcon, Globe, Trash2, Plus } from 'lucide-react';
import MonthView from './MonthView';
import { itemService } from '../../services/itemService';
import ItemList from '../Item/ItemList';
import SimpleTimer from '../Tools/SimpleTimer'; // Import Timer
import ContextMenu from '../UI/ContextMenu';
import Modal from '../UI/Modal';
import DailySummary from '../Tools/DailySummary';
import DailyPageView from './DailyPageView';
import EventPopover from './EventPopover';
import WeatherWidget from '../Tools/WeatherWidget';
import './Calendar.css';

// Simple Timezone Widget (Inlined to avoid module loading errors)
const TimezoneWidget = ({ baseDate = new Date() }) => {
    // Cities to show
    const cities = [
        { name: '서울 (Seoul)', zone: 'Asia/Seoul', flag: '🇰🇷' },
        { name: '런던 (London)', zone: 'Europe/London', flag: '🇬🇧' },
        { name: '뉴욕 (New York)', zone: 'America/New_York', flag: '🇺🇸' },
        { name: '파리 (Paris)', zone: 'Europe/Paris', flag: '🇫🇷' },
        { name: '도쿄 (Tokyo)', zone: 'Asia/Tokyo', flag: '🇯🇵' },
        { name: 'LA (Los Angeles)', zone: 'America/Los_Angeles', flag: '🇺🇸' },
    ];

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getTimeInZone = (date, zone) => {
        try {
            return new Intl.DateTimeFormat('ko-KR', {
                timeZone: zone,
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }).format(date);
        } catch (e) {
            return "Invalid Timezone";
        }
    };

    return (
        <div style={{ padding: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', padding: '10px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <Globe size={20} color="#3b82f6" />
                <span style={{ fontSize: '14px', color: '#1e40af', fontWeight: 'bold' }}>기준 시간: {format(baseDate, 'yyyy-MM-dd HH:mm')}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                {cities.map((city) => (
                    <div key={city.zone} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.2rem' }}>{city.flag}</span>
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-color)' }}>{city.name}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{city.zone}</div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#3b82f6' }}>
                            {getTimeInZone(baseDate, city.zone).split('. ').slice(3).join(':')}
                            {/* Getting just time part somewhat hacky with Intl */}
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                                {getTimeInZone(baseDate, city.zone).split('. ').slice(0, 3).join('-')}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CalendarView = ({ refreshTrigger }) => {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
    const [monthItems, setMonthItems] = useState([]);
    const [selectedDateItems, setSelectedDateItems] = useState([]);
    const [holidays, setHolidays] = useState({});

    // NEW: Selection State
    const [isDateSelected, setIsDateSelected] = useState(false); // Default: All Content

    // Context Menu State
    const [contextMenu, setContextMenu] = useState(null);

    // Event Add State (Popover)
    const [eventPopoverState, setEventPopoverState] = useState({
        isOpen: false,
        anchorPosition: null,
        date: null
    });

    // To-Do Add State
    const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
    const [newTodoContent, setNewTodoContent] = useState('');
    const [newTodoDate, setNewTodoDate] = useState(null);

    // Memo State
    const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
    const [memoContent, setMemoContent] = useState('');
    const [memoImage, setMemoImage] = useState('');
    const [memoLink, setMemoLink] = useState('');
    const [memoDate, setMemoDate] = useState(null);
    const [currentMemoItem, setCurrentMemoItem] = useState(null);

    // Day Icon State
    const [isDayIconModalOpen, setIsDayIconModalOpen] = useState(false);
    const [dayIconDate, setDayIconDate] = useState(null);

    // Daily Summary State
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    const [summaryDate, setSummaryDate] = useState(null);
    const [summaryItems, setSummaryItems] = useState([]);

    // Timer State
    const [isTimerOpen, setIsTimerOpen] = useState(false);

    // Utility Tools State
    const [isTimezoneModalOpen, setIsTimezoneModalOpen] = useState(false);
    const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);

    // Multi-Select State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState(new Set());

    // Load Holidays
    useEffect(() => {
        // Load holidays for current, prev, next months
        const y = currentDate.getFullYear();
        const m = currentDate.getMonth();
        // Simple optimization: just load for current year + next/prev logic if crossing years
        import('../../utils/holidays').then(({ getHolidays }) => {
            const h = getHolidays(y, m);
            setHolidays(h);
        });
    }, [currentDate]);

    const handleContextMenu = (e, date) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            x: e.pageX,
            y: e.pageY,
            date: date
        });
    };

    // --- Feature Handlers ---

    const openAddEventPopover = (date, anchorElementOrEvent) => {
        let position = { x: 0, y: 0 };

        if (anchorElementOrEvent && anchorElementOrEvent.clientX) {
            position = { x: anchorElementOrEvent.clientX, y: anchorElementOrEvent.clientY };
        } else if (anchorElementOrEvent && anchorElementOrEvent.getBoundingClientRect) {
            const rect = anchorElementOrEvent.getBoundingClientRect();
            position = { x: rect.left + rect.width, y: rect.top };
        } else {
            position = { x: window.innerWidth / 2 - 150, y: window.innerHeight / 2 - 200 };
        }

        setEventPopoverState({
            isOpen: true,
            anchorPosition: position,
            date: date
        });
        setContextMenu(null);
    };

    const openAddTodoModal = (date) => {
        setNewTodoDate(date);
        setNewTodoContent('');
        setContextMenu(null);
        setIsTodoModalOpen(true);
    };

    const saveTodo = async (e) => {
        e.preventDefault();
        if (!user?.uid || !newTodoContent.trim()) return;

        try {
            await itemService.addItem(user.uid, {
                content: newTodoContent,
                date: newTodoDate,
                isCompleted: false,
                categoryId: null,
                type: 'todo' // Explicit type
            });
            loadMonthItems();
            setIsTodoModalOpen(false);
            setNewTodoContent('');
        } catch (error) {
            console.error("Failed to add todo", error);
            alert("할 일 저장 실패");
        }
    };

    const saveEventFromPopover = async (eventData) => {
        if (!user?.uid || !eventData.title.trim()) return;

        try {
            const payload = {
                content: eventData.title, // Map title to content for backward compat
                date: eventData.date,
                isCompleted: false,
                categoryId: null,
                type: 'event',
                // New Fields
                isAllDay: eventData.isAllDay,
                startTime: eventData.startTime,
                endTime: eventData.endTime,
                color: eventData.color,
                description: eventData.description
            };

            if (eventPopoverState.itemId) {
                // Update existing
                await itemService.updateItem(eventPopoverState.itemId, payload);
            } else {
                // Create new
                await itemService.addItem(user.uid, payload);
            }

            loadMonthItems();
            setEventPopoverState(prev => ({ ...prev, isOpen: false, itemId: null, initialData: null }));
        } catch (error) {
            console.error("Failed to save event", error);
            alert("일정 저장 실패");
        }
    };

    const openDailySummary = (date) => {
        setSummaryDate(date);
        const items = monthItems.filter(item =>
            item.date && isSameDay(new Date(item.date), date) && item.type !== 'memo' && item.type !== 'day_icon'
        );
        setSummaryItems(items);
        setContextMenu(null);
        setIsSummaryModalOpen(true);
    };

    const startFocusForDay = (date) => {
        const items = monthItems.filter(item =>
            item.date && isSameDay(new Date(item.date), date) && !item.isCompleted && item.type !== 'memo' && item.type !== 'day_icon'
        );

        if (items.length > 0) {
            setIsTimerOpen(true); // Open timer
            setContextMenu(null);
            // Ideally pass task info to timer? For now acts as general focus
        } else {
            alert("집중할 할 일이 없습니다.");
            setContextMenu(null);
        }
    };

    const openMemoModal = async (date) => {
        setMemoDate(date);
        const existingMemo = monthItems.find(item =>
            item.type === 'memo' && isSameDay(new Date(item.date), date)
        );

        if (existingMemo) {
            setMemoContent(existingMemo.content || '');
            setMemoImage(existingMemo.image || ''); // Assume schema has image
            setMemoLink(existingMemo.link || '');   // Assume schema has link
            setCurrentMemoItem(existingMemo);
        } else {
            setMemoContent('');
            setMemoImage('');
            setMemoLink('');
            setCurrentMemoItem(null);
        }
        setContextMenu(null);
        setIsMemoModalOpen(true);
    };

    const handleMemoImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setMemoImage(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const saveMemo = async () => {
        if (!user?.uid || !memoDate) return;

        const payload = {
            content: memoContent,
            image: memoImage,
            link: memoLink,
            date: memoDate,
            type: 'memo',
            isCompleted: false,
            categoryId: null
        };

        try {
            if (currentMemoItem) {
                if (!memoContent && !memoImage && !memoLink) {
                    await itemService.deleteItem(currentMemoItem.id);
                } else {
                    await itemService.updateItem(currentMemoItem.id, payload);
                }
            } else if (memoContent || memoImage || memoLink) {
                await itemService.addItem(user.uid, payload);
            }
            loadMonthItems();
            setIsMemoModalOpen(false);
        } catch (error) {
            console.error("Failed to save memo", error);
        }
    };

    const handlePostpone = async (date) => {
        if (!confirm("해당 날짜의 미완료 항목을 모두 내일로 미루시겠습니까?")) return;
        setContextMenu(null);

        // Find incomplete items for the date (excluding memos)
        const itemsToPostpone = monthItems.filter(item =>
            isSameDay(new Date(item.date), date) &&
            !item.isCompleted &&
            item.type !== 'memo' && item.type !== 'day_icon'
        );

        if (itemsToPostpone.length === 0) {
            alert("미룰 항목이 없습니다.");
            return;
        }

        const nextDay = addDays(date, 1);

        // Batch update (simulated via Promise.all)
        await Promise.all(itemsToPostpone.map(item =>
            itemService.updateItem(item.id, { date: nextDay })
        ));

        loadMonthItems();
        alert(`${itemsToPostpone.length}개의 항목을 내일로 미뤘습니다.`);
    };

    // --- Multi-Select Handlers ---
    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedItems(new Set()); // Clear selection when toggling
    };

    const handleSelectItem = (itemId) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(itemId)) {
            newSet.delete(itemId);
        } else {
            newSet.add(itemId);
        }
        setSelectedItems(newSet);
    };

    const handleBulkDelete = async () => {
        if (selectedItems.size === 0) return;
        if (!confirm(`선택한 ${selectedItems.size}개의 항목을 삭제하시겠습니까?`)) return;

        const idsToDelete = Array.from(selectedItems);
        await Promise.all(idsToDelete.map(id => itemService.deleteItem(id)));

        loadMonthItems();
        setSelectedItems(new Set());
        setIsSelectionMode(false);
        alert("삭제되었습니다.");
    };

    const handleBulkPostpone = async () => {
        if (selectedItems.size === 0) return;
        if (!confirm(`선택한 ${selectedItems.size}개의 항목을 내일로 미루시겠습니까?`)) return;

        const nextDay = addDays(currentDate, 1); // Or addDays(selectedDate, 1) - usually postponing from selected view
        const targetDate = addDays(new Date(), 1);
        const idsToPostpone = Array.from(selectedItems);

        await Promise.all(idsToPostpone.map(id => itemService.updateItem(id, { date: targetDate })));

        loadMonthItems();
        setSelectedItems(new Set());
        setIsSelectionMode(false);
        alert("내일로 미뤄졌습니다.");
    };

    useEffect(() => {
        if (user?.uid) {
            loadMonthItems();
        }
    }, [currentDate, refreshTrigger, user]); // Reload when user changes

    // NEW: Effect for Selection Filtering
    useEffect(() => {
        // If date is explicitly selected, filter by that date.
        // Otherwise (isActiveSelection is false), show ALL items for the current view (monthItems).
        if (isDateSelected) {
            const items = monthItems.filter(item =>
                item.date && isSameDay(new Date(item.date), selectedDate)
            );
            setSelectedDateItems(items);
        } else {
            setSelectedDateItems(monthItems);
        }
    }, [selectedDate, monthItems, isDateSelected]);

    const loadMonthItems = async () => {
        if (!user?.uid) return;
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        const data = await itemService.getItemsByDateRange(user.uid, start, end);

        // DECOUPLING: Only show items that do NOT belong to a collection (categoryId is null/undefined)
        const standaloneItems = data.filter(item => !item.categoryId);

        setMonthItems(standaloneItems);
    };

    const handlePrev = () => {
        if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
        else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
        else setCurrentDate(subDays(currentDate, 1));
    };

    const handleNext = () => {
        if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
        else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
        else setCurrentDate(addDays(currentDate, 1));
    };

    // UPDATED: Handle Today
    const handleToday = () => {
        const now = new Date();
        setCurrentDate(now);
        setSelectedDate(now);
        setIsDateSelected(true); // Explicitly select Today
    };

    // UPDATED: Handle Date Click (Toggle)
    const handleDateClick = (date) => {
        if (selectedDate && isSameDay(date, selectedDate) && isDateSelected) {
            // If clicking already selected date, toggle OFF to show All
            setIsDateSelected(false);
        } else {
            setSelectedDate(date);
            setIsDateSelected(true);
        }
    };

    const dateFormat = viewMode === 'month' ? 'yyyy년 MM월' :
        viewMode === 'week' ? 'yyyy년 MM월 (w주차)' : 'yyyy년 MM월 dd일';

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <div className="calendar-title">
                    <span className="current-date">{format(currentDate, dateFormat)}</span>
                </div>
                <div className="calendar-controls">
                    <button onClick={handlePrev}><ChevronLeft size={20} /></button>
                    <button onClick={handleToday} className="today-btn">오늘</button>
                    <button onClick={handleNext}><ChevronRight size={20} /></button>
                </div>
            </div>

            <div className="view-mode-selector">
                <button
                    className={viewMode === 'month' ? 'active' : ''}
                    onClick={() => setViewMode('month')}>월</button>
                <button
                    className={viewMode === 'week' ? 'active' : ''}
                    onClick={() => setViewMode('week')}>주</button>
                <button
                    className={viewMode === 'day' ? 'active' : ''}
                    onClick={() => setViewMode('day')}>일</button>
            </div>

            <div className="calendar-body">
                {viewMode === 'month' && (
                    <MonthView
                        currentDate={currentDate}
                        selectedDate={selectedDate}
                        onDateClick={handleDateClick}
                        onDateContextMenu={handleContextMenu}
                        events={monthItems}
                        holidays={holidays}
                    />
                )}
                {viewMode === 'week' && <div className="placeholder-view">주간 보기 준비중</div>}
                {viewMode === 'day' && <div className="placeholder-view">일간 보기 준비중</div>}
            </div>

            {/* Context Menu */}
            {contextMenu && (() => {
                // Dynamic Menu Generation
                const selectedDateStr = format(contextMenu.date, 'yyyy-MM-dd');
                const dayMemo = monthItems.find(item =>
                    item.type === 'memo' &&
                    format(new Date(item.date), 'yyyy-MM-dd') === selectedDateStr
                );

                const actions = [
                    {
                        label: '📅 새 일정 만들기 (Event)',
                        icon: <Clock size={16} />,
                        onClick: () => openAddEventPopover(contextMenu.date)
                    },
                    {
                        label: '☑️ 새 할 일 추가 (To-Do)',
                        icon: <Check size={16} />,
                        onClick: () => openAddTodoModal(contextMenu.date)
                    }
                ];

                if (dayMemo) {
                    actions.push({
                        label: '📝 메모 수정',
                        icon: <FileText size={16} />,
                        onClick: () => openMemoModal(contextMenu.date)
                    });
                    actions.push({
                        label: '🗑️ 메모 삭제',
                        icon: <Trash2 size={16} color="#ef4444" />,
                        onClick: async () => {
                            if (confirm('메모를 정말 삭제하시겠습니까?')) {
                                await itemService.deleteItem(dayMemo.id);
                                loadMonthItems();
                                setContextMenu(null);
                            }
                        }
                    });
                } else {
                    actions.push({
                        label: '📒 심플 메모 작성',
                        icon: <FileText size={16} />,
                        onClick: () => openMemoModal(contextMenu.date)
                    });
                }

                actions.push(
                    {
                        label: '📄 일일 요약 보기',
                        icon: <LayoutList size={16} />,
                        onClick: () => openDailySummary(contextMenu.date)
                    },
                    {
                        label: '✨ 집중 타이머 시작',
                        icon: <Clock size={16} />,
                        onClick: () => startFocusForDay(contextMenu.date)
                    },
                    {
                        label: '🌍 타임존 변환기',
                        icon: <Globe size={16} />,
                        onClick: () => { setContextMenu(null); setIsTimezoneModalOpen(true); }
                    },
                    {
                        label: '🌤️ 날씨 확인',
                        icon: <div style={{ fontSize: '14px' }}>☁️</div>,
                        onClick: () => { setContextMenu(null); setIsWeatherModalOpen(true); }
                    },
                    {
                        label: '➡️ 내일로 미루기',
                        icon: <ArrowRight size={16} />,
                        onClick: () => handlePostpone(contextMenu.date)
                    }
                );

                return (
                    <ContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        onClose={() => setContextMenu(null)}
                        actions={actions}
                    />
                );
            })()}

            {/* Event Popover */}
            <EventPopover
                isOpen={eventPopoverState.isOpen}
                onClose={() => setEventPopoverState(prev => ({ ...prev, isOpen: false, itemId: null, initialData: null }))}
                onSave={saveEventFromPopover}
                anchorPosition={eventPopoverState.anchorPosition}
                initialDate={eventPopoverState.date}
                initialData={eventPopoverState.initialData}
                itemId={eventPopoverState.itemId}
            />

            {/* Add To-Do Modal (Checklist) */}
            <Modal
                isOpen={isTodoModalOpen}
                onClose={() => setIsTodoModalOpen(false)}
                title="새 할 일 추가 (To-Do)"
            >
                <form onSubmit={saveTodo} className="add-cat-form">
                    <div className="form-group">
                        <label>할 일</label>
                        <input
                            type="text"
                            placeholder="예: 우유 사기, 보고서 작성"
                            value={newTodoContent}
                            onChange={(e) => setNewTodoContent(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <button type="submit" className="submit-btn" style={{ backgroundColor: '#10b981' }}>추가하기</button>
                </form>
            </Modal>

            {/* Simple Memo Modal */}
            <Modal
                isOpen={isMemoModalOpen}
                onClose={() => setIsMemoModalOpen(false)}
                title={`${format(memoDate || new Date(), 'M월 d일')} 메모`}
            >
                <div className="memo-editor" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <textarea
                        value={memoContent}
                        onChange={(e) => setMemoContent(e.target.value)}
                        placeholder="이곳에 간단한 메모를 남겨보세요..."
                        style={{
                            width: '100%',
                            height: '120px',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-color)',
                            color: 'var(--text-color)',
                            resize: 'none',
                            fontSize: '1rem',
                            fontFamily: 'inherit'
                        }}
                        autoFocus
                    />

                    {/* Image Upload */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label htmlFor="memo-image-upload" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                            <Image size={16} /> <span>이미지 추가</span>
                        </label>
                        <input id="memo-image-upload" type="file" accept="image/*" onChange={handleMemoImageChange} style={{ display: 'none' }} />
                        {memoImage && <span style={{ fontSize: '12px', color: '#10b981' }}>이미지 선택됨</span>}
                    </div>
                    {memoImage && <img src={memoImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', objectFit: 'contain' }} />}

                    {/* Link Input */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0 8px' }}>
                        <LinkIcon size={16} color="var(--text-secondary)" />
                        <input
                            type="text"
                            placeholder="링크 주소 입력 (http://...)"
                            value={memoLink}
                            onChange={(e) => setMemoLink(e.target.value)}
                            style={{ flex: 1, padding: '8px 0', border: 'none', background: 'transparent', color: 'var(--text-color)' }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', gap: '8px' }}>
                        <button onClick={() => setIsMemoModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-color)', cursor: 'pointer' }}>취소</button>
                        <button onClick={saveMemo} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: 'var(--primary-color)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>저장</button>
                    </div>
                </div>
            </Modal >

            {/* Daily Summary Modal */}
            <Modal
                isOpen={isSummaryModalOpen}
                onClose={() => setIsSummaryModalOpen(false)}
                title={`${format(summaryDate || new Date(), 'M월 d일')} 요약`}
            >
                {summaryDate && (
                    <DailySummary
                        date={summaryDate}
                        items={summaryItems}
                        memo={monthItems.find(item => item.type === 'memo' && isSameDay(new Date(item.date), summaryDate))}
                    />
                )}
            </Modal>
            {/* Timer for Focus Mode */}
            <SimpleTimer
                isOpen={isTimerOpen}
                onClose={() => setIsTimerOpen(false)}
                initialMinutes={25}
            />

            {/* Timezone Converter Modal */}
            <Modal
                isOpen={isTimezoneModalOpen}
                onClose={() => setIsTimezoneModalOpen(false)}
                title="🌍 세계 시간 변환기"
            >
                <TimezoneWidget />
            </Modal>

            {/* Weather Widget Modal */}
            <Modal
                isOpen={isWeatherModalOpen}
                onClose={() => setIsWeatherModalOpen(false)}
                title="🌤️ 날씨 예보"
            >
                <WeatherWidget />
            </Modal>

            {/* Selected Date Agenda (Replaced with Daily Page) */}
            <div className="daily-agenda" style={{
                padding: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                flex: 1
            }}>
                <DailyPageView
                    date={selectedDate} // Always pass selectedDate (or current date if none), but view depends on isDateSelected
                    isDateSelected={isDateSelected} // NEW PROP
                    onClearSelection={() => setIsDateSelected(false)} // Clear selection handler
                    items={selectedDateItems} // Will contain ALL items if !isDateSelected
                    onRefresh={loadMonthItems}
                    onQuickAddEvent={(e) => openAddEventPopover(selectedDate, e)}
                    onQuickAddTodo={() => openAddTodoModal(selectedDate)}
                    onItemToggle={async (id, status) => {
                        await itemService.updateItem(id, { isCompleted: status });
                        loadMonthItems();
                    }}
                    onItemDelete={async (id) => {
                        if (confirm("삭제하시겠습니까?")) {
                            await itemService.deleteItem(id);
                            loadMonthItems();
                        }
                    }}
                    onItemEdit={(item, e_optional) => {
                        if (item.type === 'event') {
                            setEventPopoverState({
                                isOpen: true,
                                anchorPosition: null,
                                date: new Date(item.date),
                                initialData: item,
                                itemId: item.id
                            });
                        } else if (item.type === 'todo') {
                            setNewTodoContent(item.content);
                            setNewTodoDate(new Date(item.date));
                            setIsTodoModalOpen(true);
                        } else if (item.type === 'memo') {
                            openMemoModal(new Date(item.date));
                        }
                    }}
                    onItemUpdate={async (id, data) => {
                        await itemService.updateItem(id, data);
                        loadMonthItems();
                    }}
                />
            </div>
        </div>
    );
};

export default CalendarView;
