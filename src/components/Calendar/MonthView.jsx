import React from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from 'date-fns';
import useLongPress from '../../hooks/useLongPress';

const CalendarCell = ({ day, monthStart, selectedDate, onDateClick, onDateContextMenu, events = [], hasMemo, holidayName }) => {
    const { cancel, ...longPressHandlers } = useLongPress(
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
    const isHoliday = !!holidayName;
    const isSunday = day.getDay() === 0;

    // Filter Items by type
    const dateEvents = events.filter(e => !e.type || e.type === 'event');
    const dateTodos = events.filter(e => e.type === 'todo');

    return (
        <div
            className={`col cell ${!isSameMonth(day, monthStart)
                ? "disabled"
                : isSameDay(day, selectedDate) ? "selected" : ""
                } ${isToday(day) ? "today" : ""}`}
            {...longPressHandlers}
            onContextMenu={(e) => onDateContextMenu && onDateContextMenu(e, day)}
        >
            <span className={`number ${(isHoliday || isSunday) ? 'holiday' : ''}`} style={{ color: (isHoliday || isSunday) ? '#ef4444' : undefined }}>
                {formattedDate}
            </span>
            {/* Indicators as Dots Only */}
            <div className="indicators-container" style={{ display: 'flex', justifyContent: 'center', gap: '3px', marginTop: '2px', flexWrap: 'wrap', maxWidth: '30px' }}>
                {/* Events: Blue Dots */}
                {dateEvents.slice(0, 3).map((ev, i) => (
                    <div key={`ev-${i}`} className="indicator-dot event-dot" style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                ))}

                {/* Todos: Green Dots */}
                {dateTodos.slice(0, 3).map((todo, i) => (
                    <div key={`todo-${i}`} className="indicator-dot todo-dot" style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                ))}

                {/* Memo: Gray Dot (Only one needed if present) */}
                {hasMemo && (
                    <div className="indicator-dot memo-dot" style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#9ca3af' }} />
                )}

                {/* Overflow (if too many) */}
                {(dateEvents.length + dateTodos.length > 4) && (
                    <div className="indicator-dot" style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#d1d5db' }} />
                )}
            </div>

            {/* Remove old indicators div */}
        </div>
    );
};

const MonthView = ({ currentDate, selectedDate, onDateClick, onDateContextMenu, events = [], holidays = {} }) => {
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

            // Holidays check
            // holidays keys are YYYY-MM-DD
            // We need local date string to match keys
            const offset = cloneDay.getTimezoneOffset() * 60000;
            const localDateStr = (new Date(cloneDay - offset)).toISOString().slice(0, 10);
            const holidayName = holidays[localDateStr];

            // Check for various item types
            const hasMemo = dayEvents.some(e => e.type === 'memo');

            days.push(
                <CalendarCell
                    key={day.toString()}
                    day={cloneDay}
                    monthStart={monthStart}
                    selectedDate={selectedDate}
                    onDateClick={onDateClick}
                    onDateContextMenu={onDateContextMenu}
                    events={dayEvents} // Pass ALL events for the day to let cell render them
                    hasMemo={hasMemo}
                    holidayName={holidayName}
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
                {weekDays.map((d, i) => (
                    <div className="col col-center" key={d} style={{ color: i === 0 ? '#ef4444' : undefined }}>
                        {d}
                    </div>
                ))}
            </div>
            <div className="body">{rows}</div>
        </div>
    );
};

export default MonthView;
