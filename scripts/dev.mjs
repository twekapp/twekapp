import { spawn } from 'node:child_process'

function run(name, command, args) {
  const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
  child.on('exit', (code) => {
    if (code) process.exit(code ?? 1)
  })
  return child
}

const api = run('api', process.execPath, ['--watch', 'server/index.js'])
const web = run('web', 'npx', ['vite'])

function stop() {
  api.kill()
  web.kill()
  process.exit(0)
}

process.on('SIGINT', stop)
process.on('SIGTERM', stop)
