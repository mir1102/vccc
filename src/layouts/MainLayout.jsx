import { Outlet, NavLink } from 'react-router-dom';
import { Home, User, Bell, Settings as SettingsIcon, Globe, Archive } from 'lucide-react'; // Using Globe for Ground
import './MainLayout.css';

const MainLayout = () => {
    return (
        <div className="layout-container">
            <main className="content-area">
                <Outlet />
            </main>

            <nav className="bottom-nav">
                <NavLink to="/home" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <Home size={24} />
                    <span>홈</span>
                </NavLink>
                <NavLink to="/ground" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <Globe size={24} />
                    <span>그라운드</span>
                </NavLink>
                <NavLink to="/notifications" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <Bell size={24} />
                    <span>알림</span>
                </NavLink>
                <NavLink to="/archive" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <Archive size={24} />
                    <span>보관함</span>
                </NavLink>
                {/* My Tab Removed - Merged into Settings */}
                <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <SettingsIcon size={24} />
                    <span>통합설정</span>
                </NavLink>
            </nav>
        </div>
    );
};

export default MainLayout;
