// 상세 견적 계산 데이터 및 로직

export interface Material {
  name: string;
  price: number; // g당 단가
  usage: number; // 개당 사용량(g)
}

export interface DetailedQuoteInput {
  // 견적 정보
  orderQuantity: number; // 발주 수량
  hourlyProduction: number; // 시간당 생산량
  processType: 'coating' | 'deposition'; // 공정 선택
  submittedTo: string; // 제출처
  itemName: string; // 품명
  partName: string; // 부속명
  
  // 원료비
  materials: Material[];
  
  // 기타 비용
  otherCost1: number;
  otherCost2: number;
  otherCost3: number;
  
  // 기본 설정
  laborCostPerPerson: number; // 1인당 인건비
  elecCostCoating: number; // 시간당 전기료 (코팅)
  wasteCostCoating: number; // 시간당 폐기물 비용 (코팅)
  elecCostDeposition: number; // 시간당 전기료 (증착)
  wasteCostDeposition: number; // 시간당 폐기물 비용 (증착)
}

export interface DetailedQuoteResult {
  // 입력 정보
  input: DetailedQuoteInput;
  
  // 1차 기본 원가 (개당)
  laborCostPerUnit: number; // 인건비
  materialCostPerUnit: number; // 원료비
  elecCostPerUnit: number; // 전기료
  wasteCostPerUnit: number; // 폐기물 처리비
  primaryCost: number; // 1차 원가 합계
  
  // 2차 비용 (개당)
  logisticsCost: number; // 물류비용 (1차 원가 x 5%)
  adminCost: number; // 관리비용 (1차 원가 x 20%)
  totalOtherCost: number; // 기타비용 합계
  totalSecondaryCost: number; // 2차 비용 합계
  
  // 최종 단가
  totalCost: number; // 총원가
  profit: number; // 이윤 (총원가 x 10%)
  priceBeforeDiscount: number; // 할인 전 단가
  discountRate: number; // 할인율
  discountAmount: number; // 할인 금액
  finalPrice: number; // 최종 단가
  
  // 메타 정보
  quoteNumber: string;
  createdAt: Date;
  processTypeDisplay: string;
}

// 원료 데이터베이스
export const rawMaterialData: Array<{ name: string; price: number }> = [
  { name: '프라이마 전처리', price: 7 },
  { name: '하도유광-ABS', price: 9 },
  { name: '상도유광-인쇄용', price: 9 },
  { name: '하도유광-멀티용', price: 11 },
  { name: '상도유광-박용', price: 9 },
  { name: '프라이마-P.P용', price: 8 },
  { name: '하도유광-P.P용', price: 11 },
  { name: '하도무광-ABS', price: 10 },
  { name: '상도무광-박용', price: 10 },
  { name: '하도무광-P.P', price: 11 },
  { name: '레인보우하도유광', price: 13 },
  { name: '주제', price: 20 },
  { name: '희석제', price: 5.5 },
  { name: '세척신나', price: 4 },
  { name: '안료', price: 10 },
];

// 기본 설정값
export const defaultSettings = {
  laborCostPerPerson: 14000,
  elecCostCoating: 36000,
  wasteCostCoating: 533,
  elecCostDeposition: 72000,
  wasteCostDeposition: 1066,
};

// 공정별 설정
const processConfig = {
  coating: {
    teamSize: 15,
    hourlyElecCost: defaultSettings.elecCostCoating,
    hourlyWasteCost: defaultSettings.wasteCostCoating,
  },
  deposition: {
    teamSize: 30,
    hourlyElecCost: defaultSettings.elecCostDeposition,
    hourlyWasteCost: defaultSettings.wasteCostDeposition,
  },
};

// 안전한 나눗셈
const safeDivide = (numerator: number, denominator: number): number => {
  return denominator > 0 ? numerator / denominator : 0;
};

// 상세 견적 계산 함수
export function calculateDetailedQuote(input: DetailedQuoteInput): DetailedQuoteResult {
  const processTypeDisplay = input.processType === 'coating' ? '코팅' : '증착';
  const config = processConfig[input.processType];
  
  // 기본 설정 적용
  const baseSettings = {
    laborCostPerPerson: input.laborCostPerPerson || defaultSettings.laborCostPerPerson,
    elecCostCoating: input.elecCostCoating || defaultSettings.elecCostCoating,
    wasteCostCoating: input.wasteCostCoating || defaultSettings.wasteCostCoating,
    elecCostDeposition: input.elecCostDeposition || defaultSettings.elecCostDeposition,
    wasteCostDeposition: input.wasteCostDeposition || defaultSettings.wasteCostDeposition,
  };
  
  // 공정별 전기료/폐기물비 적용
  const hourlyElecCost = input.processType === 'coating' 
    ? baseSettings.elecCostCoating 
    : baseSettings.elecCostDeposition;
  const hourlyWasteCost = input.processType === 'coating'
    ? baseSettings.wasteCostCoating
    : baseSettings.wasteCostDeposition;
  
  // 1차 기본 원가 계산 (개당)
  const laborCostPerUnit = safeDivide(
    config.teamSize * baseSettings.laborCostPerPerson,
    input.hourlyProduction
  );
  
  // 원료비 계산
  const materialCostPerUnit = input.materials.reduce((sum, material) => {
    return sum + (material.price * material.usage);
  }, 0);
  
  const elecCostPerUnit = safeDivide(hourlyElecCost, input.hourlyProduction);
  const wasteCostPerUnit = safeDivide(hourlyWasteCost, input.hourlyProduction);
  
  const primaryCost = laborCostPerUnit + materialCostPerUnit + elecCostPerUnit + wasteCostPerUnit;
  
  // 2차 비용 계산 (개당)
  const logisticsCost = primaryCost * 0.05; // 물류비용 (1차 원가 x 5%)
  const adminCost = primaryCost * 0.20; // 관리비용 (1차 원가 x 20%)
  
  // 기타비용 계산: 기타비용1 / 기타비용2 / 기타비용3 (0인 값은 제외)
  let totalOtherCost = input.otherCost1 || 0;
  if (input.otherCost2 !== 0) totalOtherCost /= input.otherCost2;
  if (input.otherCost3 !== 0) totalOtherCost /= input.otherCost3;
  
  const totalSecondaryCost = logisticsCost + adminCost + totalOtherCost;
  
  // 최종 단가 계산
  const totalCost = primaryCost + totalSecondaryCost;
  const profit = totalCost * 0.10; // 이윤 (총원가 x 10%)
  const priceBeforeDiscount = totalCost + profit;
  
  // 할인율 계산 (발주 수량에 따라)
  let discountRate = 0;
  if (input.orderQuantity > 50000) {
    discountRate = 0.05; // 5%
  } else if (input.orderQuantity > 10000) {
    discountRate = 0.03; // 3%
  }
  
  const discountAmount = priceBeforeDiscount * discountRate;
  const finalPrice = priceBeforeDiscount - discountAmount;
  
  // 견적번호 생성
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const quoteNumber = `QT-${year}${month}${day}-${random}`;
  
  return {
    input,
    laborCostPerUnit,
    materialCostPerUnit,
    elecCostPerUnit,
    wasteCostPerUnit,
    primaryCost,
    logisticsCost,
    adminCost,
    totalOtherCost,
    totalSecondaryCost,
    totalCost,
    profit,
    priceBeforeDiscount,
    discountRate,
    discountAmount,
    finalPrice,
    quoteNumber,
    createdAt: now,
    processTypeDisplay,
  };
}

