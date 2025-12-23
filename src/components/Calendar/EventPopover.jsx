import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlignLeft, Calendar, X, Check } from 'lucide-react';
import { format, addHours, setHours, setMinutes } from 'date-fns';
import './EventPopover.css';

const COLORS = [
    { id: 'blue', value: '#3b82f6', label: '업무' },
    { id: 'red', value: '#ef4444', label: '중요' },
    { id: 'green', value: '#10b981', label: '개인' },
    { id: 'yellow', value: '#f59e0b', label: '미팅' },
    { id: 'purple', value: '#8b5cf6', label: '기타' },
];

const EventPopover = ({ isOpen, onClose, onSave, anchorPosition, initialDate, initialData }) => {
    const popoverRef = useRef(null);
    const [title, setTitle] = useState('');
    const [isAllDay, setIsAllDay] = useState(false);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
    const [description, setDescription] = useState('');
    const [isDescOpen, setIsDescOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');

    // Generate 30-minute interval time options
    const timeOptions = [];
    for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        timeOptions.push(`${hour}:00`);
        timeOptions.push(`${hour}:30`);
    }

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Editing existing event
                setTitle(initialData.content || initialData.title || '');
                setSelectedDate(initialData.date ? format(new Date(initialData.date), 'yyyy-MM-dd') : '');
                setIsAllDay(initialData.isAllDay || false);
                setStartTime(initialData.startTime || '09:00');
                setEndTime(initialData.endTime || '10:00');
                setSelectedColor(initialData.color || COLORS[0].value);
                setDescription(initialData.description || '');
                setIsDescOpen(!!initialData.description);
            } else {
                // Creating new event
                setTitle('');
                const now = new Date();
                const initializedDate = initialDate ? format(initialDate, 'yyyy-MM-dd') : format(now, 'yyyy-MM-dd');
                setSelectedDate(initializedDate);

                // Smart defaults: Next hour
                const nextHour = now.getHours() + 1;
                const startStr = `${nextHour.toString().padStart(2, '0')}:00`;
                const endStr = `${(nextHour + 1).toString().padStart(2, '0')}:00`;

                setStartTime(startStr);
                setEndTime(endStr);
                setIsAllDay(false);
                setDescription('');
                setIsDescOpen(false);
                setSelectedColor(COLORS[0].value);
            }
        }
    }, [isOpen, initialDate, initialData]);

    const [openStart, setOpenStart] = useState(false);
    const [openEnd, setOpenEnd] = useState(false);
    const startRef = useRef(null);
    const endRef = useRef(null);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (startRef.current && !startRef.current.contains(event.target)) setOpenStart(false);
            if (endRef.current && !endRef.current.contains(event.target)) setOpenEnd(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const CustomSelect = ({ value, onChange, options, isOpen, setIsOpen, containerRef }) => (
        <div className="custom-time-select" ref={containerRef}>
            <div
                className={`select-trigger ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {value}
            </div>
            {isOpen && (
                <ul className="options-list">
                    {options.map((option) => (
                        <li
                            key={option}
                            className={`option-item ${value === option ? 'selected' : ''}`}
                            onClick={() => {
                                onChange(option);
                                setIsOpen(false);
                            }}
                        >
                            {option}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    // Overlay handles click outside now
    useEffect(() => {
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        onSave({
            title,
            date: new Date(selectedDate), // Use selectedDate
            isAllDay,
            startTime: isAllDay ? null : startTime,
            endTime: isAllDay ? null : endTime,
            color: selectedColor,
            description
        });
    };

    return (
        <div className="event-popover-overlay" onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}>
            <div className="event-popover" ref={popoverRef}>
                <div className="popover-close-wrapper" style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}>
                    {/* Optional: Add X button here if prefer absolute positioning, relying on title-section one for now */}
                </div>
                <form onSubmit={handleSubmit}>
                    {/* Header: Title */}
                    <div className="popover-section title-section">
                        <input
                            type="text"
                            placeholder="일정 제목을 입력하세요"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="title-input"
                            autoFocus
                        />
                        <button type="button" className="close-btn" onClick={onClose}><X size={18} /></button>
                    </div>

                    {/* Body: Time & Date */}
                    <div className="popover-section time-section">
                        <div className="date-display">
                            <Calendar size={14} />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="date-input"
                            />
                        </div>

                        <div className="time-row">
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={isAllDay}
                                    onChange={(e) => setIsAllDay(e.target.checked)}
                                />
                                <span className="slider round"></span>
                                <span className="label-text">종일</span>
                            </label>

                            {!isAllDay && (
                                <div className="time-inputs">
                                    <CustomSelect
                                        value={startTime}
                                        onChange={(val) => {
                                            setStartTime(val);
                                            const [h, m] = val.split(':').map(Number);
                                            const endH = (h + 1) % 24;
                                            setEndTime(`${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
                                        }}
                                        options={timeOptions}
                                        isOpen={openStart}
                                        setIsOpen={(val) => {
                                            setOpenStart(val);
                                            if (val) setOpenEnd(false);
                                        }}
                                        containerRef={startRef}
                                    />
                                    <span className="separator">→</span>
                                    <CustomSelect
                                        value={endTime}
                                        onChange={setEndTime}
                                        options={timeOptions}
                                        isOpen={openEnd}
                                        setIsOpen={(val) => {
                                            setOpenEnd(val);
                                            if (val) setOpenStart(false);
                                        }}
                                        containerRef={endRef}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Body: Color & Desc */}
                    <div className="popover-section details-section">
                        <div className="color-picker">
                            {COLORS.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    className={`color-chip ${selectedColor === c.value ? 'selected' : ''}`}
                                    style={{ backgroundColor: c.value }}
                                    onClick={() => setSelectedColor(c.value)}
                                    title={c.label}
                                >
                                    {selectedColor === c.value && <Check size={12} color="white" />}
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            className="desc-toggle-btn"
                            onClick={() => setIsDescOpen(!isDescOpen)}
                        >
                            <AlignLeft size={14} /> 설명 추가
                        </button>
                    </div>

                    {isDescOpen && (
                        <div className="popover-section desc-section">
                            <textarea
                                placeholder="메모를 입력하세요..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Footer: Actions */}
                    <div className="popover-footer">
                        <button type="button" className="cancel-btn" onClick={onClose}>취소</button>
                        <button type="submit" className="save-btn" disabled={!title.trim()}>저장</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventPopover;
