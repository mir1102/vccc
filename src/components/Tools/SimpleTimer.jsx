import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import Modal from '../UI/Modal';

const SimpleTimer = ({ isOpen, onClose, initialMinutes = 25 }) => {
    const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState('focus'); // focus | break | long-focus
    const [pomodoros, setPomodoros] = useState(0);

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(timeLeft - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            setIsActive(false);
            handleTimerComplete();
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const handleTimerComplete = () => {
        const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg'); // Simple beep
        audio.play().catch(e => console.log('Audio play failed', e));

        if (mode === 'focus' || mode === 'long-focus') {
            setPomodoros(p => p + 1);
            if (Notification.permission === 'granted') {
                new Notification("집중 완료! 🍅", { body: "수고하셨습니다. 5분 휴식을 취해보세요." });
            }
        } else {
            if (Notification.permission === 'granted') {
                new Notification("휴식 종료! ⚡", { body: "충전 완료! 다시 집중해볼까요?" });
            }
        }
    };

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setMode('focus');
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

    // Progress calculation
    const totalSeconds = mode === 'break' ? 5 * 60 : (mode === 'long-focus' ? 50 * 60 : 25 * 60);
    const progress = 100 - (timeLeft / totalSeconds) * 100;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="집중 타이머">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>

                {/* Pomodoro Count */}
                <div style={{ marginBottom: '20px', fontSize: '1.2rem', color: '#ef4444' }}>
                    {pomodoros > 0 ? Array(pomodoros).fill('🍅').join(' ') : '오늘도 힘차게 집중해봐요!'}
                </div>

                {/* Presets */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '30px' }}>
                    <button
                        onClick={() => setDuration(25, 'focus')}
                        style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: mode === 'focus' ? '#3b82f6' : '#e5e7eb', color: mode === 'focus' ? 'white' : '#374151', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        🔥 집중 25분
                    </button>
                    <button
                        onClick={() => setDuration(50, 'long-focus')}
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
