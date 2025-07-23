# 환경 변수 설정 가이드

## 필수 설정

프로젝트 실행 전에 다음 환경 변수들을 설정해야 합니다:

### 1. .env 파일 생성

`diary-management/` 폴더에 `.env` 파일을 생성하고 아래 내용을 복사하여 실제 값으로 변경하세요:

```bash
# Supabase 설정
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# 날씨 API 설정 (OpenWeatherMap)
VITE_WEATHER_API_KEY=your-openweathermap-api-key-here

# MCP 설정 (선택사항)
VITE_MCP_ENDPOINT=ws://localhost:8080/ws

# 개발 환경 설정
VITE_APP_ENV=development
```

### 2. Supabase 프로젝트 설정

1. [Supabase](https://supabase.com)에 가입하고 새 프로젝트 생성
2. 프로젝트 대시보드에서 Settings > API 이동
3. Project URL과 anon public key 복사
4. `.env` 파일의 해당 값들을 실제 값으로 변경

### 3. 데이터베이스 스키마 적용

```sql
-- database_schema.sql 파일의 내용을 Supabase SQL Editor에서 실행
```

### 4. 필수 확인사항

- [ ] .env 파일 생성 완료
- [ ] Supabase 프로젝트 URL 설정
- [ ] Supabase anon key 설정
- [ ] 데이터베이스 스키마 적용
- [ ] RLS 정책 활성화 확인

### 5. 테스트

프로젝트 실행 후 "Supabase 테스트" 탭에서 연결 상태를 확인하세요.

## 보안 주의사항

- `.env` 파일은 절대 Git에 커밋하지 마세요
- 실제 배포 시에는 환경 변수를 별도로 설정하세요
- anon key는 공개되어도 안전하지만, service role key는 노출되면 안 됩니다 