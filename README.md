# 🎀 업무 다이어리 (Diary Management System)

귀여운 디자인의 업무 관리 다이어리 애플리케이션입니다.

## ✨ 주요 기능

### 📅 기본 기능
- **월간 달력**: 직관적인 달력 인터페이스
- **일일 메모**: 선택한 날짜에 메모 작성 및 저장
- **날씨 위젯**: 실시간 날씨 정보 표시
- **반응형 디자인**: 모바일과 데스크톱 모두 지원

### 💼 업무 관리
- **💛 매일 업무**: 매일 반복되는 할 일 관리
- **💚 월간 업무**: 매월 특정 날짜에 반복되는 업무
- **🧡 마감 업무**: 마감일이 있는 업무 관리
- **💗 특정 업무**: 특정 날짜에만 수행하는 업무

### 🆕 새로 추가된 기능 (2024)
- **💰 세금 관리**: 세금 종류, 금액, 납부 상태 관리
  - 세금 종류 (부가세, 소득세 등)
  - 세금액
  - 납부여부 (완료/미완료)
  - 납부기한
  - 납부일

- **📋 결재 관리**: 거래처별 결재 정보 관리
  - 거래처명
  - 거래액
  - 거래일
  - 세금계산서 발행 유무

## 🚀 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 설정
`.env` 파일을 생성하고 Supabase 설정을 추가하세요:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 데이터베이스 설정
Supabase에서 다음 SQL을 실행하여 필요한 테이블들을 생성하세요:
- `database_schema.sql` (기본 테이블들)
- `database_tax_approval_tables.sql` (새로운 세금/결재 관리 테이블들)

### 4. 개발 서버 실행
```bash
npm run dev
```

## 🛠️ 기술 스택

- **Frontend**: React 19, Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime
- **Icons**: Lucide React

## 📱 사용법

### 기본 사용법
1. 달력에서 날짜를 선택하여 해당 날짜의 할 일과 메모를 확인
2. 하단의 "할일 관리" 버튼을 클릭하여 업무 관리 패널 열기
3. 각 탭에서 해당하는 업무 유형을 선택하여 관리

### 세금 관리
1. "세금관리" 탭 선택
2. 세금 종류, 금액, 납부기한 입력
3. 납부 완료 시 체크박스로 상태 변경
4. 납부일은 자동으로 기록됨

### 결재 관리
1. "결재관리" 탭 선택
2. 거래처명, 거래액, 거래일 입력
3. 세금계산서 발행 여부 체크박스로 관리

## 🎨 디자인 특징

- **귀여운 UI**: 파스텔 색상과 이모지 활용
- **모바일 최적화**: 터치 제스처 지원 (좌우 스와이프로 월 이동)
- **반응형 레이아웃**: 화면 크기에 따라 자동 조정
- **애니메이션**: 부드러운 전환 효과

## 🔧 개발 정보

### 프로젝트 구조
```
src/
├── components/
│   ├── Calendar/          # 달력 관련 컴포넌트
│   ├── Modal/            # 모달 컴포넌트
│   └── common/           # 공통 컴포넌트
├── hooks/                # 커스텀 훅
├── services/             # API 서비스
├── config/               # 설정 파일
└── styles/               # 스타일 파일
```

### 주요 컴포넌트
- `MonthlyDiaryCalendar.jsx`: 메인 달력 컴포넌트
- `DailyTodosPanel.jsx`: 매일 업무 관리
- `MonthlyTodosPanel.jsx`: 월간 업무 관리
- `DeadlineTasksPanel.jsx`: 마감 업무 관리
- `TaxManagementPanel.jsx`: 세금 관리 (신규)
- `ApprovalManagementPanel.jsx`: 결재 관리 (신규)

## 📝 라이선스

ISC License

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

💕 **즐거운 업무 관리 되세요!** 💕 