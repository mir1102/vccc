import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
    const { googleSignIn, user } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in (can also be handled by route protection)
    React.useEffect(() => {
        if (user) {
            navigate('/home');
        }
    }, [user, navigate]);

    const handleGoogleLogin = async () => {
        try {
            await googleSignIn();
            navigate('/home');
        } catch (error) {
            console.error("Login failed: ", error);
            alert("로그인에 실패했습니다. (데모 모드인 경우 설정 없이 진행될 수도 있습니다)");
            // Note: If firebase config is invalid, this will fail.
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="branding">
                    <h1>L&W</h1>
                    <p>나의 일상과 업무, 그리고 소중한 사람들과의 연결</p>
                </div>

                <div className="login-actions">
                    <button onClick={handleGoogleLogin} className="google-btn">
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                        <span>Google로 시작하기</span>
                    </button>

                    <div className="divider">
                        <span>또는 이메일로 시작</span>
                    </div>

                    <form className="email-form" onSubmit={(e) => e.preventDefault()}>
                        <input type="email" placeholder="이메일 주소" className="login-input" />
                        <input type="password" placeholder="비밀번호" className="login-input" />
                        <button className="login-btn">로그인</button>
                    </form>

                    <p className="signup-link">계정이 없으신가요? <a href="#">회원가입</a></p>
                </div>
            </div>
        </div>
    );
};

export default Login;
