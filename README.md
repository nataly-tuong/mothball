# Mothball

A closet tracker for clothing listings.

Live app: [mothball-closet.vercel.app](https://mothball-closet.vercel.app/)

<img width="720" alt="Mothball closet tracker" src="https://github.com/user-attachments/assets/e6a2b7d2-5eff-4aba-b1a7-4f8dc5d00c71" />

Built with React, TypeScript, Tailwind, Express, PostgreSQL, Prisma, and Cloudinary.

## Deployment

The frontend is deployed from `client/` to Vercel. Its Vercel configuration serves the single-page app and proxies `/api/*` requests to the API on Render.

Deploy the backend from `server/` with `npm run build` and `npm start`. Set the required values from [`server/.env.example`](server/.env.example), including `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, and the credentials for email, Google OAuth, and Cloudinary.
