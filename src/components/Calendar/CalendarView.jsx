import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, FileText, Check, ArrowRight, Tag, LayoutList, Clock } from 'lucide-react';
import MonthView from './MonthView';
import { itemService } from '../../services/itemService';
import ItemList from '../Item/ItemList';
import SimpleTimer from '../Tools/SimpleTimer'; // Import Timer
import ContextMenu from '../UI/ContextMenu';
import Modal from '../UI/Modal';
import './Calendar.css';

const CalendarView = ({ refreshTrigger, onQuickAdd }) => {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
    const [monthItems, setMonthItems] = useState([]);
    const [selectedDateItems, setSelectedDateItems] = useState([]);

    // Context Menu State
    const [contextMenu, setContextMenu] = useState(null);

    // Memo State
    const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
    const [memoContent, setMemoContent] = useState('');
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

    const handleContextMenu = (e, date) => {
        e.preventDefault();
        setContextMenu({
            x: e.pageX,
            y: e.pageY,
            date: date
        });
    };

    // --- Feature Handlers ---

    const openDayIconModal = (date) => {
        setDayIconDate(date);
        setContextMenu(null);
        setIsDayIconModalOpen(true);
    };

    const saveDayIcon = async (icon) => {
        if (!user?.uid || !dayIconDate) return;

        // Check if icon exists for date
        const existingIconItem = monthItems.find(item =>
            item.type === 'day_icon' && isSameDay(new Date(item.date), dayIconDate)
        );

        if (existingIconItem) {
            if (icon) {
                await itemService.updateItem(existingIconItem.id, { content: icon });
            } else {
                await itemService.deleteItem(existingIconItem.id);
            }
        } else if (icon) {
            await itemService.addItem(user.uid, {
                content: icon,
                date: dayIconDate,
                type: 'day_icon',
                isCompleted: false
            });
        }
        loadMonthItems();
        setIsDayIconModalOpen(false);
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

        // Find existing memo for this date
        // Assuming memo is an item with type 'memo'
        const existingMemo = monthItems.find(item =>
            item.type === 'memo' && isSameDay(new Date(item.date), date)
        );

        if (existingMemo) {
            setMemoContent(existingMemo.content);
            setCurrentMemoItem(existingMemo);
        } else {
            setMemoContent('');
            setCurrentMemoItem(null);
        }

        setContextMenu(null);
        setIsMemoModalOpen(true);
    };

    const saveMemo = async () => {
        if (!user?.uid || !memoDate) return;

        try {
            if (currentMemoItem) {
                // Update
                if (!memoContent.trim()) {
                    // Delete if empty
                    await itemService.deleteItem(currentMemoItem.id);
                } else {
                    await itemService.updateItem(currentMemoItem.id, { content: memoContent });
                }
            } else if (memoContent.trim()) {
                // Create New
                await itemService.addItem(user.uid, {
                    content: memoContent,
                    date: memoDate,
                    type: 'memo',
                    isCompleted: false
                });
            }
            loadMonthItems(); // Refresh calendar
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

    useEffect(() => {
        if (user?.uid) {
            loadMonthItems();
        }
    }, [currentDate, refreshTrigger, user]); // Reload when user changes

    useEffect(() => {
        const items = monthItems.filter(item =>
            item.date && isSameDay(new Date(item.date), selectedDate)
        );
        setSelectedDateItems(items);
    }, [selectedDate, monthItems]);

    const loadMonthItems = async () => {
        if (!user?.uid) return;
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        const data = await itemService.getItemsByDateRange(user.uid, start, end);
        setMonthItems(data);
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

    const handleToday = () => {
        const now = new Date();
        setCurrentDate(now);
        setSelectedDate(now);
    };

    const handleDateClick = (date) => {
        setSelectedDate(date);
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
                    />
                )}
                {viewMode === 'week' && <div className="placeholder-view">주간 보기 준비중</div>}
                {viewMode === 'day' && <div className="placeholder-view">일간 보기 준비중</div>}
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    actions={[
                        {
                            label: '📝 바로 항목 추가',
                            icon: <Check size={16} />,
                            onClick: () => {
                                // Logic for quick add 
                                if (onQuickAdd) onQuickAdd(contextMenu.date);
                            }
                        },
                        {
                            label: '📒 심플 메모 작성',
                            icon: <FileText size={16} />,
                            onClick: () => openMemoModal(contextMenu.date)
                        },
                        {
                            label: '🏷️ 데이 노트/아이콘',
                            icon: <Tag size={16} />,
                            onClick: () => openDayIconModal(contextMenu.date)
                        },
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
                            label: '➡️ 내일로 미루기',
                            icon: <ArrowRight size={16} />,
                            onClick: () => handlePostpone(contextMenu.date)
                        }
                    ]}
                />
            )}

            {/* Simple Memo Modal */}
            <Modal
                isOpen={isMemoModalOpen}
                onClose={() => setIsMemoModalOpen(false)}
                title={`${format(memoDate || new Date(), 'M월 d일')} 메모`}
            >
                <div className="memo-editor">
                    <textarea
                        value={memoContent}
                        onChange={(e) => setMemoContent(e.target.value)}
                        placeholder="이곳에 간단한 메모를 남겨보세요..."
                        style={{
                            width: '100%',
                            height: '150px',
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
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', gap: '8px' }}>
                        <button onClick={() => setIsMemoModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-color)', cursor: 'pointer' }}>취소</button>
                        <button onClick={saveMemo} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: 'var(--primary-color)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>저장</button>
                    </div>
                </div>
            </Modal>

            {/* Day Icon Modal */}
            <Modal
                isOpen={isDayIconModalOpen}
                onClose={() => setIsDayIconModalOpen(false)}
                title="데이 아이콘 설정"
            >
                <div className="day-icon-selector">
                    <p style={{ marginBottom: '10px', color: 'var(--text-secondary)' }}>이날의 기분이나 특별한 이벤트를 표시해보세요.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                        {['🎉', '📅', '✈️', '🤒', '💪', '🍺', '❤️', '⭐', '🍔', '💼'].map(icon => (
                            <button
                                key={icon}
                                onClick={() => saveDayIcon(icon)}
                                style={{
                                    fontSize: '24px',
                                    padding: '10px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    background: 'var(--card-bg)',
                                    cursor: 'pointer'
                                }}
                            >
                                {icon}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => saveDayIcon(null)} // Clear icon
                        style={{ marginTop: '15px', width: '100%', padding: '10px', background: 'var(--surface-color)', color: 'var(--text-color)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                    >
                        아이콘 삭제
                    </button>
                </div>
            </Modal>

            {/* Daily Summary Modal */}
            <Modal
                isOpen={isSummaryModalOpen}
                onClose={() => setIsSummaryModalOpen(false)}
                title={`${format(summaryDate || new Date(), 'M월 d일')} 요약`}
            >
                <div className="daily-summary-content">
                    {/* Reusing ItemList but in read-only or simple mode if possible, 
                        or just rendering the list manually for 'Summary' feeling */}
                    <ItemList
                        items={summaryItems}
                        viewMode="list"
                        onItemToggle={() => { }} // Read-only for summary? Or interactive? Let's keep interactive but in modal
                        onItemDelete={() => { }}
                    />
                    {summaryItems.length === 0 && <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>일정이 없습니다.</p>}
                </div>
            </Modal>

            {/* Timer for Focus Mode */}
            <SimpleTimer
                isOpen={isTimerOpen}
                onClose={() => setIsTimerOpen(false)}
                initialMinutes={25}
            />

            {/* Selected Date Agenda */}
            <div className="daily-agenda">
                <h4>{format(selectedDate, 'M월 d일')} 일정</h4>
                <ItemList
                    items={selectedDateItems}
                    viewMode="list"
                    onItemToggle={() => { }}
                    onItemDelete={() => { }}
                />
            </div>
        </div>
    );
};

export default CalendarView;
