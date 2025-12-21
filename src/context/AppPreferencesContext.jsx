import React, { createContext, useContext, useState, useEffect } from 'react';

const AppPreferencesContext = createContext();

export const useAppPreferences = () => useContext(AppPreferencesContext);

export const AppPreferencesProvider = ({ children }) => {
    // Persistent View Mode (Calendar vs Data)
    const [homeViewMode, setHomeViewMode] = useState(() => localStorage.getItem('homeViewMode') || 'calendar');

    // we can add global theme state here later if needed
    // const [globalTheme, setGlobalTheme] = useState('light');

    const updateHomeViewMode = (mode) => {
        setHomeViewMode(mode);
        localStorage.setItem('homeViewMode', mode);
    };

    const value = {
        homeViewMode,
        updateHomeViewMode
    };

    return (
        <AppPreferencesContext.Provider value={value}>
            {children}
        </AppPreferencesContext.Provider>
    );
};
