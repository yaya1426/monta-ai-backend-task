import { Controller, Request, Post, UseGuards, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guard/local.guard';
import { RegisterUserDto } from './dto/register-user.dto';
import { JwtRefreshGuard } from './guard/jwt-refresh.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refresh(@Request() req) {
    return this.authService.refresh(req.user.refresh_token);
  }
}
