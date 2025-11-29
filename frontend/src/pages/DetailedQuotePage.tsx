import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  calculateDetailedQuote,
  DetailedQuoteInput,
  rawMaterialData,
  defaultSettings,
  Material,
} from '@/lib/detailedQuoteData';
import {
  Plus,
  Trash2,
  Settings,
  BookOpen,
  Calculator,
  X,
} from 'lucide-react';

export const DetailedQuotePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<DetailedQuoteInput>({
    orderQuantity: 0,
    hourlyProduction: 0,
    processType: 'coating',
    submittedTo: '',
    itemName: '',
    partName: '',
    materials: [],
    otherCost1: 0,
    otherCost2: 1,
    otherCost3: 1,
    ...defaultSettings,
  });
  
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleInputChange = (field: keyof DetailedQuoteInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  
  const addMaterialRow = () => {
    setFormData((prev) => ({
      ...prev,
      materials: [...prev.materials, { name: '', price: 0, usage: 0 }],
    }));
  };
  
  const removeMaterialRow = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index),
    }));
  };
  
  const updateMaterial = (index: number, field: keyof Material, value: any) => {
    setFormData((prev) => {
      const newMaterials = [...prev.materials];
      newMaterials[index] = { ...newMaterials[index], [field]: value };
      
      // 원료명 선택 시 자동으로 가격 입력
      if (field === 'name') {
        const material = rawMaterialData.find((m) => m.name === value);
        if (material) {
          newMaterials[index].price = material.price;
        }
      }
      
      return { ...prev, materials: newMaterials };
    });
  };
  
  const handleSubmit = async () => {
    if (!user) return;
    
    // 유효성 검사
    if (!formData.orderQuantity || !formData.hourlyProduction) {
      alert('발주 수량과 시간당 생산량을 입력해주세요.');
      return;
    }
    
    if (formData.materials.length === 0) {
      alert('최소 1개 이상의 원료를 추가해주세요.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 견적 계산
      const quoteResult = calculateDetailedQuote(formData);
      
      // Firestore에 저장
      const quoteData = {
        userId: user.uid,
        userEmail: user.email,
        type: 'detailed',
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
  
  // 실시간 계산 결과 미리보기
  const previewResult = React.useMemo(() => {
    if (!formData.orderQuantity || !formData.hourlyProduction || formData.materials.length === 0) {
      return null;
    }
    return calculateDetailedQuote(formData);
  }, [formData]);
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 입력 폼 */}
        <div className="space-y-6">
          {/* 헤더 버튼 */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      if (confirm('모든 입력을 초기화하시겠습니까?')) {
                        setFormData({
                          orderQuantity: 0,
                          hourlyProduction: 0,
                          processType: 'coating',
                          submittedTo: '',
                          itemName: '',
                          partName: '',
                          materials: [],
                          otherCost1: 0,
                          otherCost2: 1,
                          otherCost3: 1,
                          ...defaultSettings,
                        });
                      }
                    }}
                    leftIcon={<X className="w-4 h-4" />}
                  >
                    초기화
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowSettingsModal(true)}
                    leftIcon={<Settings className="w-4 h-4" />}
                  >
                    기본 정보
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFormulaModal(true)}
                  leftIcon={<BookOpen className="w-4 h-4" />}
                >
                  수식 설명
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* 견적 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>견적 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="발주 수량"
                  type="number"
                  placeholder="예: 15000"
                  value={formData.orderQuantity || ''}
                  onChange={(e) => handleInputChange('orderQuantity', parseFloat(e.target.value) || 0)}
                />
                <Input
                  label="시간당 생산량 (개)"
                  type="number"
                  placeholder="예: 1200"
                  value={formData.hourlyProduction || ''}
                  onChange={(e) => handleInputChange('hourlyProduction', parseFloat(e.target.value) || 0)}
                />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    공정 선택
                  </label>
                  <select
                    value={formData.processType}
                    onChange={(e) => handleInputChange('processType', e.target.value as 'coating' | 'deposition')}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="coating">코팅</option>
                    <option value="deposition">증착</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="제출처"
                    type="text"
                    placeholder="귀하"
                    value={formData.submittedTo}
                    onChange={(e) => handleInputChange('submittedTo', e.target.value)}
                  />
                </div>
                <Input
                  label="품명"
                  type="text"
                  placeholder="제품 A"
                  value={formData.itemName}
                  onChange={(e) => handleInputChange('itemName', e.target.value)}
                />
                <Input
                  label="부속명"
                  type="text"
                  placeholder="부품 B"
                  value={formData.partName}
                  onChange={(e) => handleInputChange('partName', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* 원료비 계산 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>원료비 계산</CardTitle>
                <Button
                  size="sm"
                  onClick={addMaterialRow}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  원료 추가
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-2 px-2 text-left font-semibold text-slate-700">원료명</th>
                      <th className="py-2 px-2 text-left font-semibold text-slate-700">g당 단가(원)</th>
                      <th className="py-2 px-2 text-left font-semibold text-slate-700">개당 사용량(g)</th>
                      <th className="py-2 px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.materials.map((material, index) => (
                      <tr key={index} className="border-b border-slate-100">
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            list={`material-list-${index}`}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm"
                            placeholder="원료명 선택/입력"
                            value={material.name}
                            onChange={(e) => updateMaterial(index, 'name', e.target.value)}
                          />
                          <datalist id={`material-list-${index}`}>
                            {rawMaterialData.map((m) => (
                              <option key={m.name} value={m.name} />
                            ))}
                          </datalist>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            step="0.01"
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm"
                            placeholder="자동입력"
                            value={material.price || ''}
                            onChange={(e) => updateMaterial(index, 'price', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            step="0.01"
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm"
                            placeholder="0.5"
                            value={material.usage || ''}
                            onChange={(e) => updateMaterial(index, 'usage', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeMaterialRow(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {formData.materials.length === 0 && (
                  <p className="text-center text-slate-500 py-4 text-sm">
                    원료를 추가하려면 "원료 추가" 버튼을 클릭하세요.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* 기타 비용 */}
          <Card>
            <CardHeader>
              <CardTitle>기타 비용 입력 ( / )</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="기타 비용 1"
                  type="number"
                  placeholder="0"
                  value={formData.otherCost1 || ''}
                  onChange={(e) => handleInputChange('otherCost1', parseFloat(e.target.value) || 0)}
                />
                <Input
                  label="기타 비용 2"
                  type="number"
                  placeholder="1"
                  value={formData.otherCost2 || ''}
                  onChange={(e) => handleInputChange('otherCost2', parseFloat(e.target.value) || 1)}
                />
                <Input
                  label="기타 비용 3"
                  type="number"
                  placeholder="1"
                  value={formData.otherCost3 || ''}
                  onChange={(e) => handleInputChange('otherCost3', parseFloat(e.target.value) || 1)}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* 제출 버튼 */}
          <Button
            onClick={handleSubmit}
            size="lg"
            className="w-full"
            isLoading={isSubmitting}
            disabled={!previewResult}
            leftIcon={<Calculator className="w-5 h-5" />}
          >
            견적서 생성
          </Button>
        </div>
        
        {/* 미리보기 */}
        <div className="lg:sticky lg:top-8 h-fit">
          <Card>
            <CardHeader>
              <CardTitle>견적 미리보기</CardTitle>
            </CardHeader>
            <CardContent>
              {previewResult ? (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-bold text-lg mb-3 text-emerald-800">1. 1차 기본 원가 (개당)</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>인건비</span>
                        <span className="font-mono font-semibold text-blue-600">
                          {previewResult.laborCostPerUnit.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 원
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>원료비</span>
                        <span className="font-mono font-semibold text-blue-600">
                          {previewResult.materialCostPerUnit.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 원
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>전기료</span>
                        <span className="font-mono font-semibold text-blue-600">
                          {previewResult.elecCostPerUnit.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 원
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>폐기물 처리비</span>
                        <span className="font-mono font-semibold text-blue-600">
                          {previewResult.wasteCostPerUnit.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 원
                        </span>
                      </div>
                    </div>
                    <div className="border-t mt-3 pt-2 flex justify-between font-bold">
                      <span>소계 (A)</span>
                      <span className="font-mono text-blue-600">
                        {previewResult.primaryCost.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 원
                      </span>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-bold text-lg mb-3 text-emerald-800">2. 2차 비용 (개당)</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>물류비용 (A x 5%)</span>
                        <span className="font-mono font-semibold text-blue-600">
                          {previewResult.logisticsCost.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 원
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>관리비용 (A x 20%)</span>
                        <span className="font-mono font-semibold text-blue-600">
                          {previewResult.adminCost.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 원
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>기타비용 합계</span>
                        <span className="font-mono font-semibold text-blue-600">
                          {previewResult.totalOtherCost.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 원
                        </span>
                      </div>
                    </div>
                    <div className="border-t mt-3 pt-2 flex justify-between font-bold">
                      <span>소계 (B)</span>
                      <span className="font-mono text-blue-600">
                        {previewResult.totalSecondaryCost.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 원
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-slate-100">
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>총원가 (A + B)</span>
                      <span className="font-mono text-red-600">
                        {previewResult.totalCost.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 원
                      </span>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-bold text-lg mb-3 text-emerald-800">3. 최종 제안 단가</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>이윤 (총원가 x 10%)</span>
                        <span className="font-mono font-semibold text-blue-600">
                          {previewResult.profit.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 원
                        </span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span>할인 전 단가</span>
                        <span className="font-bold">
                          {previewResult.priceBeforeDiscount.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 원
                        </span>
                      </div>
                      <div className="flex justify-between pt-2">
                        <span>발주 수량</span>
                        <span className="text-blue-600 font-bold">{formData.orderQuantity.toLocaleString()} 개</span>
                      </div>
                      <div className="flex justify-between">
                        <span>적용 할인율</span>
                        <span className="text-blue-600 font-bold">{(previewResult.discountRate * 100).toFixed(0)} %</span>
                      </div>
                      <div className="flex justify-between">
                        <span>할인 금액</span>
                        <span className="text-blue-600 font-bold">
                          - {previewResult.discountAmount.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 원
                        </span>
                      </div>
                    </div>
                    <div className="border-t mt-3 pt-2 flex justify-between items-center font-bold text-xl text-white bg-emerald-600 -m-4 mt-3 p-4 rounded-b-lg">
                      <span>할인 적용 최종 단가</span>
                      <span className="font-mono text-white">
                        {previewResult.finalPrice.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 원
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p>결과를 보려면 좌측에 정보를 입력하세요.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* 기본 정보 설정 모달 */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowSettingsModal(false)}>
          <Card className="max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>기본 정보 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="1인당 인건비"
                type="number"
                value={formData.laborCostPerPerson || ''}
                onChange={(e) => handleInputChange('laborCostPerPerson', parseFloat(e.target.value) || 0)}
              />
              <Input
                label="시간당 전기료 (코팅)"
                type="number"
                value={formData.elecCostCoating || ''}
                onChange={(e) => handleInputChange('elecCostCoating', parseFloat(e.target.value) || 0)}
              />
              <Input
                label="시간당 폐기물 비용 (코팅)"
                type="number"
                value={formData.wasteCostCoating || ''}
                onChange={(e) => handleInputChange('wasteCostCoating', parseFloat(e.target.value) || 0)}
              />
              <Input
                label="시간당 전기료 (증착)"
                type="number"
                value={formData.elecCostDeposition || ''}
                onChange={(e) => handleInputChange('elecCostDeposition', parseFloat(e.target.value) || 0)}
              />
              <Input
                label="시간당 폐기물 비용 (증착)"
                type="number"
                value={formData.wasteCostDeposition || ''}
                onChange={(e) => handleInputChange('wasteCostDeposition', parseFloat(e.target.value) || 0)}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={() => setShowSettingsModal(false)}>
                  닫기
                </Button>
                <Button onClick={() => setShowSettingsModal(false)}>
                  저장하고 닫기
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* 수식 설명 모달 */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowFormulaModal(false)}>
          <Card className="max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>수식 설명서</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700">
              <div>
                <p className="font-bold mb-2">A. 1차 기본 원가 (개당)</p>
                <ul className="list-disc list-inside pl-2 space-y-1">
                  <li><b>인건비</b>: (팀 인원 x 1인당 인건비) / 시간당 생산량</li>
                  <li><b>원료비</b>: 모든 원료의 (g당 단가 x 개당 사용량)의 합계</li>
                  <li><b>전기료</b>: 시간당 전기료 / 시간당 생산량</li>
                  <li><b>폐기물비</b>: 시간당 폐기물 비용 / 시간당 생산량</li>
                  <li><b>1차 원가 합계</b>: 위 4가지 비용의 총합</li>
                </ul>
              </div>
              <div>
                <p className="font-bold mb-2">B. 2차 비용 (개당)</p>
                <ul className="list-disc list-inside pl-2 space-y-1">
                  <li><b>물류비용</b>: 1차 원가 합계 x 5%</li>
                  <li><b>관리비용</b>: 1차 원가 합계 x 20%</li>
                  <li><b>기타비용</b>: 기타비용1 / 기타비용2 / 기타비용3 (0인 값은 제외)</li>
                  <li><b>2차 비용 합계</b>: 위 3가지 비용의 총합</li>
                </ul>
              </div>
              <div>
                <p className="font-bold mb-2">C. 최종 단가</p>
                <ul className="list-disc list-inside pl-2 space-y-1">
                  <li><b>총원가</b>: 1차 원가 합계 + 2차 비용 합계</li>
                  <li><b>이윤</b>: 총원가 x 10%</li>
                  <li><b>할인 전 단가</b>: 총원가 + 이윤</li>
                  <li><b>할인율</b>: 발주 수량에 따라 0%, 3%, 5% 자동 적용</li>
                  <li><b>최종 단가</b>: 할인 전 단가 - (할인 전 단가 x 할인율)</li>
                </ul>
              </div>
              <div className="flex justify-end">
                <Button variant="secondary" onClick={() => setShowFormulaModal(false)}>
                  닫기
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

