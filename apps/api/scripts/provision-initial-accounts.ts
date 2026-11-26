import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function main() {
  const adminEmail = required('PLATFORM_ADMIN_EMAIL').toLowerCase();
  const adminPassword = required('PLATFORM_ADMIN_PASSWORD');
  const customerEmail = required('INITIAL_CUSTOMER_EMAIL').toLowerCase();
  const customerPassword = required('INITIAL_CUSTOMER_PASSWORD');
  const businessName = required('INITIAL_CUSTOMER_BUSINESS_NAME');

  if (adminPassword.length < 16) throw new Error('PLATFORM_ADMIN_PASSWORD must be at least 16 characters.');
  if (customerEmail === adminEmail) throw new Error('Admin and customer accounts must use different emails.');

  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
  const customerPasswordHash = await bcrypt.hash(customerPassword, 12);
  const tenantSlug = 'the-chocolate-mine';
  const start = new Date();
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + 1);

  await prisma.$transaction(async (tx) => {
    await tx.user.upsert({
      where: { email: adminEmail },
      create: {
        email: adminEmail,
        passwordHash: adminPasswordHash,
        firstName: 'ollaiBooks',
        lastName: 'Admin',
        isPlatformAdmin: true,
        isActive: true,
      },
      update: {
        passwordHash: adminPasswordHash,
        isPlatformAdmin: true,
        isActive: true,
      },
    });

    const tenant = await tx.tenant.upsert({
      where: { slug: tenantSlug },
      create: {
        name: businessName,
        slug: tenantSlug,
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        isActive: true,
        isSuspended: false,
      },
      update: {
        name: businessName,
        isActive: true,
        isSuspended: false,
      },
    });

    const customer = await tx.user.upsert({
      where: { email: customerEmail },
      create: {
        email: customerEmail,
        passwordHash: customerPasswordHash,
        firstName: 'Chocolate Mine',
        lastName: 'Customer',
        isActive: true,
      },
      update: {
        passwordHash: customerPasswordHash,
        isActive: true,
      },
    });

    await tx.businessProfile.upsert({
      where: { tenantId: tenant.id },
      create: {
        tenantId: tenant.id,
        legalName: businessName,
        tradeName: businessName,
        email: customerEmail,
        phone: '',
        streetAddress: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        invoicePrefix: 'CM-INV-',
        invoiceNextNumber: 1,
      },
      update: { legalName: businessName, tradeName: businessName, email: customerEmail },
    });

    await tx.tenantMember.upsert({
      where: { tenantId_userId: { tenantId: tenant.id, userId: customer.id } },
      create: {
        tenantId: tenant.id,
        userId: customer.id,
        role: 'OWNER',
        permissions: ['*'],
        isActive: true,
      },
      update: { role: 'OWNER', permissions: ['*'], isActive: true },
    });

    const plan = await tx.subscriptionPlan.upsert({
      where: { code: 'STARTER' },
      create: {
        code: 'STARTER',
        name: 'Starter',
        description: 'Offline billing and business workspace',
        tier: 'STARTER',
        priceMonthly: 0,
        priceAnnual: 0,
        maxWebsites: 1,
        maxInvoicesMonthly: 500,
        maxWhatsAppMonthly: 1000,
        maxEmailsMonthly: 2000,
        maxVoiceMinutesMonthly: 0,
        maxStaff: 2,
      },
      update: { isActive: true },
    });

    const subscription = await tx.tenantSubscription.findFirst({ where: { tenantId: tenant.id } });
    if (subscription) {
      await tx.tenantSubscription.update({
        where: { id: subscription.id },
        data: {
          planId: plan.id,
          status: 'ACTIVE',
          billingInterval: 'annual',
          currentPeriodStart: start,
          currentPeriodEnd: end,
        },
      });
    } else {
      await tx.tenantSubscription.create({
        data: {
          tenantId: tenant.id,
          planId: plan.id,
          status: 'ACTIVE',
          billingInterval: 'annual',
          currentPeriodStart: start,
          currentPeriodEnd: end,
        },
      });
    }
  });

  console.log('Initial admin and customer accounts provisioned.');
}

main()
  .catch((error) => {
    console.error('Account provisioning failed:', error instanceof Error ? error.message : 'unknown error');
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
