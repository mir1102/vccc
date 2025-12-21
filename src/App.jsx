import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import MyPage from './pages/MyPage';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

// Placeholder for now
const Social = () => <div style={{ padding: 20 }}><h1>Social Space</h1></div>;
const Notifications = () => <div style={{ padding: 20 }}><h1>Notifications</h1></div>;

import { itemService } from './services/itemService';
import { useEffect } from 'react';

// ... (other imports remain)

function App() {
  // Simple Notification Check Logic
  useEffect(() => {
    // Request permission on load
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    const checkReminders = async () => {
      const now = new Date();
      const userId = 'demo-user'; // Replace with real auth context later

      // Fetch today's items (In a real app, this should be more optimized)
      // For now, we assume we might need to fetch all active or cache them.
      // A simpler approach for this demo: 
      // We relies on a poller or just checking a cached list if available.
      // But since we don't have a global item store yet, let's just log for now?
      // NO, user wants it working.

      // Let's implement a minimal check:
      // 1. Get items for TODAY.
      const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999);

      const items = await itemService.getItemsByDateRange(userId, startOfDay, endOfDay);

      items.forEach(item => {
        if (item.time && !item.isCompleted) {
          const [hours, minutes] = item.time.split(':');
          const itemTime = new Date(now);
          itemTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          // Trigger if within last minute (to avoid re-triggering we'd need tracking)
          // Simply checking if matches current minute
          if (itemTime.getHours() === now.getHours() &&
            itemTime.getMinutes() === now.getMinutes() &&
            !item.notified // Prevent double alert in memory (needs persistent state technically)
          ) {
            // Send Notification
            new Notification("L&W 알림", {
              body: item.content,
              icon: '/vite.svg'
            });
            // Mark as notified in local state or DB? 
            // For this simple ver, we rely on the minute passing.
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/home" replace />} />
              <Route path="home" element={<Home />} />
              <Route path="social" element={<Social />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="my" element={<MyPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
