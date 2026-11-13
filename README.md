# Classifieds Admin (Next.js 16)

Moderate listings and category requests before they appear on the mobile Home feed.

## Setup

```bash
cd admin
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Backend must be running on `http://localhost:4000` (or set `NEXT_PUBLIC_API_URL`).

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
