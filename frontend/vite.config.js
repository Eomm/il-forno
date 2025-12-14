/* eslint-disable no-undef */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  console.log(`Executing Vite config for command: ${command} with BASE_URL=${process.env.BASE_URL}`)
  return {
    plugins: [react()],
    base: process.env.BASE_URL || '/',
  }
})
