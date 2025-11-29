import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { QuoteResult as QuoteResultType } from '@/lib/quoteData';
import { DetailedQuoteResult } from '@/lib/detailedQuoteData';
import { DetailedQuoteResultDisplay } from '@/components/DetailedQuoteResultDisplay';
import { formatPrice, formatDate } from '@/lib/utils';
import { 
  Download, 
  FileText, 
  Home, 
  CheckCircle, 
  Package, 
  Ruler, 
  Droplets, 
  Palette, 
  Hash,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import jsPDF from 'jspdf';

const labelIcons: Record<string, React.ReactNode> = {
  containerType: <Package className="w-4 h-4" />,
  containerSize: <Ruler className="w-4 h-4" />,
  coatingType: <Droplets className="w-4 h-4" />,
  color: <Palette className="w-4 h-4" />,
  quantity: <Hash className="w-4 h-4" />,
};

const labelNames: Record<string, string> = {
  containerType: '용기 종류',
  containerSize: '용기 크기',
  coatingType: '도장 종류',
  color: '색상',
  quantity: '수량',
};

export const QuoteResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quoteResult, setQuoteResult] = useState<QuoteResultType | null>(null);
  const [detailedQuoteResult, setDetailedQuoteResult] = useState<DetailedQuoteResult | null>(null);
  const [quoteType, setQuoteType] = useState<'simple' | 'detailed' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuote = async () => {
      if (!id) {
        setError('견적 ID가 없습니다.');
        setLoading(false);
        return;
      }

      try {
        const quoteDoc = await getDoc(doc(db, 'quotes', id));
        
        if (!quoteDoc.exists()) {
          setError('견적을 찾을 수 없습니다.');
          setLoading(false);
          return;
        }

        const data = quoteDoc.data();
        const type = data.type || 'simple';
        setQuoteType(type);
        
        if (type === 'detailed') {
          // 상세 견적 결과
          const result: DetailedQuoteResult = {
            input: data.input,
            laborCostPerUnit: data.laborCostPerUnit,
            materialCostPerUnit: data.materialCostPerUnit,
            elecCostPerUnit: data.elecCostPerUnit,
            wasteCostPerUnit: data.wasteCostPerUnit,
            primaryCost: data.primaryCost,
            logisticsCost: data.logisticsCost,
            adminCost: data.adminCost,
            totalOtherCost: data.totalOtherCost,
            totalSecondaryCost: data.totalSecondaryCost,
            totalCost: data.totalCost,
            profit: data.profit,
            priceBeforeDiscount: data.priceBeforeDiscount,
            discountRate: data.discountRate,
            discountAmount: data.discountAmount,
            finalPrice: data.finalPrice,
            quoteNumber: data.quoteNumber,
            createdAt: data.createdAt.toDate(),
            processTypeDisplay: data.processTypeDisplay,
          };
          setDetailedQuoteResult(result);
        } else {
          // 간단한 견적 결과
          const result: QuoteResultType = {
            selections: data.selections,
            selectionLabels: data.selectionLabels,
            unitPriceRange: data.unitPriceRange,
            totalPriceRange: data.totalPriceRange,
            estimatedDays: data.estimatedDays,
            quoteNumber: data.quoteNumber,
            createdAt: data.createdAt.toDate(),
            needsConsultation: data.needsConsultation,
          };
          setQuoteResult(result);
        }
      } catch (err) {
        console.error('Error fetching quote:', err);
        setError('견적을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">견적을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || (!quoteResult && !detailedQuoteResult)) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <Card className="text-center">
          <CardContent className="py-12">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">오류가 발생했습니다</h2>
            <p className="text-slate-600 mb-6">{error || '견적을 찾을 수 없습니다.'}</p>
            <div className="flex gap-4 justify-center">
              <Link to="/my-quotes">
                <Button variant="secondary">내 견적 목록</Button>
              </Link>
              <Link to="/quote">
                <Button>새 견적 요청</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // 폰트 설정 (한글 지원을 위해)
    doc.setFont('helvetica');
    
    // 헤더
    doc.setFillColor(12, 140, 233);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('VCCC', 20, 25);
    doc.setFontSize(12);
    doc.text('Cosmetic Container Coating Quote', 50, 25);
    
    const quoteNumber = quoteType === 'detailed' 
      ? detailedQuoteResult!.quoteNumber 
      : quoteResult!.quoteNumber;
    const createdAt = quoteType === 'detailed'
      ? detailedQuoteResult!.createdAt
      : quoteResult!.createdAt;
    
    // 견적서 번호
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Quote No: ${quoteNumber}`, 20, 50);
    doc.text(`Date: ${formatDate(createdAt)}`, 20, 57);
    
    // 구분선
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 65, 190, 65);
    
    let yPos = 78;
    
    if (quoteType === 'detailed' && detailedQuoteResult) {
      // 상세 견적 PDF 생성
      const result = detailedQuoteResult;
      
      // 기본 정보
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text('견적 정보', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text('제출처:', 25, yPos);
      doc.setTextColor(30, 41, 59);
      doc.text(result.input.submittedTo || '-', 80, yPos);
      yPos += 8;
      
      doc.setTextColor(100, 116, 139);
      doc.text('공정:', 25, yPos);
      doc.setTextColor(30, 41, 59);
      doc.text(result.processTypeDisplay, 80, yPos);
      yPos += 8;
      
      doc.setTextColor(100, 116, 139);
      doc.text('품명:', 25, yPos);
      doc.setTextColor(30, 41, 59);
      doc.text(result.input.itemName || '-', 80, yPos);
      yPos += 8;
      
      doc.setTextColor(100, 116, 139);
      doc.text('부속명:', 25, yPos);
      doc.setTextColor(30, 41, 59);
      doc.text(result.input.partName || '-', 80, yPos);
      yPos += 15;
      
      // 1차 원가
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text('1. 1차 기본 원가 (개당)', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      const formatCurrency = (num: number) => 
        `${num.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 원`;
      
      doc.setTextColor(100, 116, 139);
      doc.text('인건비:', 25, yPos);
      doc.setTextColor(30, 41, 59);
      doc.text(formatCurrency(result.laborCostPerUnit), 80, yPos);
      yPos += 8;
      
      doc.setTextColor(100, 116, 139);
      doc.text('원료비:', 25, yPos);
      doc.setTextColor(30, 41, 59);
      doc.text(formatCurrency(result.materialCostPerUnit), 80, yPos);
      yPos += 8;
      
      doc.setTextColor(100, 116, 139);
      doc.text('전기료:', 25, yPos);
      doc.setTextColor(30, 41, 59);
      doc.text(formatCurrency(result.elecCostPerUnit), 80, yPos);
      yPos += 8;
      
      doc.setTextColor(100, 116, 139);
      doc.text('폐기물 처리비:', 25, yPos);
      doc.setTextColor(30, 41, 59);
      doc.text(formatCurrency(result.wasteCostPerUnit), 80, yPos);
      yPos += 8;
      
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text(`소계 (A): ${formatCurrency(result.primaryCost)}`, 25, yPos);
      yPos += 15;
      
      // 2차 비용
      doc.setFontSize(12);
      doc.text('2. 2차 비용 (개당)', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text('물류비용 (A x 5%):', 25, yPos);
      doc.setTextColor(30, 41, 59);
      doc.text(formatCurrency(result.logisticsCost), 80, yPos);
      yPos += 8;
      
      doc.setTextColor(100, 116, 139);
      doc.text('관리비용 (A x 20%):', 25, yPos);
      doc.setTextColor(30, 41, 59);
      doc.text(formatCurrency(result.adminCost), 80, yPos);
      yPos += 8;
      
      doc.setTextColor(100, 116, 139);
      doc.text('기타비용 합계:', 25, yPos);
      doc.setTextColor(30, 41, 59);
      doc.text(formatCurrency(result.totalOtherCost), 80, yPos);
      yPos += 8;
      
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text(`소계 (B): ${formatCurrency(result.totalSecondaryCost)}`, 25, yPos);
      yPos += 15;
      
      // 최종 단가
      doc.setFontSize(12);
      doc.text('3. 최종 제안 단가', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text('총원가 (A + B):', 25, yPos);
      doc.setTextColor(30, 41, 59);
      doc.text(formatCurrency(result.totalCost), 80, yPos);
      yPos += 8;
      
      doc.setTextColor(100, 116, 139);
      doc.text('이윤 (총원가 x 10%):', 25, yPos);
      doc.setTextColor(30, 41, 59);
      doc.text(formatCurrency(result.profit), 80, yPos);
      yPos += 8;
      
      doc.setTextColor(100, 116, 139);
      doc.text('할인 전 단가:', 25, yPos);
      doc.setTextColor(30, 41, 59);
      doc.text(formatCurrency(result.priceBeforeDiscount), 80, yPos);
      yPos += 8;
      
      doc.setTextColor(100, 116, 139);
      doc.text('할인율:', 25, yPos);
      doc.setTextColor(30, 41, 59);
      doc.text(`${(result.discountRate * 100).toFixed(0)}%`, 80, yPos);
      yPos += 8;
      
      doc.setFontSize(12);
      doc.setFillColor(5, 150, 105);
      doc.rect(20, yPos - 5, 170, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(`최종 단가: ${formatCurrency(result.finalPrice)}`, 25, yPos + 7);
      yPos += 20;
    } else if (quoteResult) {
      // 간단한 견적 PDF 생성
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text('Selection Details', 20, yPos);
      
      yPos += 10;
      doc.setFontSize(10);
      Object.entries(quoteResult.selectionLabels).forEach(([key, value]) => {
        doc.setTextColor(100, 116, 139);
        doc.text(`${labelNames[key] || key}:`, 25, yPos);
        doc.setTextColor(30, 41, 59);
        doc.text(value, 80, yPos);
        yPos += 8;
      });
      
      // 구분선
      doc.line(20, yPos + 5, 190, yPos + 5);
      yPos += 20;
      
      // 가격 정보
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text('Price Estimate', 20, yPos);
      yPos += 12;
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text('Unit Price Range:', 25, yPos);
      doc.setTextColor(30, 41, 59);
      doc.text(`${formatPrice(quoteResult.unitPriceRange.min)} ~ ${formatPrice(quoteResult.unitPriceRange.max)}`, 80, yPos);
      yPos += 8;
      
      doc.setTextColor(100, 116, 139);
      doc.text('Total Price Range:', 25, yPos);
      doc.setTextColor(30, 41, 59);
      doc.text(`${formatPrice(quoteResult.totalPriceRange.min)} ~ ${formatPrice(quoteResult.totalPriceRange.max)}`, 80, yPos);
      yPos += 8;
      
      doc.setTextColor(100, 116, 139);
      doc.text('Estimated Delivery:', 25, yPos);
      doc.setTextColor(30, 41, 59);
      doc.text(quoteResult.estimatedDays, 80, yPos);
      yPos += 20;
      
      // 안내 문구
      if (quoteResult.needsConsultation) {
        doc.setFillColor(255, 247, 237);
        doc.rect(20, yPos, 170, 20, 'F');
        doc.setTextColor(194, 65, 12);
        doc.setFontSize(9);
        doc.text('* Special processing required. Please contact us for exact pricing.', 25, yPos + 12);
        yPos += 30;
      }
    }
    
    // 푸터
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 270, 210, 30, 'F');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text('VCCC - Cosmetic Container Coating Quote System', 20, 282);
    doc.text('This is an estimate and may vary based on actual specifications.', 20, 288);
    
    // 다운로드
    doc.save(`VCCC_Quote_${quoteNumber}.pdf`);
  };

  const displayQuoteNumber = quoteType === 'detailed' 
    ? detailedQuoteResult?.quoteNumber 
    : quoteResult?.quoteNumber;
  const displayCreatedAt = quoteType === 'detailed'
    ? detailedQuoteResult?.createdAt
    : quoteResult?.createdAt;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <div className="animate-fade-in">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            견적서가 생성되었습니다
          </h1>
          <p className="text-slate-600">
            견적 번호: <span className="font-semibold text-primary-600">{displayQuoteNumber}</span>
          </p>
        </div>
        
        {quoteType === 'detailed' && detailedQuoteResult ? (
          /* 상세 견적 결과 */
          <DetailedQuoteResultDisplay result={detailedQuoteResult} onDownloadPDF={handleDownloadPDF} />
        ) : quoteResult ? (
          /* 간단한 견적 결과 */
          <>
            <Card className="mb-6 shadow-xl">
              <CardContent>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                  <FileText className="w-6 h-6 text-primary-500" />
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">견적 상세</h2>
                    <p className="text-sm text-slate-500">{formatDate(quoteResult.createdAt)}</p>
                  </div>
                </div>

                {/* Selections */}
                <div className="space-y-3 mb-6">
                  {Object.entries(quoteResult.selectionLabels).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2 text-slate-600">
                        {labelIcons[key]}
                        <span>{labelNames[key] || key}</span>
                      </div>
                      <span className="font-medium text-slate-900">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100 my-6" />

                {/* Price Info */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">예상 단가</span>
                    <span className="text-lg font-bold text-slate-900">
                      {formatPrice(quoteResult.unitPriceRange.min)} ~ {formatPrice(quoteResult.unitPriceRange.max)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">예상 총 금액</span>
                    <span className="text-xl font-bold text-primary-600">
                      {formatPrice(quoteResult.totalPriceRange.min)} ~ {formatPrice(quoteResult.totalPriceRange.max)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="w-4 h-4" />
                      <span>예상 납기</span>
                    </div>
                    <span className="font-semibold text-slate-900">{quoteResult.estimatedDays}</span>
                  </div>
                </div>

                {/* Consultation Notice */}
                {quoteResult.needsConsultation && (
                  <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">별도 상담 필요</p>
                      <p className="text-sm text-amber-700 mt-1">
                        특수 가공이 포함된 견적입니다. 정확한 가격은 상담 후 결정됩니다.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleDownloadPDF}
                size="lg"
                className="flex-1"
                leftIcon={<Download className="w-5 h-5" />}
              >
                PDF 다운로드
              </Button>
              <Link to="/my-quotes" className="flex-1">
                <Button variant="secondary" size="lg" className="w-full" leftIcon={<FileText className="w-5 h-5" />}>
                  내 견적 목록
                </Button>
              </Link>
              <Link to="/" className="flex-1">
                <Button variant="outline" size="lg" className="w-full" leftIcon={<Home className="w-5 h-5" />}>
                  홈으로
                </Button>
              </Link>
            </div>
          </>
        ) : null}


        {/* Quote ID for reference */}
        {id && (
          <p className="text-center text-sm text-slate-400 mt-6">
            견적 ID: {id}
          </p>
        )}
      </div>
    </div>
  );
};

