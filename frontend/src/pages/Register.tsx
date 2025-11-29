import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Mail, Lock, User, Phone, Building, ArrowRight } from 'lucide-react';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    company: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 유효성 검사
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);

    try {
      await register(
        formData.email,
        formData.password,
        formData.name,
        formData.phone,
        formData.company
      );
      navigate('/');
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        if (err.message.includes('email-already-in-use')) {
          setError('이미 사용 중인 이메일입니다.');
        } else if (err.message.includes('invalid-email')) {
          setError('유효하지 않은 이메일 형식입니다.');
        } else if (err.message.includes('weak-password')) {
          setError('비밀번호가 너무 약합니다.');
        } else {
          setError('회원가입에 실패했습니다. 다시 시도해주세요.');
        }
      } else {
        setError('회원가입에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mb-4 shadow-lg shadow-primary-500/30">
              <span className="text-white font-bold text-xl">VC</span>
            </div>
            <CardTitle className="text-2xl">회원가입</CardTitle>
            <CardDescription>
              계정을 만들어 견적 서비스를 이용하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                  {error}
                </div>
              )}
              
              <Input
                label="이메일"
                type="email"
                name="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={handleChange}
                leftIcon={<Mail className="w-5 h-5" />}
                required
              />
              
              <Input
                label="비밀번호"
                type="password"
                name="password"
                placeholder="6자 이상 입력하세요"
                value={formData.password}
                onChange={handleChange}
                leftIcon={<Lock className="w-5 h-5" />}
                required
              />
              
              <Input
                label="비밀번호 확인"
                type="password"
                name="confirmPassword"
                placeholder="비밀번호를 다시 입력하세요"
                value={formData.confirmPassword}
                onChange={handleChange}
                leftIcon={<Lock className="w-5 h-5" />}
                required
              />
              
              <Input
                label="이름"
                type="text"
                name="name"
                placeholder="홍길동"
                value={formData.name}
                onChange={handleChange}
                leftIcon={<User className="w-5 h-5" />}
                required
              />
              
              <Input
                label="연락처"
                type="tel"
                name="phone"
                placeholder="010-1234-5678"
                value={formData.phone}
                onChange={handleChange}
                leftIcon={<Phone className="w-5 h-5" />}
              />
              
              <Input
                label="회사명"
                type="text"
                name="company"
                placeholder="(주)회사명"
                value={formData.company}
                onChange={handleChange}
                leftIcon={<Building className="w-5 h-5" />}
              />

              <Button
                type="submit"
                className="w-full mt-6"
                size="lg"
                isLoading={loading}
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                회원가입
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-600">
                이미 계정이 있으신가요?{' '}
                <Link to="/login" className="text-primary-600 font-semibold hover:underline">
                  로그인
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

