import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const email = process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase();
  const initialPassword = process.env.PLATFORM_ADMIN_PASSWORD;
  if (!email || !initialPassword || initialPassword.length < 12) {
    throw new Error('Set PLATFORM_ADMIN_EMAIL and PLATFORM_ADMIN_PASSWORD (12+ characters) before running the database seed.');
  }

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const passwordHash = await bcrypt.hash(initialPassword, 12);
    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: 'System',
        lastName: 'Admin',
        phone: '+919876543210',
        isPlatformAdmin: true,
      },
    });
  } else if (!user.isPlatformAdmin) {
    user = await prisma.user.update({ where: { id: user.id }, data: { isPlatformAdmin: true } });
  }

  let tenant = await prisma.tenant.findUnique({ where: { slug: 'acme-corp' } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        id: 'tenant-acme-corp-001',
        name: 'Acme Corporation',
        slug: 'acme-corp',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
      },
    });
  }

  await prisma.businessProfile.upsert({
    where: { tenantId: tenant.id },
    create: {
      tenantId: tenant.id,
      legalName: 'Acme Corporation Pvt Ltd',
      tradeName: 'Acme Store',
      gstin: '29ABCDE1234F1Z5',
      panNumber: 'ABCDE1234F',
      email: 'billing@acmestore.in',
      phone: '+919876543210',
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
      upiId: 'acme@hdfcbank',
    },
    update: {},
  });

  await prisma.tenantMember.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
    create: {
      tenantId: tenant.id,
      userId: user.id,
      role: 'OWNER',
      permissions: ['*'],
    },
    update: {},
  });

  // Seed sample products
  const productA = await prisma.product.upsert({
    where: { tenantId_sku: { tenantId: tenant.id, sku: 'SKU-CLD-PRO' } },
    create: {
      tenantId: tenant.id,
      name: 'Cloud Infrastructure Pro',
      sku: 'SKU-CLD-PRO',
      unit: 'month',
      unitPrice: 4999.00,
      taxRate: 18.00,
      hsnCode: '998313',
    },
    update: {},
  });

  const productB = await prisma.product.upsert({
    where: { tenantId_sku: { tenantId: tenant.id, sku: 'SKU-AI-AUTOMATE' } },
    create: {
      tenantId: tenant.id,
      name: 'AI WhatsApp & Telephony Automation Suite',
      sku: 'SKU-AI-AUTOMATE',
      unit: 'seat',
      unitPrice: 2499.00,
      taxRate: 18.00,
      hsnCode: '998314',
    },
    update: {},
  });

  // Seed sample customer
  const customer = await prisma.customer.upsert({
    where: { id: 'cust-technova-001' },
    create: {
      id: 'cust-technova-001',
      tenantId: tenant.id,
      name: 'TechNova Solutions',
      email: 'accounts@technova.io',
      phone: '+919876500001',
      gstin: '29AAAAA0000A1Z5',
      billingStreet: '42 MG Road',
      billingCity: 'Bengaluru',
      billingState: 'Karnataka',
      billingPostalCode: '560001',
      preferredLanguage: 'en',
      communicationConsent: true,
      balanceDue: 0,
      totalOrdersCount: 2,
      totalSpent: 8848.00,
    },
    update: {},
  });

  // Seed customer WhatsApp consent
  await prisma.communicationConsent.upsert({
    where: {
      tenantId_customerId_channel: {
        tenantId: tenant.id,
        customerId: customer.id,
        channel: 'WHATSAPP',
      },
    },
    create: {
      tenantId: tenant.id,
      customerId: customer.id,
      channel: 'WHATSAPP',
      status: 'GRANTED',
      source: 'Onboarding Sign-up Form',
      grantedAt: new Date(),
    },
    update: {},
  });

  // Seed sample invoice
  const existingInvoice = await prisma.invoice.findFirst({
    where: { tenantId: tenant.id, invoiceNumber: 'INV-1001' },
  });

  if (!existingInvoice) {
    const invoice = await prisma.invoice.create({
      data: {
        id: 'inv-acme-1001',
        tenantId: tenant.id,
        customerId: customer.id,
        invoiceNumber: 'INV-1001',
        currency: 'INR',
        invoiceType: 'TAX_INVOICE',
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 15 * 86400000),
        subtotal: 7498.00,
        discountTotal: 0,
        cgstTotal: 674.82,
        sgstTotal: 674.82,
        igstTotal: 0,
        taxTotal: 1349.64,
        shipping: 0,
        grandTotal: 8847.64,
        paidAmount: 8847.64,
        balanceDue: 0,
        status: 'PAID',
        items: {
          create: [
            {
              productId: productA.id,
              name: productA.name,
              sku: productA.sku,
              quantity: 1,
              unitPrice: 4999.00,
              taxRate: 18.00,
              cgstAmount: 449.91,
              sgstAmount: 449.91,
              total: 5898.82,
            },
            {
              productId: productB.id,
              name: productB.name,
              sku: productB.sku,
              quantity: 1,
              unitPrice: 2499.00,
              taxRate: 18.00,
              cgstAmount: 224.91,
              sgstAmount: 224.91,
              total: 2948.82,
            },
          ],
        },
      },
    });

    // Seed payment for this invoice
    await prisma.payment.create({
      data: {
        tenantId: tenant.id,
        invoiceId: invoice.id,
        customerId: customer.id,
        paymentNumber: 'PAY-1001',
        amount: 8847.64,
        currency: 'INR',
        paymentMethod: 'UPI',
        gatewayTransactionId: 'UPI-TXN-88990011',
        status: 'PAID',
        verifiedByUserId: user.id,
      },
    });
  }

  // Seed sample report jobs
  await prisma.reportJob.createMany({
    data: [
      {
        tenantId: tenant.id,
        createdByUserId: user.id,
        reportType: 'SALES_SUMMARY',
        format: 'CSV',
        status: 'COMPLETED',
        fileUrl: '/storage/exports/sales_q3_summary.csv',
        fileSizeBytes: 14230,
        parameters: { dateRange: 'last_30_days' },
      },
      {
        tenantId: tenant.id,
        createdByUserId: user.id,
        reportType: 'TAX_GST_REPORT',
        format: 'XLSX',
        status: 'COMPLETED',
        fileUrl: '/storage/exports/gst_gstr1_october.xlsx',
        fileSizeBytes: 28540,
        parameters: { month: 10, year: 2026 },
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Database seeded successfully!');
  console.log(`Platform admin email: ${email}`);
  console.log(`Tenant:   Acme Corporation (${tenant.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

