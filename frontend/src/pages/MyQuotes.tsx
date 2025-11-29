import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { formatPrice, formatDate } from '@/lib/utils';
import { 
  FileText, 
  Plus, 
  Calendar, 
  Package,
  Clock,
  ChevronRight,
  Loader2,
  Inbox,
  Search,
  Filter
} from 'lucide-react';

interface Quote {
  id: string;
  quoteNumber: string;
  selectionLabels: Record<string, string>;
  unitPriceRange: { min: number; max: number };
  totalPriceRange: { min: number; max: number };
  estimatedDays: string;
  createdAt: Date;
  status: string;
  needsConsultation: boolean;
}

export const MyQuotes: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { user } = useAuth();

  useEffect(() => {
    const fetchQuotes = async () => {
      if (!user) return;

      try {
        const quotesRef = collection(db, 'quotes');
        const q = query(
          quotesRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const fetchedQuotes: Quote[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedQuotes.push({
            id: doc.id,
            quoteNumber: data.quoteNumber,
            selectionLabels: data.selectionLabels,
            unitPriceRange: data.unitPriceRange,
            totalPriceRange: data.totalPriceRange,
            estimatedDays: data.estimatedDays,
            createdAt: data.createdAt.toDate(),
            status: data.status,
            needsConsultation: data.needsConsultation,
          });
        });
        
        setQuotes(fetchedQuotes);
      } catch (error) {
        console.error('Error fetching quotes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, [user]);

  // 필터링된 견적 목록
  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      // 검색어 필터
      const matchesSearch = 
        searchTerm === '' ||
        quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        Object.values(quote.selectionLabels).some((label) =>
          label.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      // 상태 필터
      const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [quotes, searchTerm, statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">견적 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">내 견적 목록</h1>
            <p className="text-slate-600 mt-1">
              총 {quotes.length}건의 견적이 있습니다
              {filteredQuotes.length !== quotes.length && (
                <span className="text-primary-600"> ({filteredQuotes.length}건 표시)</span>
              )}
            </p>
          </div>
          <Link to="/quote">
            <Button leftIcon={<Plus className="w-5 h-5" />}>
              새 견적 요청
            </Button>
          </Link>
        </div>

        {/* Search and Filter */}
        {quotes.length > 0 && (
          <Card className="mb-6" padding="sm">
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="견적번호 또는 내용으로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search className="w-5 h-5" />}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-slate-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">전체</option>
                    <option value="pending">검토 대기</option>
                    <option value="confirmed">확정</option>
                    <option value="rejected">반려</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quotes List */}
        {quotes.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Inbox className="w-10 h-10 text-slate-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-700 mb-2">
                아직 견적 내역이 없습니다
              </h2>
              <p className="text-slate-500 mb-6">
                첫 번째 견적을 요청해보세요!
              </p>
              <Link to="/quote">
                <Button leftIcon={<Plus className="w-5 h-5" />}>
                  견적 요청하기
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : filteredQuotes.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Search className="w-10 h-10 text-slate-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-700 mb-2">
                검색 결과가 없습니다
              </h2>
              <p className="text-slate-500 mb-6">
                다른 검색어나 필터를 시도해보세요.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
              >
                필터 초기화
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredQuotes.map((quote, index) => (
              <Link key={quote.id} to={`/quote-result/${quote.id}`}>
                <Card
                  hover
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Icon */}
                    <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-primary-100 items-center justify-center flex-shrink-0">
                      <FileText className="w-7 h-7 text-primary-600" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-bold text-slate-900">
                            {quote.quoteNumber}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(quote.createdAt)}</span>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          quote.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : quote.status === 'confirmed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {quote.status === 'pending' ? '검토 대기' : 
                           quote.status === 'confirmed' ? '확정' : quote.status}
                        </span>
                      </div>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {Object.values(quote.selectionLabels).slice(0, 3).map((label, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-xs text-slate-600"
                          >
                            {label}
                          </span>
                        ))}
                        {Object.values(quote.selectionLabels).length > 3 && (
                          <span className="text-xs text-slate-400">
                            +{Object.values(quote.selectionLabels).length - 3}
                          </span>
                        )}
                      </div>
                      
                      {/* Price & Delivery */}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600">예상 금액:</span>
                          <span className="font-semibold text-primary-600">
                            {formatPrice(quote.totalPriceRange.min)} ~ {formatPrice(quote.totalPriceRange.max)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600">납기:</span>
                          <span className="font-medium text-slate-900">{quote.estimatedDays}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Arrow */}
                    <ChevronRight className="hidden sm:block w-5 h-5 text-slate-400 flex-shrink-0" />
                  </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

