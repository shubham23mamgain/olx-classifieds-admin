# Classifieds Admin (Next.js 16)

Moderate listings and category requests before they appear on the mobile Home feed.

## Setup

```bash
cd admin
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in dev.

`.env.local` defaults to the live API:

```
NEXT_PUBLIC_API_URL=https://api.classifieds.shubhkarmatech.com
NEXT_PUBLIC_ADMIN_URL=https://admin.classifieds.shubhkarmatech.com
```

Production (`npm run start`) listens on **3035** for nginx (`admin.classifieds.shubhkarmatech.com`).  
For a local API, set `NEXT_PUBLIC_API_URL=http://localhost:4000`.

## Default admin

Seed once from the API project:

```bash
cd ../backend
npm run seed:admin
```

Login:

- Email: `admin@classifieds.local`
- Password: `Admin@12345` (override with `ADMIN_PASSWORD` in backend `.env`)

## Features

- Dashboard stats
- Listing queue: approve / reject
- Home carousel banners: add / edit / remove / upload
- Categories: add / disable / delete + approve/merge requests
- Users: search, block / unblock
