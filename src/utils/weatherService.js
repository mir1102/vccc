
const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Mock Data for fallback
const MOCK_WEATHER = {
    current: {
        temp: 22,
        weather: [{ main: 'Clear', description: '맑음', icon: '01d' }]
    },
    daily: [
        { dt: Date.now() / 1000, temp: { day: 22, min: 18, max: 25 }, weather: [{ main: 'Clear', icon: '01d' }] },
        { dt: Date.now() / 1000 + 86400, temp: { day: 20, min: 17, max: 23 }, weather: [{ main: 'Clouds', icon: '03d' }] },
        { dt: Date.now() / 1000 + 172800, temp: { day: 19, min: 16, max: 21 }, weather: [{ main: 'Rain', icon: '10d' }] },
    ]
};

export const getWeather = async (lat, lon) => {
    if (!API_KEY) {
        console.warn('Weather API Key missing, using mock data.');
        return MOCK_WEATHER;
    }

    try {
        // Fetch Current Weather
        const currentRes = await fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}&lang=kr`);
        const currentData = await currentRes.json();

        // Fetch Forecast (5 day / 3 hour) - Free tier doesn't support 'onecall' usually without subscription 
        // using 'forecast' endpoint is safer for free tier
        const forecastRes = await fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}&lang=kr`);
        const forecastData = await forecastRes.json();

        // Process forecast data to get daily-ish summary (taking noon values)
        const daily = forecastData.list.filter(item => item.dt_txt.includes('12:00:00')).slice(0, 3).map(item => ({
            dt: item.dt,
            temp: { day: Math.round(item.main.temp), min: Math.round(item.main.temp_min), max: Math.round(item.main.temp_max) },
            weather: item.weather
        }));

        return {
            current: {
                temp: Math.round(currentData.main.temp),
                weather: currentData.weather
            },
            daily: daily
        };

    } catch (error) {
        console.error('Weather API fetch failed', error);
        return MOCK_WEATHER;
    }
};

export const getWeatherIconUrl = (iconCode) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
};
