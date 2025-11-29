// 견적 질문 및 옵션 데이터

export interface QuoteOption {
  id: string;
  label: string;
  description?: string;
  priceMultiplier?: number;
}

export interface QuoteQuestion {
  id: string;
  step: number;
  title: string;
  description: string;
  options: QuoteOption[];
}

export const quoteQuestions: QuoteQuestion[] = [
  {
    id: 'containerType',
    step: 1,
    title: '용기 종류를 선택해주세요',
    description: '도장을 진행할 화장품 용기의 종류를 선택하세요',
    options: [
      { id: 'bottle', label: '병 (유리/플라스틱)', description: '스킨, 로션, 세럼 등', priceMultiplier: 1.0 },
      { id: 'tube', label: '튜브', description: '핸드크림, 클렌저 등', priceMultiplier: 0.8 },
      { id: 'pump', label: '펌프 용기', description: '펌프 타입 용기', priceMultiplier: 1.2 },
      { id: 'cap', label: '캡/뚜껑', description: '캡, 뚜껑 단독', priceMultiplier: 0.6 },
      { id: 'jar', label: '자 (Jar)', description: '크림, 팩 등', priceMultiplier: 1.1 },
      { id: 'other', label: '기타', description: '위에 해당하지 않는 용기', priceMultiplier: 1.0 },
    ],
  },
  {
    id: 'containerSize',
    step: 2,
    title: '용기 크기/용량을 선택해주세요',
    description: '용기의 용량 범위를 선택하세요',
    options: [
      { id: 'xs', label: '10ml 이하', description: '소형 샘플, 립글로스 등', priceMultiplier: 0.7 },
      { id: 'small', label: '10ml ~ 50ml', description: '소형 용기', priceMultiplier: 0.85 },
      { id: 'medium', label: '50ml ~ 100ml', description: '중형 용기', priceMultiplier: 1.0 },
      { id: 'large', label: '100ml ~ 200ml', description: '대형 용기', priceMultiplier: 1.15 },
      { id: 'xl', label: '200ml 이상', description: '대용량 용기', priceMultiplier: 1.3 },
    ],
  },
  {
    id: 'coatingType',
    step: 3,
    title: '도장 종류를 선택해주세요',
    description: '원하시는 도장 방식을 선택하세요',
    options: [
      { id: 'vacuum', label: '증착 (Vacuum Coating)', description: '메탈릭한 광택 효과', priceMultiplier: 1.5 },
      { id: 'coating', label: '코팅 (외부 코팅)', description: '색상 및 보호 코팅', priceMultiplier: 1.0 },
      { id: 'innerCoating', label: '내부 코팅', description: '용기 내부 보호 코팅', priceMultiplier: 1.2 },
      { id: 'combined', label: '복합 (2가지 이상)', description: '증착+코팅 등 복합 처리', priceMultiplier: 2.0 },
    ],
  },
  {
    id: 'color',
    step: 4,
    title: '색상을 선택해주세요',
    description: '도장에 적용할 색상 유형을 선택하세요',
    options: [
      { id: 'solid', label: '단색', description: '단일 색상', priceMultiplier: 1.0 },
      { id: 'gradient', label: '그라데이션', description: '색상 그라데이션 효과', priceMultiplier: 1.4 },
      { id: 'metallic', label: '메탈릭', description: '금속성 광택', priceMultiplier: 1.3 },
      { id: 'pearl', label: '펄', description: '펄 효과', priceMultiplier: 1.25 },
      { id: 'special', label: '기타 특수색상', description: '홀로그램, 크롬 등', priceMultiplier: 1.6 },
    ],
  },
  {
    id: 'quantity',
    step: 5,
    title: '수량을 선택해주세요',
    description: '예상 주문 수량을 선택하세요',
    options: [
      { id: 'under1000', label: '1,000개 이하', description: '소량 주문', priceMultiplier: 1.5 },
      { id: '1000to5000', label: '1,000 ~ 5,000개', description: '소~중량 주문', priceMultiplier: 1.2 },
      { id: '5000to10000', label: '5,000 ~ 10,000개', description: '중량 주문', priceMultiplier: 1.0 },
      { id: 'over10000', label: '10,000개 이상', description: '대량 주문', priceMultiplier: 0.85 },
    ],
  },
];

// 기본 단가 (원)
export const BASE_UNIT_PRICE = 150;

// 견적 계산 함수
export interface QuoteSelections {
  containerType: string;
  containerSize: string;
  coatingType: string;
  color: string;
  quantity: string;
}

export interface QuoteResult {
  selections: QuoteSelections;
  selectionLabels: Record<string, string>;
  unitPriceRange: { min: number; max: number };
  totalPriceRange: { min: number; max: number };
  estimatedDays: string;
  quoteNumber: string;
  createdAt: Date;
  needsConsultation: boolean;
}

export function calculateQuote(selections: QuoteSelections): QuoteResult {
  let totalMultiplier = 1;
  const selectionLabels: Record<string, string> = {};
  let needsConsultation = false;

  // 각 선택에 대한 multiplier 계산
  quoteQuestions.forEach((question) => {
    const selectedOption = question.options.find(
      (opt) => opt.id === selections[question.id as keyof QuoteSelections]
    );
    if (selectedOption) {
      totalMultiplier *= selectedOption.priceMultiplier || 1;
      selectionLabels[question.id] = selectedOption.label;
      
      // 특수 조건 체크
      if (selectedOption.id === 'special' || selectedOption.id === 'combined' || selectedOption.id === 'other') {
        needsConsultation = true;
      }
    }
  });

  // 단가 범위 계산 (±15% 범위)
  const baseUnitPrice = BASE_UNIT_PRICE * totalMultiplier;
  const unitPriceRange = {
    min: Math.round(baseUnitPrice * 0.85),
    max: Math.round(baseUnitPrice * 1.15),
  };

  // 수량에 따른 총 가격 계산
  const quantityMap: Record<string, number> = {
    under1000: 500,
    '1000to5000': 3000,
    '5000to10000': 7500,
    over10000: 15000,
  };
  const avgQuantity = quantityMap[selections.quantity] || 5000;

  const totalPriceRange = {
    min: unitPriceRange.min * avgQuantity,
    max: unitPriceRange.max * avgQuantity,
  };

  // 예상 납기일 계산
  const quantityDaysMap: Record<string, string> = {
    under1000: '5~7일',
    '1000to5000': '7~10일',
    '5000to10000': '10~14일',
    over10000: '14~21일',
  };
  const estimatedDays = quantityDaysMap[selections.quantity] || '협의 필요';

  // 견적번호 생성
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const quoteNumber = `QT-${year}${month}${day}-${random}`;

  return {
    selections,
    selectionLabels,
    unitPriceRange,
    totalPriceRange,
    estimatedDays,
    quoteNumber,
    createdAt: now,
    needsConsultation,
  };
}

