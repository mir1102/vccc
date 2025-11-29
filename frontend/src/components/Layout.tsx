import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { LogOut, User, FileText, Home, Settings } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, userData, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
                <span className="text-white font-bold text-sm">VC</span>
              </div>
              <span className="font-bold text-xl text-slate-800 hidden sm:block">VCCC</span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-1 sm:gap-2">
              {user ? (
                <>
                  <Link to="/">
                    <Button
                      variant={isActive('/') ? 'secondary' : 'ghost'}
                      size="sm"
                      leftIcon={<Home className="w-4 h-4" />}
                    >
                      <span className="hidden sm:inline">홈</span>
                    </Button>
                  </Link>
                  <Link to="/quote/detailed">
                    <Button
                      variant={isActive('/quote') || isActive('/quote/detailed') ? 'secondary' : 'ghost'}
                      size="sm"
                      leftIcon={<FileText className="w-4 h-4" />}
                    >
                      <span className="hidden sm:inline">견적 요청</span>
                    </Button>
                  </Link>
                  <Link to="/my-quotes">
                    <Button
                      variant={isActive('/my-quotes') ? 'secondary' : 'ghost'}
                      size="sm"
                      leftIcon={<User className="w-4 h-4" />}
                    >
                      <span className="hidden sm:inline">내 견적</span>
                    </Button>
                  </Link>
                  {userData?.isAdmin && (
                    <Link to="/admin">
                      <Button
                        variant={isActive('/admin') ? 'secondary' : 'ghost'}
                        size="sm"
                        leftIcon={<Settings className="w-4 h-4" />}
                      >
                        <span className="hidden sm:inline">관리</span>
                      </Button>
                    </Link>
                  )}
                  <div className="h-6 w-px bg-slate-200 mx-1 sm:mx-2" />
                  <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
                    <span className="font-medium">{userData?.name || user.email}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    leftIcon={<LogOut className="w-4 h-4" />}
                  >
                    <span className="hidden sm:inline">로그아웃</span>
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm">
                      로그인
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="primary" size="sm">
                      회원가입
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <span className="text-white font-bold text-xs">VC</span>
              </div>
              <span className="font-semibold text-slate-700">VCCC</span>
            </div>
            <p className="text-sm text-slate-500 text-center">
              © 2024 VCCC. 화장품 용기 도장 견적 시스템
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

