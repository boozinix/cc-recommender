# Sequential User Number Login

The login page assigns each visitor a sequential user number (1, 2, 3, ...) up to 100.  
Password = user number (e.g. User 87 enters "87").

## Setup: Upstash Redis

1. **Add Upstash Redis** from [Vercel Marketplace](https://vercel.com/marketplace/upstash/upstash-redis)
2. Connect it to your project — Vercel will add env vars automatically
3. Deploy

## Env vars (auto-injected by integration)

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Or (if using migrated Vercel KV):

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

## Local development

Add the same env vars to `.env.local` from your Upstash Redis dashboard.

## Changing max users

Edit `MAX_USERS` in:
- `app/api/next-user/route.ts`
- `app/api/validate-user/route.ts`
