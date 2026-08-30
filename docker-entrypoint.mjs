import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias')
}

writeFileSync(
  '/app/dist/env.js',
  `window.__RUNTIME_CONFIG__ = ${JSON.stringify({ supabaseUrl, supabaseAnonKey })};\n`,
  'utf8',
)

const server = spawn('serve', ['-s', 'dist', '-l', '3000'], {
  stdio: 'inherit',
})

server.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
  }

  process.exit(code ?? 1)
})
