<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Promo-Efect Logistics Platform

Full-stack logistics management platform with AI-powered features.

## 📁 Project Structure

This is a **monorepo** with separated frontend and backend:

```
promo-effect/
├── frontend (this directory)
│   ├── components/       # React components
│   ├── services/         # API clients
│   ├── package.json      # Frontend dependencies only
│   └── vite.config.ts
├── backend/
│   ├── src/
│   ├── prisma/           # Database schema
│   ├── package.json      # Backend dependencies only
│   └── tsconfig.json
└── README.md
```

## 🚀 Frontend (Current Directory)

**Tech Stack:**
- React 19
- React Router DOM 6
- Axios (HTTP client)
- Recharts (charts/analytics)
- Google Generative AI (Gemini - via backend)
- Vite 6 (build tool)
- TypeScript

**Dependencies:**
- ✅ Frontend-only packages (React, Axios, Recharts)
- ❌ No backend packages (Express, Prisma removed)

## 🏃 Run Locally

### Frontend Development

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file (optional):
   ```bash
   VITE_API_URL=http://localhost:3001/api
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

4. Open browser: http://localhost:5173

### Backend Development

See [backend/README.md](backend/README.md) for backend setup.

**Quick start:**
```bash
cd backend
npm install
cp .env.example .env
# Add GEMINI_API_KEY and DATABASE_URL
npm run dev
```

Backend runs on: http://localhost:3001

## 📦 Production Build

```bash
npm run build
```

Output: `dist/` directory

Preview production build:
```bash
npm run preview
```

## 🔑 Environment Variables

Frontend uses Vite environment variables (must start with `VITE_`):

```bash
VITE_API_URL=http://localhost:3001/api
```

**Note:** Gemini API key is stored in `backend/.env` for security.

## 🛠️ Available Scripts

- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## 📚 Documentation

- [Backend API Documentation](backend/README.md)
- [Prisma Schema](backend/prisma/schema.prisma)
- [Deployment Guide](docs/DEPLOYMENT.md)

## 🔗 Links

- AI Studio App: https://ai.studio/apps/drive/10MNR2-z6dwIAmrgWvekEFX_qpu8qjLe0
- Gemini API: https://makersuite.google.com/app/apikey

## 🤝 Contributing

This is a private project for Promo-Efect logistics company.
