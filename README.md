# VCCC - 화장품 용기 도장 견적 시스템

객관식 질문에 답하면 자동으로 견적서가 생성되고 기록이 보관되는 웹 애플리케이션입니다.

## 🚀 빠른 시작

### 1. 개발 서버 실행

```bash
cd frontend
npm install
npm run dev
```

개발 서버는 **http://localhost:5175/** 에서 실행됩니다.

### 2. Firebase 설정

#### ✅ 완료된 항목
- ✅ Firebase 프로젝트 연결 (vccc-2a621)
- ✅ Firestore 보안 규칙 배포 완료

#### ⚠️ 수동 설정 필요 (Firebase 콘솔에서)

**Firebase Console**: https://console.firebase.google.com/project/vccc-2a621

##### 1) Authentication 활성화
1. 좌측 메뉴에서 **Authentication** 클릭
2. **시작하기** 버튼 클릭
3. **Sign-in method** 탭에서 **이메일/비밀번호** 활성화

##### 2) Firestore Database 생성
1. 좌측 메뉴에서 **Firestore Database** 클릭
2. **데이터베이스 만들기** 클릭
3. **테스트 모드로 시작** 선택 (개발용)
4. 위치는 **asia-northeast3 (Seoul)** 권장

> ⚠️ **중요**: Firestore 데이터베이스가 생성되어야 앱이 정상 작동합니다!

##### 3) 관리자 계정 설정 (선택사항)
1. Firestore > `users` 컬렉션에서 사용자 문서 선택
2. `isAdmin` 필드를 `true`로 추가/수정

## 📁 프로젝트 구조

```
vccc/
├── frontend/              # React 프론트엔드
│   ├── src/
│   │   ├── components/   # UI 컴포넌트
│   │   ├── contexts/     # Auth Context
│   │   ├── lib/          # Firebase, 유틸리티
│   │   ├── pages/        # 페이지 컴포넌트
│   │   └── App.tsx       # 라우팅
│   └── package.json
├── firebase.json          # Firebase 설정
├── firestore.rules        # Firestore 보안 규칙
└── .firebaserc           # Firebase 프로젝트 설정
```

## 🎯 주요 기능

- ✅ 회원가입/로그인 (Firebase Authentication)
- ✅ 5단계 객관식 견적 질문
  - 용기 종류 (병, 튜브, 펌프, 캡 등)
  - 용기 크기/용량
  - 도장 종류 (증착, 코팅, 내부코팅)
  - 색상 (단색, 그라데이션, 메탈릭, 펄 등)
  - 수량
- ✅ 자동 견적 계산 (가격 범위)
- ✅ PDF 다운로드
- ✅ 견적 기록 보관 (Firestore)
- ✅ 관리자 대시보드

## 🛠️ 기술 스택

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + Custom Components
- **Backend**: Firebase (Authentication + Firestore)
- **PDF**: jsPDF
- **Routing**: React Router v6

## 📝 사용 방법

1. **회원가입**: `/register`에서 계정 생성
2. **로그인**: `/login`에서 로그인
3. **견적 요청**: `/quote`에서 5단계 질문에 답변
4. **견적 확인**: 결과 화면에서 PDF 다운로드 가능
5. **내 견적**: `/my-quotes`에서 과거 견적 조회
6. **관리자**: `/admin`에서 전체 견적 현황 관리 (isAdmin=true 필요)

## 🔒 보안 규칙

Firestore 보안 규칙이 이미 배포되어 있습니다:
- 사용자는 자신의 데이터만 읽기/쓰기 가능
- 관리자는 모든 견적 데이터 조회/수정 가능
- 견적 생성은 로그인한 사용자만 가능

## 📦 배포

### Firebase Hosting으로 배포

```bash
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

## 🐛 문제 해결

### Firestore 오류
- Firebase 콘솔에서 Firestore Database가 생성되어 있는지 확인
- 보안 규칙이 올바르게 배포되었는지 확인

### Authentication 오류
- Firebase 콘솔에서 이메일/비밀번호 인증이 활성화되어 있는지 확인

### 개발 서버 포트 충돌
- 기본 포트 5173이 사용 중이면 자동으로 다른 포트 사용 (5174, 5175 등)

## 📄 라이선스

이 프로젝트는 개인 사용 목적으로 제작되었습니다.

