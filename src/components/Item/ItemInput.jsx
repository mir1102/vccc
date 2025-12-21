import React, { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import TimeSelector from '../UI/TimeSelector';
import './ItemInput.css';

const ItemInput = ({ onAdd, isSubmitting }) => {
    const [content, setContent] = useState('');
    const [showOptions, setShowOptions] = useState(false);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        onAdd({
            content,
            date: date ? new Date(date) : null,
            time: time || null,
            isCompleted: false
        });

        setContent('');
        setDate('');
        setTime('');
        setShowOptions(false);
    };

    return (
        <form className="item-input-form" onSubmit={handleSubmit}>
            <div className="input-row">
                <input
                    type="text"
                    className="main-input"
                    placeholder="새로운 할 일이나 메모를 입력하세요 (예: 10/26 미팅)"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onFocus={() => setShowOptions(true)}
                />
                <button type="submit" className="add-btn" disabled={!content.trim() || isSubmitting}>
                    등록
                </button>
            </div>

            {showOptions && (
                <div className="options-row">
                    <div className="option-group">
                        <Calendar size={16} />
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                    {date && (
                        <div className="option-group">
                            <Clock size={16} />
                            <TimeSelector
                                value={time || '12:00'}
                                onChange={(newTime) => setTime(newTime)}
                            />
                        </div>
                    )}
                </div >
            )}
        </form >
    );
};

export default ItemInput;
