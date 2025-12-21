import React, { useState } from 'react';
import CalendarView from '../components/Calendar/CalendarView';
import CategoryList from '../components/Category/CategoryList';
import './Home.css';

const Home = () => {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleDataChange = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="home-container">
            <header className="home-header">
                <h1>L&W</h1>
                {/* Future: Add Category Management Button Here */}
            </header>

            <section className="calendar-section">
                <CalendarView refreshTrigger={refreshTrigger} />
            </section>

            <section className="categories-section">
                <CategoryList onDataChange={handleDataChange} />
            </section>
        </div>
    );
};

export default Home;
