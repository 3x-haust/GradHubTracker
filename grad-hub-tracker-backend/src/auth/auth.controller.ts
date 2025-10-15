import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleLoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('google')
  async google(@Body() dto: GoogleLoginDto) {
    return this.auth.loginWithGoogleIdToken(dto.id_token);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  me(@Req() req: { user?: unknown }) {
    return req.user ?? null;
  }

  @HttpCode(200)
  @Post('logout')
  logout() {
    return { ok: true };
  }
}
