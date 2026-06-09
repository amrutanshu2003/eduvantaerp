# Eduvanta ERP Deployment

## Architecture

- Frontend: Cloudflare Pages
- Backend: Render Web Service
- Database: MongoDB Atlas

## Code Changes Already Added

- Frontend API URL is now environment-based via `VITE_API_BASE_URL`
- Backend CORS is now environment-based via `CLIENT_ORIGINS`
- SPA redirect fallback added for Cloudflare Pages in `client/public/_redirects`

## 1. Deploy Backend on Render

- Create a new Web Service from this repo
- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`

Set these environment variables in Render:

- `NODE_ENV=production`
- `PORT=10000`
- `MONGO_URI=your-mongodb-connection-string`
- `JWT_SECRET=your-long-random-secret`
- `JWT_EXPIRE=7d`
- `CLIENT_ORIGINS=https://your-project.pages.dev,https://your-custom-domain.com`

After deploy, note your backend URL, for example:

- `https://eduvanta-api.onrender.com`

Test:

- `https://eduvanta-api.onrender.com/api/health`

## 2. Deploy Frontend on Cloudflare Pages

- Create a new Pages project from this repo
- Root directory: `client`
- Build command: `npm run build`
- Build output directory: `dist`

Set this environment variable in Cloudflare Pages:

- `VITE_API_BASE_URL=https://eduvanta-api.onrender.com/api`

## 3. Important Order

1. Deploy backend first
2. Copy backend public URL
3. Add that URL into Cloudflare Pages as `VITE_API_BASE_URL`
4. Add Cloudflare frontend domain into Render as `CLIENT_ORIGINS`
5. Redeploy both once if needed

## 4. Custom Domain

If you connect a custom domain:

- Add frontend custom domain in Cloudflare Pages
- Add that exact domain to Render `CLIENT_ORIGINS`
- Keep protocol included, for example `https://erp.example.com`

## 5. Local Development

Frontend `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Backend `server/.env`:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-long-random-secret
JWT_EXPIRE=7d
CLIENT_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## 6. Common Issues

- `Network Error` on frontend:
  Usually `VITE_API_BASE_URL` is wrong or backend is sleeping/down.
- `CORS policy` error:
  Add the exact Cloudflare Pages URL to `CLIENT_ORIGINS` in Render.
- Direct URL like `/admin/dashboard` shows 404 on frontend:
  `_redirects` file fixes this after redeploy.
