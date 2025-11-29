import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { formatPrice, formatDate } from '@/lib/utils';
import { 
  FileText, 
  TrendingUp,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw
} from 'lucide-react';

interface QuoteData {
  id: string;
  quoteNumber: string;
  userEmail: string;
  selectionLabels: Record<string, string>;
  totalPriceRange: { min: number; max: number };
  estimatedDays: string;
  createdAt: Date;
  status: string;
}

export const Admin: React.FC = () => {
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { userData } = useAuth();

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const quotesRef = collection(db, 'quotes');
      const q = query(quotesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const fetchedQuotes: QuoteData[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedQuotes.push({
          id: doc.id,
          quoteNumber: data.quoteNumber,
          userEmail: data.userEmail,
          selectionLabels: data.selectionLabels,
          totalPriceRange: data.totalPriceRange,
          estimatedDays: data.estimatedDays,
          createdAt: data.createdAt.toDate(),
          status: data.status,
        });
      });
      
      setQuotes(fetchedQuotes);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const updateQuoteStatus = async (quoteId: string, newStatus: string) => {
    setUpdating(quoteId);
    try {
      await updateDoc(doc(db, 'quotes', quoteId), {
        status: newStatus,
      });
      setQuotes((prev) =>
        prev.map((q) => (q.id === quoteId ? { ...q, status: newStatus } : q))
      );
    } catch (error) {
      console.error('Error updating quote:', error);
    } finally {
      setUpdating(null);
    }
  };

  if (!userData?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md text-center">
          <CardContent className="py-12">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">접근 권한이 없습니다</h2>
            <p className="text-slate-600">관리자만 접근할 수 있는 페이지입니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Stats
  const totalQuotes = quotes.length;
  const pendingQuotes = quotes.filter((q) => q.status === 'pending').length;
  const confirmedQuotes = quotes.filter((q) => q.status === 'confirmed').length;
  const totalEstimatedRevenue = quotes.reduce(
    (sum, q) => sum + (q.totalPriceRange.min + q.totalPriceRange.max) / 2,
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">관리자 대시보드</h1>
            <p className="text-slate-600 mt-1">견적 현황을 관리하세요</p>
          </div>
          <Button
            variant="secondary"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={fetchQuotes}
          >
            새로고침
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">전체 견적</p>
                <p className="text-2xl font-bold text-slate-900">{totalQuotes}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">검토 대기</p>
                <p className="text-2xl font-bold text-amber-600">{pendingQuotes}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">확정</p>
                <p className="text-2xl font-bold text-green-600">{confirmedQuotes}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">예상 매출</p>
                <p className="text-xl font-bold text-slate-900">
                  {formatPrice(Math.round(totalEstimatedRevenue))}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quotes Table */}
        <Card>
          <CardHeader>
            <CardTitle>전체 견적 목록</CardTitle>
            <CardDescription>모든 고객의 견적 요청을 확인하고 상태를 변경할 수 있습니다</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">견적번호</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">고객</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">내용</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">예상 금액</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">일자</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">상태</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((quote) => (
                    <tr key={quote.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm text-primary-600">{quote.quoteNumber}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-slate-700">{quote.userEmail}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {Object.values(quote.selectionLabels).slice(0, 2).map((label, i) => (
                            <span
                              key={i}
                              className="inline-block px-2 py-0.5 rounded bg-slate-100 text-xs text-slate-600"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-slate-900">
                          {formatPrice(quote.totalPriceRange.min)} ~
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-slate-500">{formatDate(quote.createdAt)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          quote.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : quote.status === 'confirmed'
                            ? 'bg-green-100 text-green-700'
                            : quote.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {quote.status === 'pending' ? '검토 대기' :
                           quote.status === 'confirmed' ? '확정' :
                           quote.status === 'rejected' ? '반려' : quote.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateQuoteStatus(quote.id, 'confirmed')}
                            disabled={updating === quote.id || quote.status === 'confirmed'}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            {updating === quote.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateQuoteStatus(quote.id, 'rejected')}
                            disabled={updating === quote.id || quote.status === 'rejected'}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

