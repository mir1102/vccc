import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { FileText, List, CheckSquare, Clock, Save, Loader, Tag, X } from 'lucide-react';
import ItemList from '../Item/ItemList';
import { itemService } from '../../services/itemService';
import { useAuth } from '../../context/AuthContext';
// ...
import { parseDateFromText } from '../../utils/dateParser';
import './DailyPage.css';

const DailyPageView = ({
    date,
    items = [],
    isDateSelected,
    onClearSelection,
    onRefresh,
    onQuickAddEvent,
    onQuickAddTodo,
    onItemToggle,
    onItemDelete,
    onItemEdit,
    onItemUpdate
}) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('schedule'); // separate views
    const [newTodoContent, setNewTodoContent] = useState('');
    const [newEventContent, setNewEventContent] = useState('');
    const [parsedPreview, setParsedPreview] = useState(null);


    // Filter items based on type
    const events = items.filter(item => item.type === 'event' || !item.type);
    const todos = items.filter(item => item.type === 'todo');

    const handleInputChange = (e) => {
        const text = e.target.value;
        setNewTodoContent(text);
        if (text.trim()) {
            const { parsedDate } = parseDateFromText(text, date);
            setParsedPreview(parsedDate || null);
        } else {
            setParsedPreview(null);
        }
    };

    const handleEventInputChange = (e) => {
        const text = e.target.value;
        setNewEventContent(text);
        if (text.trim()) {
            const { parsedDate } = parseDateFromText(text, date);
            setParsedPreview(parsedDate || null);
        } else {
            setParsedPreview(null);
        }
    };

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: 'none',
                background: activeTab === id ? 'var(--primary-color)' : 'transparent',
                color: activeTab === id ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex', alignItems: 'center', gap: '4px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
            }}
        >
            {Icon && <Icon size={14} />} {label}
        </button>
    );

    return (
        <div className="daily-page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-color)' }}>

            {/* Header */}
            <div className="daily-page-header" style={{
                padding: '10px 15px',
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--card-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>
                            {isDateSelected ? format(date, 'M월 d일') : `${format(date, 'M월')} 전체`}
                        </h3>
                        {/* 'View All' Button (X icon or Text) when specific date is selected */}
                        {isDateSelected && (
                            <button
                                onClick={onClearSelection}
                                title="전체 보기"
                                style={{
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-color)',
                                    color: 'var(--text-secondary)',
                                    borderRadius: '50%',
                                    width: '24px', height: '24px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer',
                                    padding: 0
                                }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="page-tabs" style={{ display: 'flex', gap: '5px', background: 'var(--bg-color)', padding: '4px', borderRadius: '6px' }}>
                        <TabButton id="schedule" label="일정" icon={Clock} />
                        <TabButton id="task" label="할 일" icon={CheckSquare} />
                    </div>
                </div>
            </div>

            {/* Content Area - SEPARATED VIEWS */}
            <div className="daily-page-content" style={{
                flex: 1,
                overflowY: 'auto',
                padding: '15px',
                position: 'relative'
            }}>

                {/* 1. SCHEDULE TAB */}
                {activeTab === 'schedule' && (
                    <div className="schedule-section">
                        {/* Inline Input for Event */}
                        <div className="inline-event-input-wrapper" style={{
                            position: 'relative',
                            marginBottom: '15px',
                            borderBottom: '2px solid var(--primary-color)',
                        }}>
                            <input
                                type="text"
                                placeholder="일정을 입력하세요 (e.g. 3시 회의)"
                                value={newEventContent}
                                onChange={handleEventInputChange}
                                onKeyDown={async (e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        if (!newEventContent.trim() || !user?.uid) return;

                                        const { cleanText, parsedDate, hasTime } = parseDateFromText(newEventContent, date);
                                        const finalDate = parsedDate || date;

                                        let startTime = null;
                                        let endTime = null;
                                        let isAllDay = true;

                                        if (hasTime) {
                                            isAllDay = false;
                                            startTime = format(finalDate, 'HH:mm');
                                            const endD = new Date(finalDate);
                                            endD.setHours(endD.getHours() + 1);
                                            endTime = format(endD, 'HH:mm');
                                        }

                                        try {
                                            await itemService.addItem(user.uid, {
                                                content: cleanText,
                                                date: finalDate,
                                                isCompleted: false,
                                                categoryId: null,
                                                type: 'event',
                                                isAllDay: isAllDay,
                                                startTime: startTime,
                                                endTime: endTime
                                            });
                                            setNewEventContent('');
                                            setParsedPreview(null);
                                            if (onRefresh) onRefresh();
                                        } catch (error) {
                                            console.error("Failed to add event", error);
                                        }
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    padding: '8px 40px 8px 4px',
                                    border: 'none',
                                    outline: 'none',
                                    fontSize: '14px',
                                    background: 'transparent',
                                    color: 'var(--text-color)'
                                }}
                            />
                            {/* Parse Preview Badge */}
                            {parsedPreview && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-24px',
                                    right: '0',
                                    fontSize: '11px',
                                    color: 'var(--primary-color)',
                                    fontWeight: '600',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    padding: '2px 6px',
                                    borderRadius: '4px'
                                }}>
                                    📅 {format(parsedPreview, 'd일 HH:mm')}
                                </div>
                            )}
                            <div style={{
                                position: 'absolute',
                                right: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                display: 'flex',
                                gap: '8px',
                                color: 'var(--text-tertiary)'
                            }}>
                                <Clock size={16} style={{ cursor: 'pointer' }} onClick={onQuickAddEvent} />
                            </div>
                        </div>

                        <div className="event-list-container" style={{ animation: 'slideDown 0.4s ease-out' }}>
                            <ItemList
                                items={events}
                                viewMode="list"
                                onItemToggle={onItemToggle}
                                onItemDelete={onItemDelete}
                                onItemEdit={onItemEdit}
                                onItemUpdate={onItemUpdate}
                            />
                            {events.length === 0 && <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', padding: '10px 0', textAlign: 'center' }}>등록된 일정이 없습니다.</div>}
                        </div>
                    </div>
                )}


                {/* 2. TASK TAB */}
                {activeTab === 'task' && (
                    <div className="task-section">
                        <div className="inline-todo-input-wrapper" style={{
                            position: 'relative',
                            marginBottom: '15px',
                            borderBottom: '2px solid var(--primary-color)',
                        }}>
                            <input
                                type="text"
                                placeholder="할 일을 입력하세요"
                                value={newTodoContent}
                                onChange={handleInputChange}
                                onKeyDown={async (e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        if (!newTodoContent.trim() || !user?.uid) return;

                                        const { cleanText, parsedDate, hasTime } = parseDateFromText(newTodoContent, date);
                                        const finalDate = parsedDate || date;

                                        try {
                                            await itemService.addItem(user.uid, {
                                                content: cleanText,
                                                date: finalDate,
                                                isCompleted: false,
                                                categoryId: null,
                                                type: 'todo',
                                                hasTime: hasTime
                                            });
                                            setNewTodoContent('');
                                            setParsedPreview(null);
                                            if (onRefresh) onRefresh();
                                        } catch (error) {
                                            console.error("Failed to add todo", error);
                                        }
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    padding: '8px 40px 8px 4px',
                                    border: 'none',
                                    outline: 'none',
                                    fontSize: '14px',
                                    background: 'transparent',
                                    color: 'var(--text-color)'
                                }}
                            />
                            <div style={{
                                position: 'absolute',
                                right: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                display: 'flex',
                                gap: '8px',
                                color: 'var(--text-tertiary)'
                            }}>
                                <Clock size={16} style={{ cursor: 'pointer' }} onClick={() => onQuickAddTodo && onQuickAddTodo()} />
                                <Tag size={16} style={{ cursor: 'pointer' }} onClick={() => onQuickAddTodo && onQuickAddTodo()} />
                            </div>
                        </div>

                        <div className="task-list-container" style={{ animation: 'slideDown 0.4s ease-out' }}>
                            <ItemList
                                items={todos}
                                viewMode="list"
                                onItemToggle={onItemToggle}
                                onItemDelete={onItemDelete}
                                onItemEdit={onItemEdit}
                                onItemUpdate={onItemUpdate}
                            />
                            {todos.length === 0 && <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', padding: '10px 0', textAlign: 'center' }}>등록된 할 일이 없습니다.</div>}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default DailyPageView;
