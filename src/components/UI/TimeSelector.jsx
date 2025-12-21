import React, { useEffect, useState } from 'react';
import './TimeSelector.css';

const TimeSelector = ({ value, onChange }) => {
    // Value format: "HH:mm" (24-hour)
    // Internal state for dropdowns
    const [ampm, setAmpm] = useState('AM');
    const [hour, setHour] = useState('12');
    const [minute, setMinute] = useState('00');

    // Initialize from value prop
    useEffect(() => {
        if (value) {
            const [h, m] = value.split(':').map(Number);
            if (h >= 12) {
                setAmpm('PM');
                setHour(h === 12 ? '12' : (h - 12).toString());
            } else {
                setAmpm('AM');
                setHour(h === 0 ? '12' : h.toString());
            }
            setMinute(m.toString().padStart(2, '0'));
        }
    }, []); // Only on mount/change handled internally mostly, but technically should watch value if controlled externally strictly.
    // For this use case, we push changes UP, so internal state drives.

    const handleChange = (newAmpm, newHour, newMinute) => {
        setAmpm(newAmpm);
        setHour(newHour);
        setMinute(newMinute);

        // Convert back to 24h format for parent"HH:mm"
        let h = parseInt(newHour, 10);
        if (newAmpm === 'PM' && h !== 12) h += 12;
        if (newAmpm === 'AM' && h === 12) h = 0;

        const hStr = h.toString().padStart(2, '0');
        const mStr = newMinute.toString().padStart(2, '0');
        onChange(`${hStr}:${mStr}`);
    };

    // Generate options
    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
    const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0')); // 5 min intervals

    return (
        <div className="time-selector">
            <select
                value={ampm}
                onChange={(e) => handleChange(e.target.value, hour, minute)}
                className="time-select ampm"
            >
                <option value="AM">오전</option>
                <option value="PM">오후</option>
            </select>
            <span className="time-sep">:</span>
            <select
                value={hour}
                onChange={(e) => handleChange(ampm, e.target.value, minute)}
                className="time-select"
            >
                {hours.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <span className="time-sep">:</span>
            <select
                value={minute}
                onChange={(e) => handleChange(ampm, hour, e.target.value)}
                className="time-select"
            >
                {minutes.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
        </div>
    );
};

export default TimeSelector;
