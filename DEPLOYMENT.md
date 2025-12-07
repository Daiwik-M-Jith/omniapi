# Deploying OmniAPI to Vercel

Follow these steps to deploy your OmniAPI monitoring platform to Vercel.

## Prerequisites

- A GitHub account
- A Vercel account (sign up at [vercel.com](https://vercel.com))
- Your OmniAPI project pushed to a GitHub repository

## Step 1: Push to GitHub

1. Initialize git in your project (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: OmniAPI uptime monitoring"
   ```

2. Create a new repository on GitHub

3. Push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/omniapi.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Import Project to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Vercel will auto-detect it's a Next.js project

## Step 3: Configure Environment Variables

Before deploying, add the following environment variable:

```
CRON_SECRET=your-secure-random-string-here
```

To generate a secure secret, you can use:
```bash
openssl rand -base64 32
```

Or use an online generator like [random.org](https://www.random.org/passwords/)

**Important:** Keep this secret secure! It protects your cron endpoint.

## Step 4: Configure Build Settings

Vercel should auto-detect these settings:

- **Framework Preset:** Next.js
- **Build Command:** `npm run build` (automatically runs prisma generate)
- **Output Directory:** `.next` (default)
- **Install Command:** `npm install`

## Step 5: Deploy!

1. Click "Deploy"
2. Wait for the deployment to complete (usually 2-3 minutes)
3. Once complete, you'll get a live URL like: `omniapi.vercel.app`

## Step 6: Verify Deployment

1. Visit your deployed URL
2. Click "Add New API" to add your first API
3. The cron job will automatically check all APIs every 5 minutes

## Important Notes for Production

### Database

- The SQLite database is stored in the serverless function environment
- Data persists between function invocations
- For production with high traffic, consider upgrading to:
  - PostgreSQL (via Vercel Postgres)
  - PlanetScale (MySQL)
  - Supabase (PostgreSQL)

### Cron Job

- Vercel automatically configures the cron job from `vercel.json`
- It runs every 5 minutes: `*/5 * * * *`
- You can change this schedule in `vercel.json`

### Monitoring

- Vercel provides deployment logs
- Check your function logs for any errors
- Monitor API response times and uptime percentages

## Updating Your Deployment

After making changes:

```bash
git add .
git commit -m "Your changes"
git push
```

Vercel will automatically redeploy!

## Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Click "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions

## Troubleshooting

### Cron Job Not Running

- Verify `CRON_SECRET` is set in environment variables
- Check Vercel function logs for errors
- Ensure `vercel.json` is in the root directory

### Database Issues

- SQLite works well for small-medium deployments
- If you see performance issues, consider PostgreSQL
- Database is reset on each deployment (use seed data)

### Build Failures

- Check that all dependencies are in `package.json`
- Verify TypeScript has no errors locally
- Review build logs in Vercel dashboard

## Performance Tips

1. **Optimize Check Frequency:** Adjust cron schedule based on your needs
2. **Limit History:** Add cleanup job to remove old checks (>30 days)
3. **Add Caching:** Implement caching for API list endpoint
4. **Use CDN:** Vercel automatically uses Edge Network for fast delivery

## Need Help?

- Check Vercel documentation: https://vercel.com/docs
- Review Next.js deployment guide: https://nextjs.org/docs/deployment
- Open an issue on your GitHub repository

---

Happy monitoring! 🚀
