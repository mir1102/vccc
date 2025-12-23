import React, { useState } from 'react';
import { Check, Trash2, Calendar, Clock, Edit2, Bell, Copy, Archive } from 'lucide-react';
import { format, addDays } from 'date-fns';
import ContextMenu from '../UI/ContextMenu';
import SimpleTimer from '../Tools/SimpleTimer';
import useLongPress from '../../hooks/useLongPress';
import './ItemList.css';

const ItemList = ({ items, viewMode, onItemToggle, onItemDelete, onItemEdit, onItemUpdate, selectionMode, selectedItems, onSelectItem }) => {
    const [contextMenu, setContextMenu] = useState(null);
    const [isTimerOpen, setIsTimerOpen] = useState(false);

    const handleContextMenu = (e, item) => {
        if (selectionMode) return; // Disable context menu in selection mode
        e.preventDefault();
        setContextMenu({
            x: e.pageX,
            y: e.pageY,
            item: item
        });
    };

    const handleCloseContextMenu = () => setContextMenu(null);

    // Action Logic
    const handleDoTomorrow = async (item) => {
        const tomorrow = addDays(new Date(), 1);
        await onItemUpdate(item.id, { date: tomorrow });
        alert("내일로 미루기 완료! 📅");
    };

    const handleSetReminder = async (item) => {
        const time = prompt("알림 시간을 입력하세요 (예: 14:00)");
        if (time) {
            await onItemUpdate(item.id, { reminderAt: time });
            alert(`${time}에 알림이 설정되었습니다.`);
        }
    };

    const handleArchive = async (item) => {
        if (confirm("보관함으로 이동하시겠습니까?")) {
            await onItemUpdate(item.id, { isArchived: true });
        }
    };

    const handleToggleRoutine = async (item) => {
        const isRoutine = !item.recurrence;
        await onItemUpdate(item.id, { recurrence: isRoutine ? 'daily' : null });
        alert(isRoutine ? "매일 반복 루틴으로 등록되었습니다. 🔄" : "루틴이 해제되었습니다.");
    };

    if (items.filter(i => !i.isArchived).length === 0) {
        return <div className="no-items">등록된 내용이 없습니다.</div>;
    }

    return (
        <div className={`items-container ${viewMode}`}>
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={handleCloseContextMenu}
                    actions={[
                        { label: '완료 토글', icon: <Check size={16} />, onClick: () => onItemToggle(contextMenu.item.id, !contextMenu.item.isCompleted) },
                        { label: '⏰ 시간 알림 설정', icon: <Bell size={16} />, onClick: () => handleSetReminder(contextMenu.item) },
                        { label: '⏱️ 타이머 열기', icon: <Clock size={16} />, onClick: () => setIsTimerOpen(true) },
                        { label: '📅 내일 하기', icon: <Calendar size={16} />, onClick: () => handleDoTomorrow(contextMenu.item) },
                        { label: '🔄 루틴 등록/해제', icon: <Copy size={16} />, onClick: () => handleToggleRoutine(contextMenu.item) },
                        { label: '📦 보관함으로 이동', icon: <Archive size={16} />, onClick: () => handleArchive(contextMenu.item) },
                        { label: '✏️ 수정', icon: <Edit2 size={16} />, onClick: () => onItemEdit(contextMenu.item) },
                        {
                            label: '삭제',
                            icon: <Trash2 size={16} />,
                            danger: true,
                            onClick: () => onItemDelete(contextMenu.item.id)
                        }
                    ]}
                />
            )}

            {/* Timer Modal */}
            <SimpleTimer
                isOpen={isTimerOpen}
                onClose={() => setIsTimerOpen(false)}
            />

            {items
                .filter(item => !item.isArchived)
                .map(item => (
                    <ItemCard
                        key={item.id}
                        item={item}
                        onContextMenu={(e) => handleContextMenu(e, item)}
                        onToggle={onItemToggle}
                        selectionMode={selectionMode}
                        isSelected={selectedItems?.has(item.id)}
                        onSelect={() => onSelectItem(item.id)}
                    />
                ))}
        </div>
    );
};

// Helper Component
const ItemCard = ({ item, onContextMenu, onToggle, selectionMode, isSelected, onSelect }) => {
    const { cancel, ...longPressHandlers } = useLongPress(
        (e) => {
            if (selectionMode) return; // Disable context menu in selection mode
            // Long Press Logic
            // ... (Same as before)
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
        () => {
            // Click Logic
            if (selectionMode) {
                onSelect();
            }
        },
        { delay: 500 }
    );

    return (
        <div
            className={`item-card ${item.isCompleted ? 'completed' : ''} ${isSelected ? 'selected' : ''}`}
            onContextMenu={!selectionMode ? onContextMenu : (e) => e.preventDefault()}
            onClick={() => selectionMode && onSelect()}
            {...longPressHandlers}
            style={isSelected ? { border: '2px solid #3b82f6', background: '#eff6ff' } : {}}
        >
            {selectionMode && (
                <div style={{ marginRight: '10px' }}>
                    <div style={{
                        width: '18px', height: '18px',
                        borderRadius: '4px', border: isSelected ? 'none' : '2px solid #ccc',
                        background: isSelected ? '#3b82f6' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        {isSelected && <Check size={12} color="white" />}
                    </div>
                </div>
            )}

            <div className="item-content-wrapper">
                <span className="item-text">{item.content}</span>
                {item.date && (
                    <div className="item-meta">
                        <Calendar size={12} />
                        <span>{format(item.date, 'MM.dd')}</span>
                        {(item.hasTime || (item.startTime && !item.isAllDay)) && (
                            <span style={{ marginLeft: '4px', fontWeight: '500' }}>
                                {item.startTime || format(item.date, 'HH:mm')}
                            </span>
                        )}
                        {item.reminderAt && (
                            <span style={{ marginLeft: '8px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <Bell size={10} /> {item.reminderAt}
                            </span>
                        )}
                        {item.recurrence && (
                            <span style={{ marginLeft: '8px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <Copy size={10} />매일
                            </span>
                        )}
                    </div>
                )}
            </div>

            {!selectionMode && (
                <div className="item-actions">
                    <button
                        className={`action-btn check ${item.isCompleted ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); onToggle(item.id, !item.isCompleted); }}
                    >
                        <Check size={16} />
                    </button>
                    {/* Delete button kept for quick access, or can rely on context menu */}
                </div>
            )}
        </div>
    );
};

export default ItemList;
