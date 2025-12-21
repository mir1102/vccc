import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
    const { googleSignIn, emailSignIn, emailSignUp, user } = useAuth();
    const navigate = useNavigate();

    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState(''); // Only for signup

    // Redirect if already logged in
    React.useEffect(() => {
        if (user) {
            navigate('/home');
        }
    }, [user, navigate]);

    const handleGoogleLogin = async () => {
        setError('');
        setIsLoading(true);
        try {
            await googleSignIn();
            navigate('/home');
        } catch (error) {
            console.error("Login failed: ", error);
            setError("Google 로그인에 실패했습니다. 관리자에게 문의하세요.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!email || !password) {
            setError('이메일과 비밀번호를 모두 입력해주세요.');
            return;
        }
        if (!isLogin && !name) {
            setError('이름을 입력해주세요.');
            return;
        }

        setIsLoading(true);
        try {
            if (isLogin) {
                await emailSignIn(email, password);
            } else {
                await emailSignUp(email, password, name);
            }
            navigate('/home');
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError('이미 사용 중인 이메일입니다.');
            } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
                setError('이메일 혹은 비밀번호가 일치하지 않습니다.');
            } else if (err.code === 'auth/weak-password') {
                setError('비밀번호는 6자 이상이어야 합니다.');
            } else {
                setError('로그인/회원가입 중 오류가 발생했습니다.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="branding">
                    <h1>L&W</h1>
                    <p>{isLogin ? '오늘 하루도 생산적으로, L&W와 함께' : '새로운 시작, L&W에 오신 것을 환영합니다'}</p>
                </div>

                <div className="login-actions">
                    <button onClick={handleGoogleLogin} className="google-btn" disabled={isLoading}>
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                        <span>Google로 {isLogin ? '로그인' : '시작하기'}</span>
                    </button>

                    <div className="divider">
                        <span>또는 이메일로 {isLogin ? '로그인' : '가입'}</span>
                    </div>

                    <form className="email-form" onSubmit={handleSubmit}>
                        {error && <div className="error-msg">{error}</div>}

                        {!isLogin && (
                            <input
                                type="text"
                                placeholder="이름 (닉네임)"
                                className="login-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        )}

                        <input
                            type="email"
                            placeholder="이메일 주소"
                            className="login-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="비밀번호"
                            className="login-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        <button className="login-btn" disabled={isLoading}>
                            {isLoading ? '처리 중...' : (isLogin ? '로그인' : '회원가입')}
                        </button>
                    </form>

                    <p className="switch-mode">
                        {isLogin ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
                        <button onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                        }} className="switch-btn">
                            {isLogin ? '회원가입' : '로그인'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
