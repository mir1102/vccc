import React, { useState, useEffect } from 'react';
import { Clock, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz'; // Need to check if date-fns-tz is available or stick to native Intl

// Simple Timezone Widget
// If date-fns-tz is not installed, we can use native Intl.DateTimeFormat
const TimezoneWidget = ({ baseDate = new Date() }) => {
    // Cities to show
    const cities = [
        { name: '서울 (Seoul)', zone: 'Asia/Seoul', flag: '🇰🇷' },
        { name: '런던 (London)', zone: 'Europe/London', flag: '🇬🇧' },
        { name: '뉴욕 (New York)', zone: 'America/New_York', flag: '🇺🇸' },
        { name: '파리 (Paris)', zone: 'Europe/Paris', flag: '🇫🇷' },
        { name: '도쿄 (Tokyo)', zone: 'Asia/Tokyo', flag: '🇯🇵' },
        { name: 'LA (Los Angeles)', zone: 'America/Los_Angeles', flag: '🇺🇸' },
    ];

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getTimeInZone = (date, zone) => {
        try {
            return new Intl.DateTimeFormat('ko-KR', {
                timeZone: zone,
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }).format(date);
        } catch (e) {
            return "Invalid Timezone";
        }
    };

    return (
        <div style={{ padding: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', padding: '10px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <Globe size={20} color="#3b82f6" />
                <span style={{ fontSize: '14px', color: '#1e40af', fontWeight: 'bold' }}>기준 시간: {format(baseDate, 'yyyy-MM-dd HH:mm')}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                {cities.map((city) => (
                    <div key={city.zone} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.2rem' }}>{city.flag}</span>
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-color)' }}>{city.name}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{city.zone}</div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#3b82f6' }}>
                            {getTimeInZone(baseDate, city.zone).split('. ').slice(3).join(':')}
                            {/* Getting just time part somewhat hacky with Intl */}
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                                {getTimeInZone(baseDate, city.zone).split('. ').slice(0, 3).join('-')}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TimezoneWidget;
