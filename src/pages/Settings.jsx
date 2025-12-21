import React, { useState, useEffect } from 'react';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { itemService } from '../services/itemService';
import { Moon, Sun, Baby, Heart, LogOut, Bell, Archive, RefreshCcw, Trash2 } from 'lucide-react';
import './Settings.css';

const Settings = () => {
    const { theme, setTheme } = useTheme();
    const { signOut, user } = useAuth(); // Corrected from logout to signOut based on AuthContext usually

    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    useEffect(() => {
        if (Notification.permission === 'granted') {
            setNotificationsEnabled(true);
        }
    }, []);

    const requestNotificationPermission = async () => {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            setNotificationsEnabled(true);
            new Notification("알림이 활성화되었습니다!", { body: "이제 중요한 일정을 놓치지 마세요." });
        }
    };


    const themes = [
        { id: 'light', name: '기본 (Light)', icon: <Sun size={20} />, color: '#ffffff', textColor: '#0f172a' },
        { id: 'dark', name: '다크 (Dark)', icon: <Moon size={20} />, color: '#1e293b', textColor: '#f8fafc' },
        { id: 'kids', name: '키즈 (Kids)', icon: <Baby size={20} />, color: '#fffbeb', textColor: '#92400e' },
        { id: 'gentle', name: '젠틀 (Soft)', icon: <Heart size={20} />, color: '#fdf2f8', textColor: '#9d174d' },
    ];

    return (
        <div className="settings-container">
            <header className="settings-header">
                <h1>통합설정</h1>
            </header>

            {/* User Profile Section */}
            <div className="settings-section">
                <div className="section-header">
                    <h2>계정 정보</h2>
                </div>
                <div className="user-profile">
                    <div className="avatar-placeholder">{user?.email?.[0]?.toUpperCase()}</div>
                    <div className="user-info">
                        <p className="user-email">{user?.email}</p>
                        <p className="user-status">무료 플랜 사용 중</p>
                    </div>
                </div>
                <button className="sign-out-btn" onClick={signOut}>
                    <LogOut size={16} /> 로그아웃
                </button>
            </div>

            {/* Notification Section */}
            <div className="settings-section">
                <div className="section-header">
                    <Bell size={20} />
                    <h2>알림 설정</h2>
                </div>
                <div className="setting-item">
                    <div className="setting-info">
                        <h3>브라우저 알림</h3>
                        <p>중요한 일정과 타이머 종료 알림을 받습니다.</p>
                    </div>
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={notificationsEnabled}
                            onChange={requestNotificationPermission}
                        />
                        <span className="slider round"></span>
                    </label>
                </div>
            </div>



            {/* Theme Settings */}
            <div className="settings-section">
                <h2>테마 설정</h2>
                <div className="theme-grid">
                    {themes.map((t) => (
                        <button
                            key={t.id}
                            className={`theme-card ${theme === t.id ? 'active' : ''}`}
                            onClick={() => setTheme(t.id)}
                            style={{ backgroundColor: t.color, color: t.textColor }}
                        >
                            <span className="theme-icon">{t.icon}</span>
                            <span className="theme-name">{t.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="app-version">
                LifeSync v1.0.0
            </div>
        </div>
    );
};

export default Settings;
