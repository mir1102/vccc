import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, X } from 'lucide-react';
import Modal from '../UI/Modal';

const SimpleTimer = ({ isOpen, onClose, initialMinutes = 25 }) => {
    const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState('focus'); // focus | break

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(timeLeft - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            if (Notification.permission === 'granted') {
                new Notification("타이머 종료!", { body: "설정하신 시간이 다 되었습니다." });
            } else {
                alert("딩동! 시간이 다 되었습니다. ⏰");
            }
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(initialMinutes * 60);
    };

    const setDuration = (mins, newMode) => {
        setIsActive(false);
        setMode(newMode);
        setTimeLeft(mins * 60);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = 100 - (timeLeft / (initialMinutes * 60)) * 100;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="집중 타이머">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>

                {/* Presets */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '30px' }}>
                    <button
                        onClick={() => setDuration(25, 'focus')}
                        style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: mode === 'focus' ? '#3b82f6' : '#e5e7eb', color: mode === 'focus' ? 'white' : '#374151', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        🔥 집중 25분
                    </button>
                    <button
                        onClick={() => setDuration(50, 'focus')}
                        style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: mode === 'long-focus' ? '#3b82f6' : '#e5e7eb', color: mode === 'long-focus' ? 'white' : '#374151', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        🔥 50분
                    </button>
                    <button
                        onClick={() => setDuration(5, 'break')}
                        style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: mode === 'break' ? '#10b981' : '#e5e7eb', color: mode === 'break' ? 'white' : '#374151', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        ☕ 휴식 5분
                    </button>
                </div>

                {/* Timer Display */}
                <div style={{
                    fontSize: '5rem',
                    fontWeight: '800',
                    color: mode === 'break' ? '#10b981' : '#3b82f6',
                    fontVariantNumeric: 'tabular-nums',
                    marginBottom: '20px'
                }}>
                    {formatTime(timeLeft)}
                </div>

                {/* Progress Bar */}
                <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', marginBottom: '30px', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: mode === 'break' ? '#10b981' : '#3b82f6', transition: 'width 1s linear' }}></div>
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', gap: '20px' }}>
                    <button
                        onClick={toggleTimer}
                        style={{
                            width: '64px', height: '64px', borderRadius: '50%',
                            background: isActive ? '#ef4444' : (mode === 'break' ? '#10b981' : '#3b82f6'),
                            color: 'white', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                    >
                        {isActive ? <Pause size={28} /> : <Play size={28} fill="white" />}
                    </button>
                    <button
                        onClick={resetTimer}
                        style={{
                            width: '64px', height: '64px', borderRadius: '50%',
                            background: '#f3f4f6', color: '#6b7280',
                            border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}
                    >
                        <RotateCcw size={24} />
                    </button>
                </div>

            </div>
        </Modal>
    );
};

export default SimpleTimer;
