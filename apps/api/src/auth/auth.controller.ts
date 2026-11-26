import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

const LoginSchema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(200) }).strict();
const RegisterSchema = z.object({ businessName: z.string().trim().min(2).max(160), email: z.string().trim().email().max(254), password: z.string().min(12).max(200), firstName: z.string().trim().min(1).max(80).optional(), lastName: z.string().trim().min(1).max(80).optional(), phone: z.string().trim().max(40).optional() }).strict();

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body(new ZodValidationPipe(RegisterSchema)) body: any) {
    return this.authService.registerBusiness(body);
  }

  @Post('login')
  async login(@Body(new ZodValidationPipe(LoginSchema)) body: any) {
    return this.authService.login(body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: any) {
    return { user };
  }
}
