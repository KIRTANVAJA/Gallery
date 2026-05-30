# Capture in Silences

A premium cinematic photography portfolio with a full-stack CMS backend.

## Phase 2 — Advanced Features

- Advanced analytics dashboard with Recharts (visitors, uploads, categories, geo, referrers)
- Comments, favorites, reactions on photos
- Private password-protected client albums (`/client/:slug`)
- AI auto-tagging + EXIF extraction on upload
- Advanced search with mood filters and suggestions
- Infinite scroll gallery + image preloading
- Cinematic lightbox: slideshow, EXIF panel, comments
- Real-time admin notifications (Socket.io)
- Email inquiries + newsletter (Nodemailer)
- PWA support + SEO (react-helmet-async, sitemap API)

### New API routes

| Route | Description |
|-------|-------------|
| `GET /api/search` | Advanced photo search |
| `POST /api/photos/:id/comments` | Add comment |
| `POST /api/photos/:id/favorite` | Toggle favorite |
| `GET /api/albums/public/:slug` | Client gallery |
| `POST /api/inquiries` | Contact / booking |
| `GET /api/analytics/dashboard` | Full analytics |
| `GET /api/seo/sitemap.xml` | SEO sitemap |

## Phase 1 — Backend + Admin

- Node.js / Express API
- MongoDB + Mongoose
- Cloudinary image storage
- JWT admin authentication
- Dynamic gallery, analytics, upload system
- Admin dashboard at `/admin/login`

## Features

- Fullscreen cinematic hero with slow-zoom background
- Masonry gallery with category filtering and lightbox viewer
- About, contact, and luxury footer sections
- Film grain overlay, ambient particles, custom cursor glow
- Cinematic loading screen, parallax effects, smooth animations
- Dark/light mode toggle and ambient music toggle
- Fully responsive (desktop & mobile)
- Accessible focus states and ARIA labels

## Getting Started

### 1. Backend

```bash
cd backend
cp .env.example .env
# Fill MONGO_URI, JWT_SECRET, CLOUDINARY_* in .env
npm install
npm run seed
npm run dev
```

API: `http://localhost:5000`

### 2. Frontend

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

Admin: [http://localhost:5173/admin/login](http://localhost:5173/admin/login)

## Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── effects/      # Grain, particles, cursor, loading
│   ├── gallery/      # Masonry grid, filter, lightbox
│   ├── layout/       # Navbar, footer
│   └── sections/     # Hero, gallery, about, contact
├── data/             # Gallery images & categories
├── hooks/            # Theme, lazy load, ambient music
├── App.tsx
└── main.tsx
```

## Customization

- Replace images in `src/data/galleryImages.ts`
- Update contact email and social links in `src/components/sections/Contact.tsx`
- Adjust colors in `tailwind.config.js`
