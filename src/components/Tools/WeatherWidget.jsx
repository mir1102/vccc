import React, { useState, useEffect } from 'react';
import { getWeather, getWeatherIconUrl } from '../../utils/weatherService';
import { Loader, MapPin } from 'lucide-react';
import { format } from 'date-fns';

const WeatherWidget = () => {
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                // Default to Seoul coordinates for now if geolocation not available or denied
                let lat = 37.5665;
                let lon = 126.9780;

                if ("geolocation" in navigator) {
                    navigator.geolocation.getCurrentPosition(
                        async (position) => {
                            lat = position.coords.latitude;
                            lon = position.coords.longitude;
                            const data = await getWeather(lat, lon);
                            setWeatherData(data);
                            setLoading(false);
                        },
                        async (err) => {
                            console.warn("Geolocation denied/failed, using default (Seoul).");
                            const data = await getWeather(lat, lon);
                            setWeatherData(data);
                            setLoading(false);
                        }
                    );
                } else {
                    const data = await getWeather(lat, lon);
                    setWeatherData(data);
                    setLoading(false);
                }
            } catch (err) {
                console.error(err);
                setError("날씨 정보를 불러오는데 실패했습니다.");
                setLoading(false);
            }
        };

        fetchWeather();
    }, []);

    if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}><Loader className="spin" /> 날씨 조회 중...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>{error}</div>;
    if (!weatherData) return null;

    return (
        <div style={{ padding: '10px' }}>
            {/* Current Weather */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <img
                        src={getWeatherIconUrl(weatherData.current.weather[0].icon)}
                        alt={weatherData.current.weather[0].main}
                        style={{ width: '60px', height: '60px' }}
                    />
                    <div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{weatherData.current.temp}°</div>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{weatherData.current.weather[0].description || weatherData.current.weather[0].main}</div>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                        <MapPin size={12} /> 현재 위치 (기본/GPS)
                    </div>
                </div>
            </div>

            {/* Forecast */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                {weatherData.daily.map((day, index) => (
                    <div key={index} style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        background: 'var(--card-bg)',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                            {index === 0 ? '오늘' : index === 1 ? '내일' : '모레'}
                        </span>
                        <img
                            src={getWeatherIconUrl(day.weather[0].icon)}
                            alt={day.weather[0].main}
                            style={{ width: '40px', height: '40px' }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{day.temp.day}°</span>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                            <span style={{ color: '#3b82f6' }}>{day.temp.min}°</span> / <span style={{ color: '#ef4444' }}>{day.temp.max}°</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WeatherWidget;
