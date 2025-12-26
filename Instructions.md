URGENT: My Vite + React CropHealthMonitor app deploys to Vercel but shows 404.

LOCAL: npm run dev → http://localhost:3000 WORKS PERFECTLY
VERCEL: https://v3-crophealthmonitor-l9z4j4h5k.vercel.app → 404 NOT FOUND

Project structure (from dir):
✅ package.json, vite.config.ts, index.html, src/App.tsx, components/, constants/
✅ Build locally works: npm run build → dist/ folder exists

TASK: Fix Vercel deployment so app loads at crophealthai.vercel.app

CREATE THESE FILES:

1. vercel.json (root):
{
"buildCommand": "npm run build",
"outputDirectory": "dist"
}

text

2. Ensure package.json scripts:
"scripts": {
"dev": "vite",
"build": "vite build",
"preview": "vite preview"
}

text

3. Check vite.config.ts:
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
plugins: [react()],
build: { outDir: 'dist' }
})

text

TEST: npm run build → dist/index.html exists → git push → Vercel live!

DEADLINE: 15 minutes 🚀