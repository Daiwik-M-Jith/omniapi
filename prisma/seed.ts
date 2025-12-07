import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as path from 'path';

const dbPath = path.join(process.cwd(), 'dev.db');
const adapter = new PrismaLibSql({
  url: `file:${dbPath}`,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing data (in correct order due to foreign keys)
  await prisma.webhook.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.check.deleteMany();
  await prisma.api.deleteMany();
  await prisma.teamMembership.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();
  await prisma.statusPage.deleteMany();

  // Seed some popular APIs with enhanced settings
  const apis = [
    {
      name: 'GitHub API',
      url: 'https://api.github.com',
      description: 'GitHub REST API v3',
      category: 'Developer Tools',
      isPublic: true,
      intervalSeconds: 300,
      timeoutMs: 10000,
      expectedStatus: '200',
      sslCheckEnabled: true,
    },
    {
      name: 'JSONPlaceholder',
      url: 'https://jsonplaceholder.typicode.com/posts',
      description: 'Free fake API for testing and prototyping',
      category: 'Testing',
      isPublic: true,
      intervalSeconds: 180,
      timeoutMs: 5000,
      expectedStatus: '200',
    },
    {
      name: 'REST Countries',
      url: 'https://restcountries.com/v3.1/all',
      description: 'Get information about countries',
      category: 'Data',
      isPublic: true,
      intervalSeconds: 300,
      timeoutMs: 8000,
    },
    {
      name: 'Dog CEO API',
      url: 'https://dog.ceo/api/breeds/image/random',
      description: 'Random dog images API',
      category: 'Fun',
      isPublic: true,
      intervalSeconds: 600,
      timeoutMs: 5000,
    },
    {
      name: 'Open Weather Map',
      url: 'https://api.openweathermap.org/data/2.5/weather?q=London&appid=test',
      description: 'Weather data API (will fail without valid key)',
      category: 'Weather',
      isPublic: false,
      intervalSeconds: 300,
      timeoutMs: 10000,
    },
    {
      name: 'httpbin Status Check',
      url: 'https://httpbin.org/status/200',
      description: 'Testing API that returns specific status codes',
      category: 'Testing',
      isPublic: true,
      intervalSeconds: 120,
      timeoutMs: 5000,
      expectedStatus: '200',
    },
  ];

  for (const api of apis) {
    await prisma.api.create({
      data: api,
    });
  }

  console.log('✅ Seeded database with sample APIs');
  console.log('📊 New features added:');
  console.log('   - Per-API monitoring settings (intervals, timeouts)');
  console.log('   - SSL certificate monitoring');
  console.log('   - Expected status code validation');
  console.log('   - Public/private API visibility');
  console.log('   - Webhook notifications support');
  console.log('   - Incident management system');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
