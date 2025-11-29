import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { DetailedQuoteResult } from '@/lib/detailedQuoteData';
import { formatDate } from '@/lib/utils';
import { Download, FileText, Home } from 'lucide-react';

interface Props {
  result: DetailedQuoteResult;
  onDownloadPDF: () => void;
}

export const DetailedQuoteResultDisplay: React.FC<Props> = ({ result, onDownloadPDF }) => {
  const formatCurrency = (num: number) =>
    `${num.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 원`;

  return (
    <>
      {/* 견적 정보 */}
      <Card className="mb-6 shadow-xl">
        <CardContent>
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <FileText className="w-6 h-6 text-primary-500" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">견적 상세</h2>
              <p className="text-sm text-slate-500">{formatDate(result.createdAt)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <span className="text-sm text-slate-600">제출처</span>
              <p className="font-medium text-slate-900">{result.input.submittedTo || '-'}</p>
            </div>
            <div>
              <span className="text-sm text-slate-600">공정</span>
              <p className="font-medium text-slate-900">{result.processTypeDisplay}</p>
            </div>
            <div>
              <span className="text-sm text-slate-600">품명</span>
              <p className="font-medium text-slate-900">{result.input.itemName || '-'}</p>
            </div>
            <div>
              <span className="text-sm text-slate-600">부속명</span>
              <p className="font-medium text-slate-900">{result.input.partName || '-'}</p>
            </div>
            <div>
              <span className="text-sm text-slate-600">발주 수량</span>
              <p className="font-medium text-slate-900">{result.input.orderQuantity.toLocaleString()} 개</p>
            </div>
            <div>
              <span className="text-sm text-slate-600">시간당 생산량</span>
              <p className="font-medium text-slate-900">{result.input.hourlyProduction.toLocaleString()} 개</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 1차 기본 원가 */}
      <Card className="mb-6">
        <CardContent>
          <h4 className="font-bold text-lg mb-3 text-emerald-800">1. 1차 기본 원가 (개당)</h4>
          <div className="space-y-2 text-sm mb-3">
            <div className="flex justify-between">
              <span>인건비</span>
              <span className="font-mono font-semibold text-blue-600">{formatCurrency(result.laborCostPerUnit)}</span>
            </div>
            <div className="flex justify-between">
              <span>원료비</span>
              <span className="font-mono font-semibold text-blue-600">{formatCurrency(result.materialCostPerUnit)}</span>
            </div>
            <div className="flex justify-between">
              <span>전기료</span>
              <span className="font-mono font-semibold text-blue-600">{formatCurrency(result.elecCostPerUnit)}</span>
            </div>
            <div className="flex justify-between">
              <span>폐기물 처리비</span>
              <span className="font-mono font-semibold text-blue-600">{formatCurrency(result.wasteCostPerUnit)}</span>
            </div>
          </div>
          <div className="border-t pt-2 flex justify-between font-bold">
            <span>소계 (A)</span>
            <span className="font-mono text-blue-600">{formatCurrency(result.primaryCost)}</span>
          </div>
        </CardContent>
      </Card>

      {/* 2차 비용 */}
      <Card className="mb-6">
        <CardContent>
          <h4 className="font-bold text-lg mb-3 text-emerald-800">2. 2차 비용 (개당)</h4>
          <div className="space-y-2 text-sm mb-3">
            <div className="flex justify-between">
              <span>물류비용 (A x 5%)</span>
              <span className="font-mono font-semibold text-blue-600">{formatCurrency(result.logisticsCost)}</span>
            </div>
            <div className="flex justify-between">
              <span>관리비용 (A x 20%)</span>
              <span className="font-mono font-semibold text-blue-600">{formatCurrency(result.adminCost)}</span>
            </div>
            <div className="flex justify-between">
              <span>기타비용 합계</span>
              <span className="font-mono font-semibold text-blue-600">{formatCurrency(result.totalOtherCost)}</span>
            </div>
          </div>
          <div className="border-t pt-2 flex justify-between font-bold">
            <span>소계 (B)</span>
            <span className="font-mono text-blue-600">{formatCurrency(result.totalSecondaryCost)}</span>
          </div>
        </CardContent>
      </Card>

      {/* 총원가 */}
      <Card className="mb-6 bg-slate-100">
        <CardContent>
          <div className="flex justify-between items-center font-bold text-lg">
            <span>총원가 (A + B)</span>
            <span className="font-mono text-red-600">{formatCurrency(result.totalCost)}</span>
          </div>
        </CardContent>
      </Card>

      {/* 최종 제안 단가 */}
      <Card className="mb-6">
        <CardContent>
          <h4 className="font-bold text-lg mb-3 text-emerald-800">3. 최종 제안 단가</h4>
          <div className="space-y-2 text-sm mb-3">
            <div className="flex justify-between">
              <span>이윤 (총원가 x 10%)</span>
              <span className="font-mono font-semibold text-blue-600">{formatCurrency(result.profit)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>할인 전 단가</span>
              <span className="font-bold">{formatCurrency(result.priceBeforeDiscount)}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span>발주 수량</span>
              <span className="text-blue-600 font-bold">{result.input.orderQuantity.toLocaleString()} 개</span>
            </div>
            <div className="flex justify-between">
              <span>적용 할인율</span>
              <span className="text-blue-600 font-bold">{(result.discountRate * 100).toFixed(0)} %</span>
            </div>
            <div className="flex justify-between">
              <span>할인 금액</span>
              <span className="text-blue-600 font-bold">- {formatCurrency(result.discountAmount)}</span>
            </div>
          </div>
          <div className="border-t mt-3 pt-2 flex justify-between items-center font-bold text-xl text-white bg-emerald-600 -m-6 mt-3 p-4 rounded-b-lg">
            <span>할인 적용 최종 단가</span>
            <span className="font-mono text-white">{formatCurrency(result.finalPrice)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={onDownloadPDF}
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
  );
};


