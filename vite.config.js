import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  // 환경 변수 로드
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      port: 3000,
      open: true,
      host: true
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    },
    css: {
      postcss: './postcss.config.cjs'
    },
    // 환경 변수 설정 확인
    define: {
      __VITE_ENV_CHECK__: JSON.stringify({
        VITE_SUPABASE_URL: env.VITE_SUPABASE_URL || 'not found',
        VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY ? 'found' : 'not found'
      })
    }
  }
}) 