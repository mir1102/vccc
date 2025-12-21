import { Outlet, NavLink } from 'react-router-dom';
import { Home, User, Heart, Bell, Menu } from 'lucide-react';
import './MainLayout.css'; // We will create this specific style or use global

const MainLayout = () => {
    return (
        <div className="layout-container">
            <main className="content-area">
                <Outlet />
            </main>

            <nav className="bottom-nav">
                <NavLink to="/home" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <Home size={24} />
                    <span>Home</span>
                </NavLink>
                <NavLink to="/social" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <Heart size={24} />
                    <span>Social</span>
                </NavLink>
                <NavLink to="/notifications" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <Bell size={24} />
                    <span>Noti</span>
                </NavLink>
                <NavLink to="/my" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <User size={24} />
                    <span>My</span>
                </NavLink>
            </nav>
        </div>
    );
};

export default MainLayout;
