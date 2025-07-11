# Product Requirements Document (PRD)

## 제품 개요
**업무 다이어리 웹앱**: Supabase 실시간 데이터베이스 연동으로 멀티 디바이스 동기화가 가능한 개인 업무 관리 도구

## 핵심 가치 제안
- **실시간 동기화**: 여러 기기에서 즉시 업데이트
- **오프라인 우선**: 네트워크 없이도 작동
- **모바일 최적화**: 언제 어디서나 쉬운 접근

## 기능 요구사항

### 1. 업무 관리 (Core Features)
- **일일 업무**: 매일 반복되는 루틴 관리
- **월간 업무**: 특정 날짜 반복 업무 관리
- **마감일 업무**: 특정 날짜까지 완료할 업무
- **완료 상태**: 체크박스로 진행 상황 추적
- **메모**: 일별 자유 메모 작성

### 2. 달력 인터페이스
- **월별 뷰**: 한 달 단위 업무 현황 표시
- **일별 상세**: 선택된 날짜의 상세 업무 정보
- **진행률 표시**: 완료/전체 업무 비율 시각화
- **상태 표시**: 점 표시로 업무 유형 구분

### 3. 실시간 연동 (MCP + Supabase)
- **자동 저장**: 입력 즉시 데이터베이스 저장
- **실시간 동기화**: 다른 디바이스에서 즉시 반영
- **충돌 해결**: 동시 편집 시 데이터 무결성 보장
- **오프라인 지원**: 로컬 저장 후 온라인 시 동기화

### 4. 사용자 경험
- **빠른 추가**: 플로팅 버튼으로 즉시 업무 추가
- **편집 모드**: 인라인 편집으로 빠른 수정
- **미완료 알림**: 미완료 업무 현황 표시
- **검색 기능**: 업무 내용 검색

## 비기능적 요구사항

### 성능
- **로딩 시간**: 초기 로딩 3초 이내
- **응답 시간**: 사용자 액션 후 200ms 이내 피드백
- **동기화**: 1초 이내 실시간 반영

### 보안
- **인증**: Supabase Auth 활용
- **권한**: 사용자별 데이터 격리
- **암호화**: 전송 중 데이터 암호화

### 확장성
- **사용자**: 10,000명 동시 사용 지원
- **데이터**: 사용자당 무제한 업무 저장
- **API**: Rate limiting 적용

## 기술 스택

### Frontend
- **React 18**: 사용자 인터페이스
- **Tailwind CSS**: 스타일링
- **Lucide React**: 아이콘
- **PWA**: 모바일 앱 경험

### Backend
- **Supabase**: 데이터베이스 + 인증 + 실시간
- **PostgreSQL**: 관계형 데이터베이스
- **Row Level Security**: 데이터 보안

### 연동
- **MCP Protocol**: 실시간 데이터 동기화
- **WebSocket**: 실시간 통신
- **Service Worker**: 오프라인 지원

## 데이터 모델

### Users
```sql
- id (uuid, primary key)
- email (text, unique)
- created_at (timestamp)
- updated_at (timestamp)
```

### Daily_Todos
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- text (text)
- is_active (boolean)
- created_at (timestamp)
```

### Monthly_Todos
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- text (text)
- repeat_date (integer, 1-31)
- is_active (boolean)
- created_at (timestamp)
```

### Deadline_Tasks
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- text (text)
- deadline_date (date)
- is_active (boolean)
- created_at (timestamp)
```

### Completions
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- item_id (uuid)
- item_type (enum: daily_todo, monthly_todo, deadline_task)
- completion_date (date)
- created_at (timestamp)
```

### Daily_Memos
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- memo_date (date)
- content (text)
- updated_at (timestamp)
```

## 성공 지표
- **DAU/MAU**: 일간/월간 활성 사용자
- **완료율**: 생성된 업무 대비 완료율
- **동기화 성공률**: 99.9% 이상
- **사용자 만족도**: NPS 70+ 목표