import React from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from 'date-fns';
import useLongPress from '../../hooks/useLongPress';

const CalendarCell = ({ day, monthStart, selectedDate, onDateClick, onDateContextMenu, hasEvents, hasMemo, dayIcon }) => {
    const longPressProps = useLongPress(
        (e) => {
            // Create a fake event for context menu if it came from touch
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            const fakeEvent = {
                preventDefault: () => { },
                pageX: clientX + window.scrollX,
                pageY: clientY + window.scrollY,
                day: day
            };
            // Call context menu handler with the fake event
            if (onDateContextMenu) onDateContextMenu(fakeEvent, day);
        },
        () => onDateClick(day),
        { shouldPreventDefault: false }
    );

    const formattedDate = format(day, "d");

    return (
        <div
            className={`col cell ${!isSameMonth(day, monthStart)
                ? "disabled"
                : isSameDay(day, selectedDate) ? "selected" : ""
                } ${isToday(day) ? "today" : ""}`}
            {...longPressProps}
            onContextMenu={(e) => onDateContextMenu && onDateContextMenu(e, day)}
        >
            <span className="number">{formattedDate}</span>
            <div className="indicators">
                {dayIcon && <span className="day-icon" style={{ fontSize: '12px' }}>{dayIcon}</span>}
                {hasMemo && !dayIcon && <span className="memo-dot">📝</span>}
                {hasEvents && <div className="dot"></div>}
            </div>
        </div>
    );
};

const MonthView = ({ currentDate, selectedDate, onDateClick, onDateContextMenu, events = [] }) => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

    while (day <= endDate) {
        for (let i = 0; i < 7; i++) {
            const cloneDay = day;
            const dayEvents = events.filter(e => e.date && isSameDay(new Date(e.date), day));

            // Check for various item types
            const hasRegularEvents = dayEvents.some(e => e.type !== 'memo' && e.type !== 'day_icon');
            const hasMemo = dayEvents.some(e => e.type === 'memo');
            const dayIconItem = dayEvents.find(e => e.type === 'day_icon');

            days.push(
                <CalendarCell
                    key={day.toString()}
                    day={cloneDay}
                    monthStart={monthStart}
                    selectedDate={selectedDate}
                    onDateClick={onDateClick}
                    onDateContextMenu={onDateContextMenu}
                    hasEvents={hasRegularEvents}
                    hasMemo={hasMemo}
                    dayIcon={dayIconItem ? dayIconItem.content : null}
                />
            );
            day = addDays(day, 1);
        }
        rows.push(
            <div className="row" key={day.toString()}>
                {days}
            </div>
        );
        days = [];
    }

    return (
        <div className="month-view">
            <div className="days row">
                {weekDays.map(d => <div className="col col-center" key={d}>{d}</div>)}
            </div>
            <div className="body">{rows}</div>
        </div>
    );
};

export default MonthView;
