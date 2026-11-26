import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { CurrentTenantId, CurrentUser } from '../../auth/current-user.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../../auth/permissions.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { PrismaService } from '../../database/prisma.service';

const ProfileSchema = z.object({
  legalName: z.string().trim().min(2).max(160),
  tradeName: z.string().trim().max(160).nullish().or(z.literal('')),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(5).max(40),
  gstin: z.string().trim().max(15).nullish().or(z.literal('')),
  panNumber: z.string().trim().max(10).nullish().or(z.literal('')),
  website: z.string().trim().url().max(255).nullish().or(z.literal('')),
  streetAddress: z.string().trim().min(3).max(250),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().min(3).max(20),
  country: z.string().trim().min(2).max(80).default('India'),
  invoicePrefix: z.string().trim().regex(/^[A-Za-z0-9/-]{1,16}$/),
  defaultPaymentTerms: z.string().trim().max(500).nullish().or(z.literal('')),
  notes: z.string().trim().max(2000).nullish().or(z.literal('')),
  bankName: z.string().trim().max(100).nullish().or(z.literal('')),
  accountNumber: z.string().trim().max(50).nullish().or(z.literal('')),
  ifscCode: z.string().trim().max(20).nullish().or(z.literal('')),
  upiId: z.string().trim().max(100).nullish().or(z.literal('')),
  taxRate: z.union([z.string(), z.number()]).optional(),
});

@Controller('api/v1/business-profile')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class BusinessProfileController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermissions('business:read')
  get(@CurrentTenantId() tenantId: string) {
    return this.prisma.businessProfile.findUnique({ where: { tenantId }, select: { legalName: true, tradeName: true, email: true, phone: true, gstin: true, panNumber: true, website: true, streetAddress: true, city: true, state: true, postalCode: true, country: true, invoicePrefix: true, invoiceNextNumber: true, defaultPaymentTerms: true, notes: true } });
  }

  @Patch()
  @RequirePermissions('business:manage')
  async update(@CurrentTenantId() tenantId: string, @CurrentUser() user: any, @Body(new ZodValidationPipe(ProfileSchema)) body: z.infer<typeof ProfileSchema>) {
    const { invoicePrefix, taxRate: _taxRate, ...fields } = body as any;
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.businessProfile.update({ where: { tenantId }, data: { ...fields, invoicePrefix, tradeName: fields.tradeName || null, gstin: fields.gstin || null, panNumber: fields.panNumber || null, website: fields.website || null, defaultPaymentTerms: fields.defaultPaymentTerms || null, notes: fields.notes || null }, select: { legalName: true, tradeName: true, email: true, phone: true, gstin: true, panNumber: true, website: true, streetAddress: true, city: true, state: true, postalCode: true, country: true, invoicePrefix: true, invoiceNextNumber: true, defaultPaymentTerms: true, notes: true } });
      await tx.auditLog.create({ data: { tenantId, userId: user.userId, action: 'BUSINESS_PROFILE_UPDATED', entityType: 'business_profile', details: { updated: true } } });
      return updated;
    });
  }
}
