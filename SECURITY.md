# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depend on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in OmniAPI, please send an email to the maintainers with:

1. **Description of the vulnerability**
2. **Steps to reproduce**
3. **Potential impact**
4. **Suggested fix** (if any)

### What to expect

- **Response Time**: We aim to respond within 48 hours
- **Update Frequency**: We'll keep you informed about the progress every 7 days
- **Fix Timeline**: Critical issues will be patched within 7 days, high severity within 30 days

## Security Best Practices

When deploying OmniAPI, please follow these security guidelines:

### 1. Environment Variables

**Never commit `.env` files to version control**

```bash
# ✅ Good - Use environment variables
CRON_SECRET="strong-random-string"
NEXTAUTH_SECRET="another-strong-random-string"

# ❌ Bad - Hardcoded secrets
const secret = "my-secret-123"
```

Generate strong secrets:
```bash
openssl rand -base64 32
```

### 2. Cron Job Protection

The `/api/cron` endpoint is protected by `CRON_SECRET`. Ensure this is:
- At least 32 characters long
- Randomly generated
- Kept private
- Never exposed in client-side code

### 3. Database Security

**Development (SQLite)**
- ✅ Fine for testing and low-traffic use
- ⚠️ File-based, limited concurrent writes

**Production (PostgreSQL)**
- ✅ Use for production deployments
- ✅ Enable SSL/TLS connections
- ✅ Use connection pooling
- ✅ Implement regular backups
- ✅ Use strong database passwords

### 4. SMTP Configuration

When using email notifications:
- ✅ Use app-specific passwords (Gmail, Outlook)
- ✅ Enable 2FA on email accounts
- ✅ Use TLS/SSL for SMTP connections
- ❌ Don't use personal email accounts in production

### 5. Webhook Security

**Incoming Webhooks (from external services)**
- Validate webhook signatures when available
- Use HTTPS endpoints only
- Implement rate limiting

**Outgoing Webhooks (notifications you send)**
- Use HTTPS URLs only
- Validate SSL certificates
- Implement retry logic with exponential backoff

### 6. API Security

**Public Status Pages**
- Only enable for APIs you want publicly visible
- Don't expose sensitive endpoint details
- Monitor access logs

**API Authentication**
- Use Bearer tokens for API access (when implemented)
- Rotate tokens regularly
- Implement rate limiting

### 7. Deployment Security

**Vercel Deployment**
- ✅ Environment variables are encrypted at rest
- ✅ HTTPS enabled by default
- ✅ Automatic security headers
- ✅ DDoS protection included

**Environment Variables on Vercel**
```bash
# Set via Vercel Dashboard or CLI
vercel env add CRON_SECRET production
```

### 8. Data Privacy

**What OmniAPI Stores**
- API endpoints (URLs you configure)
- Response times and status codes
- Check history
- Webhook URLs
- Email addresses (for notifications)

**What OmniAPI Does NOT Store**
- API response bodies (unless you configure content matching)
- Authentication credentials in plain text
- Personal user data (no auth system yet)

### 9. Regular Maintenance

- 🔄 Update dependencies regularly (`npm update`)
- 🔍 Monitor for security advisories (`npm audit`)
- 📝 Review access logs
- 🔐 Rotate secrets periodically
- 🗄️ Backup database regularly

### 10. Network Security

**Firewall Rules**
- Restrict database access to application only
- Use VPC/private networks when possible
- Implement IP allowlisting if needed

**Rate Limiting**
- Implement at API gateway level
- Protect against DoS attacks
- Monitor unusual traffic patterns

## Known Security Considerations

### Current Limitations

1. **No Built-in Authentication** (Yet)
   - NextAuth is configured but not implemented
   - Suitable for private/internal deployments
   - Authentication coming in future release

2. **SQLite for Production**
   - File-based database
   - Limited concurrent write performance
   - Recommended to migrate to PostgreSQL for production

3. **No Rate Limiting** (Yet)
   - Implement at reverse proxy level
   - Or use Vercel's built-in protection

### Planned Security Enhancements

- [ ] User authentication and authorization
- [ ] Role-based access control (RBAC)
- [ ] API key authentication
- [ ] Audit logging
- [ ] Rate limiting middleware
- [ ] Webhook signature verification
- [ ] Two-factor authentication (2FA)
- [ ] SSO integration

## Security Headers

OmniAPI includes these security headers by default (via Next.js):

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## Dependency Security

We use:
- `npm audit` - Regular security audits
- Dependabot - Automated dependency updates
- Snyk - Vulnerability scanning (recommended)

Run security audit:
```bash
npm audit
npm audit fix
```

## Compliance

**GDPR Considerations**
- Data minimization: Only essential data collected
- Right to erasure: Delete API records as needed
- Data portability: Export via API endpoints
- Consent: Configure which endpoints are monitored

**SOC 2 / ISO 27001**
- Self-hosted: Full control over data
- Audit logs: Enable monitoring on your infrastructure
- Encryption: HTTPS enforced, encrypt database at rest

## Incident Response

If a security incident occurs:

1. **Isolate**: Disable affected services
2. **Assess**: Determine scope and impact
3. **Contain**: Patch vulnerability immediately
4. **Notify**: Inform affected users if needed
5. **Document**: Create incident report
6. **Review**: Update security measures

## Contact

For security concerns, please contact:
- **GitHub Issues**: For non-sensitive issues
- **GitHub Security Advisory**: For vulnerability disclosure

## Attribution

We appreciate responsible disclosure and may acknowledge researchers who report valid security issues (with permission).

---

**Last Updated**: December 2025
**Version**: 1.0.0
