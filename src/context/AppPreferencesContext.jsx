import React, { createContext, useContext, useState, useEffect } from 'react';

const AppPreferencesContext = createContext();

export const useAppPreferences = () => useContext(AppPreferencesContext);

export const AppPreferencesProvider = ({ children }) => {
    // Persistent View Mode (Calendar vs Data)
    const [homeViewMode, setHomeViewMode] = useState(() => localStorage.getItem('homeViewMode') || 'calendar');

    // Selection & UI States
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

    const updateHomeViewMode = (mode) => {
        setHomeViewMode(mode);
        localStorage.setItem('homeViewMode', mode);
    };

    const value = {
        homeViewMode,
        updateHomeViewMode,
        selectedCategoryId,
        setSelectedCategoryId,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        isSidePanelOpen,
        setIsSidePanelOpen
    };

    return (
        <AppPreferencesContext.Provider value={value}>
            {children}
        </AppPreferencesContext.Provider>
    );
};
