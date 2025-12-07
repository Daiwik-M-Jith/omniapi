# 🚀 OmniAPI - Enterprise API Monitoring Platform

<div align="center">

![OmniAPI Banner](https://img.shields.io/badge/OmniAPI-Enterprise%20Monitoring-purple?style=for-the-badge)
[![Next.js](https://img.shields.io/badge/Next.js-16.0.7-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.1.0-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](./LICENSE)

**Monitor all your APIs in one majestic place**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Deployment](#-deployment) • [Contributing](#-contributing)

</div>

---

## 🌟 Overview

OmniAPI is a production-ready, self-hosted API monitoring platform built with Next.js 16, TypeScript, and Prisma. Monitor unlimited APIs with advanced features like SSL certificate tracking, multi-channel notifications, automated incident management, and public status pages.

### ✨ Why OmniAPI?

- 🎯 **Zero Configuration** - Start monitoring in under 60 seconds
- 🔔 **Smart Notifications** - Slack, Discord, Email, and custom webhooks
- 📊 **Automated Incidents** - Auto-create and resolve incidents
- 🔒 **SSL Monitoring** - Track certificate expiry dates
- 🌐 **Public Status Pages** - Share real-time status with customers
- 🎨 **Beautiful UI** - Modern glass morphism design with gradients
- ⚡ **Lightning Fast** - Concurrent health checks with 10+ parallel requests
- 🛡️ **Self-Hosted** - Full control over your data

---

## 🎯 Features

### Core Monitoring
- ✅ **Unlimited API Monitoring** - Add as many APIs as you need
- ✅ **Real-time Health Checks** - Instant status updates
- ✅ **Custom Check Intervals** - Configure per-API (60s - 3600s)
- ✅ **Response Time Tracking** - Monitor performance trends
- ✅ **24h Uptime Percentage** - Instant reliability metrics
- ✅ **SSL Certificate Monitoring** - Never miss an expiration
- ✅ **Concurrent Checking** - Check 10+ APIs simultaneously

### Advanced Features
- 🔔 **Multi-Channel Notifications**
  - Generic Webhooks (POST to any URL)
  - Slack Integration (formatted messages)
  - Discord Integration (rich embeds)
  - Email Notifications (SMTP)
  
- 📊 **Incident Management**
  - Auto-create incidents on failures
  - Auto-resolve when back online
  - MTTR (Mean Time To Resolution) tracking
  - Incident history with durations
  
- 🌐 **Public Status Pages**
  - Shareable status pages at `/status/[id]`
  - SVG status badges for READMEs
  - Real-time updates every 60 seconds
  - Incident history display
  
- ⚙️ **Per-API Configuration**
  - Custom timeouts (1s - 60s)
  - Retry logic (0-5 retries)
  - Expected status codes
  - HTTP authentication (Basic/Bearer)
  - Custom request headers
  - Content regex matching
  - Follow redirects option

### User Interface
- 🎨 **Modern Dashboard** - Glass morphism with purple/pink gradients
- 📱 **Fully Responsive** - Works on mobile, tablet, and desktop
- 🔄 **Real-time Updates** - Auto-refresh every 30 seconds
- 📑 **Tabbed Navigation** - APIs / Incidents / Webhooks
- ⚡ **Quick Actions** - Check Now, Settings, Webhooks, Incidents
- 🎯 **Smart Statistics** - Total/Online/SSL Expiring/Offline counters

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/Daiwik-M-Jith/omniapi.git
cd omniapi

# Install dependencies
npm install

# Set up database
npx prisma generate
npx prisma migrate deploy

# Seed with sample data (optional)
npm run db:seed

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your dashboard! 🎉

### First Steps

1. **Add Your First API**
   - Click "Add New API" button
   - Enter API name and URL
   - Configure monitoring settings (optional)
   - Click "Add API"

2. **Set Up Notifications** (Optional)
   - Click 🔔 on any API card
   - Choose notification type (Slack/Discord/Email/Webhook)
   - Enter webhook URL or email
   - Save webhook

3. **Enable Public Status** (Optional)
   - Click ⚙️ on any API card
   - Toggle "Public Status Page"
   - Visit `/status/[API_ID]` to see your status page
   - Embed badge in your README

---

## 📚 Documentation

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Database (SQLite for development)
DATABASE_URL="file:./dev.db"

# Cron Job Security (generate with: openssl rand -base64 32)
CRON_SECRET="your-secure-random-string-here"

# Email Notifications (Optional - for email alerts)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-specific-password"
SMTP_FROM="OmniAPI <noreply@yourcompany.com>"

# NextAuth (Future feature - pre-configured)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
```

### API Endpoints

```
POST   /api/apis                           Create new API
GET    /api/apis                           List all APIs
GET    /api/apis/[id]                      Get API details
PATCH  /api/apis/[id]                      Update API settings
DELETE /api/apis/[id]                      Delete API
POST   /api/apis/[id]/check                Manual health check

GET    /api/apis/[id]/webhooks             List webhooks
POST   /api/apis/[id]/webhooks             Create webhook
PATCH  /api/apis/[id]/webhooks/[webhookId] Update webhook
DELETE /api/apis/[id]/webhooks/[webhookId] Delete webhook

GET    /api/apis/[id]/incidents            List incidents
PATCH  /api/apis/[id]/incidents/[incidentId] Update incident

POST   /api/check-all                      Check all APIs
POST   /api/cron                           Cron job (protected)
GET    /api/status/[id]                    Public status JSON
GET    /api/status/[id]?badge=true         SVG status badge
```

### Webhook Configuration

#### Slack Webhook
```json
{
  "type": "slack",
  "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
  "events": ["statusChange"]
}
```

#### Discord Webhook
```json
{
  "type": "discord",
  "url": "https://discord.com/api/webhooks/YOUR/WEBHOOK/URL",
  "events": ["statusChange"]
}
```

#### Email Notification
```json
{
  "type": "email",
  "email": "alerts@yourcompany.com",
  "events": ["statusChange"]
}
```

#### Generic Webhook
```json
{
  "type": "webhook",
  "url": "https://your-api.com/webhook",
  "events": ["statusChange"]
}
```

### Status Badge Embed

Add this to your README.md to show real-time status:

```markdown
![API Status](https://your-domain.com/api/status/YOUR_API_ID?badge=true)
```

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Daiwik-M-Jith/omniapi)

1. **Fork this repository**

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your forked repository
   - Vercel auto-detects Next.js

3. **Configure Environment Variables**
   ```
   DATABASE_URL=file:./dev.db
   CRON_SECRET=your-secure-random-string
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=OmniAPI <noreply@yourcompany.com>
   ```

4. **Deploy!**
   - Click "Deploy"
   - Wait for build to complete
   - Your OmniAPI is live! 🎉

### Cron Jobs

The `vercel.json` file configures automatic health checks every 5 minutes:

```json
{
  "crons": [{
    "path": "/api/cron",
    "schedule": "*/5 * * * *"
  }]
}
```

---

## 🏗️ Architecture

### Tech Stack

- **Framework**: Next.js 16.0.7 (App Router)
- **Language**: TypeScript 5
- **Database**: SQLite (dev) / PostgreSQL (production)
- **ORM**: Prisma 7.1.0
- **Styling**: Tailwind CSS 4
- **Deployment**: Vercel
- **Notifications**: Nodemailer, Webhooks

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Reporting Bugs
- Use GitHub Issues
- Include error messages and screenshots
- Provide steps to reproduce

### Feature Requests
- Open a GitHub Issue
- Describe the feature and use case

### Pull Requests
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 🗺️ Roadmap

### ✅ Completed
- [x] Basic API monitoring
- [x] Real-time dashboard
- [x] SSL certificate monitoring
- [x] Multi-channel notifications
- [x] Automated incident management
- [x] Public status pages
- [x] SVG status badges
- [x] Per-API configuration
- [x] Concurrent health checking

### 🔄 In Progress
- [ ] User authentication (NextAuth configured)
- [ ] Team management
- [ ] Role-based access control

### 📋 Planned
- [ ] Response time graphs
- [ ] Multi-region monitoring
- [ ] Custom incident notes UI
- [ ] Webhook retry logic
- [ ] API key authentication
- [ ] Historical data export
- [ ] Mobile app

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Vercel](https://vercel.com/) - Deployment platform
- [UptimeRobot](https://uptimerobot.com/) - Inspiration

---

## 📞 Support

- 💬 **Discussions**: [GitHub Discussions](https://github.com/Daiwik-M-Jith/omniapi/discussions)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/Daiwik-M-Jith/omniapi/issues)

---

<div align="center">

**Made with ❤️ by developers, for developers**

[⬆ Back to Top](#-omniapi---enterprise-api-monitoring-platform)

</div>
