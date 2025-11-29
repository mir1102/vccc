import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { OptionCard } from '@/components/ui/OptionCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { quoteQuestions, calculateQuote, QuoteSelections } from '@/lib/quoteData';
import { ArrowLeft, ArrowRight, Check, Package, Ruler, Palette, Droplets, Hash } from 'lucide-react';

const stepIcons = [
  <Package className="w-6 h-6" />,
  <Ruler className="w-6 h-6" />,
  <Droplets className="w-6 h-6" />,
  <Palette className="w-6 h-6" />,
  <Hash className="w-6 h-6" />,
];

export const QuotePage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selections, setSelections] = useState<Partial<QuoteSelections>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const currentQuestion = quoteQuestions.find((q) => q.step === currentStep);
  const totalSteps = quoteQuestions.length;
  
  const handleOptionSelect = (optionId: string) => {
    if (currentQuestion) {
      setSelections((prev) => ({
        ...prev,
        [currentQuestion.id]: optionId,
      }));
    }
  };
  
  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };
  
  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };
  
  const handleSubmit = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // 견적 계산
      const quoteResult = calculateQuote(selections as QuoteSelections);
      
      // Firestore에 저장
      const quoteData = {
        userId: user.uid,
        userEmail: user.email,
        ...quoteResult,
        createdAt: new Date(),
        status: 'pending',
      };
      
      const docRef = await addDoc(collection(db, 'quotes'), quoteData);
      
      // 결과 페이지로 이동
      navigate(`/quote-result/${docRef.id}`);
    } catch (error) {
      console.error('Error saving quote:', error);
      alert('견적 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isCurrentStepComplete = currentQuestion 
    ? !!selections[currentQuestion.id as keyof QuoteSelections]
    : false;
  
  const isAllComplete = quoteQuestions.every(
    (q) => !!selections[q.id as keyof QuoteSelections]
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="animate-fade-in">
        {/* Progress */}
        <ProgressBar currentStep={currentStep} totalSteps={totalSteps} className="mb-8" />
        
        {/* Question Card */}
        {currentQuestion && (
          <Card className="mb-8 shadow-xl animate-slide-up">
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
                  {stepIcons[currentStep - 1]}
                </div>
                <div>
                  <p className="text-sm font-medium text-primary-600 mb-1">
                    STEP {currentStep}
                  </p>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    {currentQuestion.title}
                  </h2>
                </div>
              </div>
              
              <p className="text-slate-600 mb-6">
                {currentQuestion.description}
              </p>
              
              <div className="space-y-3">
                {currentQuestion.options.map((option) => (
                  <OptionCard
                    key={option.id}
                    id={option.id}
                    label={option.label}
                    description={option.description}
                    selected={selections[currentQuestion.id as keyof QuoteSelections] === option.id}
                    onClick={() => handleOptionSelect(option.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="secondary"
            onClick={handlePrev}
            disabled={currentStep === 1}
            leftIcon={<ArrowLeft className="w-5 h-5" />}
          >
            이전
          </Button>
          
          <div className="flex gap-2">
            {quoteQuestions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index + 1)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index + 1 === currentStep
                    ? 'bg-primary-500 scale-125'
                    : selections[quoteQuestions[index].id as keyof QuoteSelections]
                    ? 'bg-primary-300'
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
          
          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={!isCurrentStepComplete}
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              다음
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isAllComplete || isSubmitting}
              isLoading={isSubmitting}
              rightIcon={<Check className="w-5 h-5" />}
            >
              견적서 생성
            </Button>
          )}
        </div>
        
        {/* Selection Summary */}
        {Object.keys(selections).length > 0 && (
          <Card className="mt-8 bg-slate-50" padding="sm">
            <CardContent>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">선택 항목</h3>
              <div className="flex flex-wrap gap-2">
                {quoteQuestions.map((question) => {
                  const selectedId = selections[question.id as keyof QuoteSelections];
                  const selectedOption = question.options.find((o) => o.id === selectedId);
                  
                  if (!selectedOption) return null;
                  
                  return (
                    <span
                      key={question.id}
                      className="inline-flex items-center px-3 py-1.5 rounded-full bg-white border border-slate-200 text-sm text-slate-700"
                    >
                      {selectedOption.label}
                    </span>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

