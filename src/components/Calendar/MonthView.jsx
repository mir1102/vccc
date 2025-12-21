import React from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from 'date-fns';

const MonthView = ({ currentDate, selectedDate, onDateClick, events = [] }) => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    // Header (Days of week)
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

    while (day <= endDate) {
        for (let i = 0; i < 7; i++) {
            formattedDate = format(day, "d");
            const cloneDay = day;

            // Check for events
            const dayEvents = events.filter(e => e.date && isSameDay(new Date(e.date), day));
            const hasEvents = dayEvents.length > 0;

            days.push(
                <div
                    className={`col cell ${!isSameMonth(day, monthStart)
                            ? "disabled"
                            : isSameDay(day, selectedDate) ? "selected" : ""
                        } ${isToday(day) ? "today" : ""}`}
                    key={day}
                    onClick={() => onDateClick(cloneDay)}
                >
                    <span className="number">{formattedDate}</span>
                    {hasEvents && <div className="dot"></div>}
                </div>
            );
            day = addDays(day, 1);
        }
        rows.push(
            <div className="row" key={day}>
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
