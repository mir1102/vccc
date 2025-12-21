import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import MonthView from './MonthView';
import { itemService } from '../../services/itemService';
import ItemList from '../Item/ItemList';
import './Calendar.css';

const CalendarView = ({ refreshTrigger }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
    const [monthItems, setMonthItems] = useState([]);
    const [selectedDateItems, setSelectedDateItems] = useState([]);

    const userId = 'demo-user';

    useEffect(() => {
        loadMonthItems();
    }, [currentDate, refreshTrigger]);

    useEffect(() => {
        // Filter items for selected date from the month items (or fetch specifically if needed)
        // Since we fetching by range, we might have them. 
        // Note: simplified logic here. Real apps might fetch precise ranges.
        const items = monthItems.filter(item =>
            item.date && isSameDay(new Date(item.date), selectedDate)
        );
        setSelectedDateItems(items);
    }, [selectedDate, monthItems]);

    const loadMonthItems = async () => {
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        // Ensure we cover the full grid visibility (often starts before 1st)
        // For simplicity, just fetching wide enough or just month
        const data = await itemService.getItemsByDateRange(userId, start, end);
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
        // If clicking a date in another month, switch to that month?
        // setCurrentDate(date); // Optional depending on UX
    };

    const dateFormat = viewMode === 'month' ? 'yyyy년 MM월' :
        viewMode === 'week' ? 'yyyy년 MM월 W주' : 'yyyy년 MM월 dd일';

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
                        events={monthItems}
                    />
                )}
                {viewMode === 'week' && <div className="placeholder-view">주간 보기 준비중</div>}
                {viewMode === 'day' && <div className="placeholder-view">일간 보기 준비중</div>}
            </div>

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
