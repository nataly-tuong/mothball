# Mothball

A closet tracker for clothing listings.

Live app: [mothball-closet.vercel.app](https://mothball-closet.vercel.app/)

<img width="720" alt="Mothball closet tracker" src="https://github.com/user-attachments/assets/e6a2b7d2-5eff-4aba-b1a7-4f8dc5d00c71" />

Built with React, TypeScript, Tailwind, Express, PostgreSQL, Prisma, and Cloudinary.

## Run locally

Start the API in one terminal:

```bash
cd server
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
```

Then start the frontend in a second terminal:

```bash
cd client
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`; the API defaults to `http://localhost:3001`.

### Environment

Create `server/.env` from the example file and provide your own values:

```env
DATABASE_URL=
JWT_SECRET=
FRONTEND_URL=http://localhost:5173

SMTP_USER=
SMTP_PASS=
BREVO_API_KEY=
MAIL_FROM_EMAIL=
MAIL_FROM_NAME=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

NODE_ENV=development
TRUST_PROXY_HOPS=1
```

## Deployment

The frontend is deployed from `client/` to Vercel. Its Vercel configuration serves the single-page app and proxies `/api/*` requests to the API on Render.

Deploy the backend from `server/` with:

```bash
npm install
npx prisma migrate deploy
npm run build
npm start
```

Set the production equivalents of the environment values above; `FRONTEND_URL` must be `https://mothball-closet.vercel.app`.
