import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { 
  ArrowRight, 
  Sparkles, 
  Clock, 
  FileText, 
  Shield,
  Palette,
  Box,
  Layers
} from 'lucide-react';

const features = [
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: '간편한 견적 요청',
    description: '5단계 객관식 질문에 답하면 자동으로 견적이 생성됩니다.',
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: '빠른 응답',
    description: '실시간으로 예상 가격과 납기일을 확인할 수 있습니다.',
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: 'PDF 다운로드',
    description: '생성된 견적서를 PDF로 다운로드하여 보관하세요.',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: '기록 보관',
    description: '모든 견적 기록이 안전하게 보관됩니다.',
  },
];

const services = [
  {
    icon: <Layers className="w-8 h-8" />,
    title: '증착',
    description: '메탈릭한 광택 효과를 연출하는 진공 증착 코팅',
  },
  {
    icon: <Palette className="w-8 h-8" />,
    title: '코팅',
    description: '다양한 색상과 마감을 제공하는 외부 코팅',
  },
  {
    icon: <Box className="w-8 h-8" />,
    title: '내부코팅',
    description: '내용물 보호를 위한 안전한 내부 코팅',
  },
];

export const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50" />
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230c8ce9' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              화장품 용기 도장 전문
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              쉽고 빠른
              <span className="gradient-text block sm:inline"> 견적 시스템</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 mb-10 leading-relaxed">
              증착, 코팅, 내부코팅까지<br className="sm:hidden" />
              5단계 질문에 답하면 자동으로 견적이 생성됩니다
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={user ? '/quote/detailed' : '/register'}>
                <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  {user ? '상세 견적 요청하기' : '시작하기'}
                </Button>
              </Link>
              {user && (
                <Link to="/quote">
                  <Button variant="outline" size="lg">
                    빠른 견적
                  </Button>
                </Link>
              )}
              {!user && (
                <Link to="/login">
                  <Button variant="outline" size="lg">
                    로그인
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              도장 서비스
            </h2>
            <p className="text-lg text-slate-600">
              화장품 용기에 최적화된 다양한 도장 서비스를 제공합니다
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {services.map((service, index) => (
              <Card
                key={index}
                hover
                className="text-center animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent>
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white mb-5 shadow-lg shadow-primary-500/30">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {service.title}
                  </h3>
                  <p className="text-slate-600">
                    {service.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              왜 VCCC인가요?
            </h2>
            <p className="text-lg text-slate-600">
              편리하고 빠른 견적 시스템을 경험해보세요
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent>
                  <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-primary-600 to-primary-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            지금 바로 견적을 받아보세요
          </h2>
          <p className="text-lg text-primary-100 mb-8">
            간단한 질문에 답하면 예상 가격과 납기일을 바로 확인할 수 있습니다
          </p>
          <Link to={user ? '/quote/detailed' : '/register'}>
            <Button
              size="lg"
              variant="secondary"
              rightIcon={<ArrowRight className="w-5 h-5" />}
              className="bg-white text-primary-600 hover:bg-primary-50"
            >
              {user ? '상세 견적 요청하기' : '무료로 시작하기'}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

