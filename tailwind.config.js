/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
<<<<<<< HEAD
      // 한글 폰트 설정
      fontFamily: {
        'sans': ['Noto Sans KR', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Malgun Gothic', '맑은 고딕', 'Roboto', 'sans-serif'],
      },
      
=======
>>>>>>> b06aa8769d4de3a64a8acbc396ca3ecfe6f58271
      // 모바일 최적화 브레이크포인트
      screens: {
        'xs': '320px',     // 작은 폰
        'sm': '375px',     // 일반 폰
        'md': '768px',     // 태블릿
        'lg': '1024px',    // 데스크톱
        'xl': '1280px',    // 큰 데스크톱
        'touch': {'raw': '(hover: none)'},  // 터치 디바이스
      },
      
      // 터치 친화적 스페이싱
      spacing: {
        'touch': '44px',   // 최소 터치 영역 (44px)
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      
      // 모바일 최적화 폰트 크기
      fontSize: {
        'xs-mobile': ['12px', '16px'],
        'sm-mobile': ['14px', '18px'],
        'base-mobile': ['16px', '20px'],
        'lg-mobile': ['18px', '22px'],
        'xl-mobile': ['20px', '24px'],
      },
      
      // 귀여운 그라데이션
      backgroundImage: {
        'cute-gradient': 'linear-gradient(135deg, #fef7f7 0%, #f0fdf4 50%, #eff6ff 100%)',
        'cute-card': 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
      },
      
      // 모바일 친화적 그림자
      boxShadow: {
        'cute-sm': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'cute-md': '0 4px 15px rgba(0, 0, 0, 0.1)',
        'cute-lg': '0 8px 25px rgba(0, 0, 0, 0.12)',
        'cute-touch': '0 2px 12px rgba(244, 114, 182, 0.15)',
      },
      
      // 애니메이션 시간
      transitionDuration: {
        'fast': '150ms',
        'normal': '300ms',
        'slow': '500ms',
      }
    },
  },
  plugins: [],
}

