const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createDummyUser() {
  console.log('--- Loading Secure Credentials from .env ---');

  // Read credentials dynamically from .env configuration
  const DUMMY_EMAIL = (process.env.DEMO_USER_EMAIL || process.env.PLATFORM_ADMIN_EMAIL || 'demo@billpilot.ai').trim().toLowerCase();
  const DUMMY_PASSWORD = process.env.DEMO_USER_PASSWORD || process.env.PLATFORM_ADMIN_PASSWORD || 'DemoUser@2026Secure!';
  const passwordHash = await bcrypt.hash(DUMMY_PASSWORD, 10);

  // 1. Create or update User
  const user = await prisma.user.upsert({
    where: { email: DUMMY_EMAIL },
    update: {
      passwordHash,
      firstName: 'Kavin',
      lastName: 'SecurityTester',
      isActive: true,
      isPlatformAdmin: true,
    },
    create: {
      email: DUMMY_EMAIL,
      passwordHash,
      firstName: 'Kavin',
      lastName: 'SecurityTester',
      phone: '+919600732162',
      isActive: true,
      isPlatformAdmin: true,
    },
  });

  console.log(`✓ User created/updated: ID ${user.id}, Email: ${user.email}`);

  // 2. Create or update Tenant
  const tenantSlug = 'demo-business-hub';
  let tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Demo Enterprise Hub Pvt Ltd',
        slug: tenantSlug,
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        isActive: true,
      },
    });
  } else {
    tenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        isActive: true,
        isSuspended: false,
      },
    });
  }

  console.log(`✓ Tenant ready: ID ${tenant.id}, Slug: ${tenant.slug}`);

  // 3. Ensure Business Profile
  await prisma.businessProfile.upsert({
    where: { tenantId: tenant.id },
    create: {
      tenantId: tenant.id,
      legalName: 'Demo Enterprise Hub Pvt Ltd',
      tradeName: 'Demo Store',
      gstin: '29ABCDE1234F1Z5',
      panNumber: 'ABCDE1234F',
      email: DUMMY_EMAIL,
      phone: '+919600732162',
      streetAddress: '100 Innovation Boulevard',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
      invoicePrefix: 'INV-',
      invoiceNextNumber: 1001,
      bankName: 'HDFC Bank',
      accountNumber: '50100012345678',
      ifscCode: 'HDFC0001234',
      upiId: 'demostore@hdfcbank',
    },
    update: {
      gstin: '29ABCDE1234F1Z5',
      panNumber: 'ABCDE1234F',
    },
  });

  // 4. Ensure Tenant Membership (OWNER)
  await prisma.tenantMember.upsert({
    where: {
      tenantId_userId: {
        tenantId: tenant.id,
        userId: user.id,
      },
    },
    create: {
      tenantId: tenant.id,
      userId: user.id,
      role: 'OWNER',
      permissions: ['*'],
      isActive: true,
    },
    update: {
      role: 'OWNER',
      permissions: ['*'],
      isActive: true,
    },
  });

  // 5. Ensure Starter Plan & Active Subscription
  let plan = await prisma.subscriptionPlan.findFirst({
    where: { code: 'PRO' },
  });
  if (!plan) {
    plan = await prisma.subscriptionPlan.findFirst({
      where: { code: 'STARTER' },
    });
  }
  if (!plan) {
    plan = await prisma.subscriptionPlan.create({
      data: {
        code: 'PRO',
        name: 'Enterprise Security Pro',
        tier: 'GROWTH',
        priceMonthly: 1999,
        priceAnnual: 19990,
        maxWebsites: 10,
        maxInvoicesMonthly: 10000,
        maxWhatsAppMonthly: 50000,
        maxEmailsMonthly: 50000,
        maxVoiceMinutesMonthly: 1000,
        maxStaff: 20,
      },
    });
  }

  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 2);

  const existingSub = await prisma.tenantSubscription.findFirst({
    where: { tenantId: tenant.id },
  });

  if (!existingSub) {
    await prisma.tenantSubscription.create({
      data: {
        tenantId: tenant.id,
        planId: plan.id,
        status: 'ACTIVE',
        billingInterval: 'annual',
        currentPeriodStart: new Date(),
        currentPeriodEnd: oneYearFromNow,
      },
    });
  } else {
    await prisma.tenantSubscription.update({
      where: { id: existingSub.id },
      data: {
        status: 'ACTIVE',
        currentPeriodEnd: oneYearFromNow,
      },
    });
  }

  console.log('✓ Subscription verified: Valid until 2028');
  console.log('\n=============================================');
  console.log('TEST CREDENTIALS READY:');
  console.log(`Email:    ${DUMMY_EMAIL}`);
  console.log(`Password: ${DUMMY_PASSWORD}`);
  console.log('=============================================\n');
}

createDummyUser()
  .catch((err) => {
    console.error('Error creating dummy user:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
