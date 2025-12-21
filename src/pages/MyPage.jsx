import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, Baby, Heart } from 'lucide-react';
import './MyPage.css';

const MyPage = () => {
    const { theme, setTheme } = useTheme();

    const themes = [
        { id: 'light', name: '기본 (Light)', icon: <Sun size={20} />, color: '#ffffff' },
        { id: 'dark', name: '다크 (Dark)', icon: <Moon size={20} />, color: '#1f2937' },
        { id: 'kids', name: '키즈 (Kids)', icon: <Baby size={20} />, color: '#fffbeb' },
        { id: 'gentle', name: '젠틀 (Soft)', icon: <Heart size={20} />, color: '#fdf2f8' },
    ];

    return (
        <div className="mypage-container">
            <header className="mypage-header">
                <h2>설정 & 마이페이지</h2>
            </header>

            <section className="settings-group">
                <h3>테마 설정</h3>
                <div className="theme-grid">
                    {themes.map((t) => (
                        <button
                            key={t.id}
                            className={`theme-card ${theme === t.id ? 'active' : ''}`}
                            onClick={() => setTheme(t.id)}
                            style={{ '--theme-preview': t.color }}
                        >
                            <div className="icon-wrapper">{t.icon}</div>
                            <span>{t.name}</span>
                        </button>
                    ))}
                </div>
            </section>

            <section className="settings-group">
                <h3>계정 정보</h3>
                <div className="profile-card">
                    <div className="avatar">U</div>
                    <div className="info">
                        <p className="name">User Name</p>
                        <p className="email">guest@example.com</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default MyPage;
