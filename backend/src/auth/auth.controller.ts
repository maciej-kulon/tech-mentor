import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Res,
  Req,
  Get,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoggerService } from '../logger/logger.service';
import { LoginResponseDto } from './dto/login-response.dto';
import { Response, Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from './decorators/current-user.decorator';
import { ICommonUser } from '../user/interfaces/common-user.interface';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: LoggerService,
  ) {}

  @Post('login/v1')
  public async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Omit<LoginResponseDto, 'access_token' | 'refresh_token'>> {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);

    this.logger.info('User has logged into the system', user);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const loginResponse = await this.authService.login(user);

    // Set secure httpOnly cookies for tokens
    this.setTokenCookies(response, loginResponse.access_token, loginResponse.refresh_token);

    // Return user data without tokens (tokens are now in cookies)
    return {
      user: loginResponse.user,
    };
  }

  @Post('refresh/v1')
  public async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    // Get refresh token from httpOnly cookie
    const refreshToken = request.cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const tokens = await this.authService.refresh(refreshToken);

    // Set new secure httpOnly cookies
    this.setTokenCookies(response, tokens.access_token, tokens.refresh_token);

    return { message: 'Tokens refreshed successfully' };
  }

  @Post('logout/v1')
  public async logout(@Res({ passthrough: true }) response: Response) {
    // Clear the token cookies
    this.clearTokenCookies(response);
    return { message: 'Logged out successfully' };
  }

  @Get('verify/v1')
  @UseGuards(AuthGuard('jwt'))
  public async verifyToken(@CurrentUser() user: ICommonUser) {
    return {
      message: 'Token is valid',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
      },
    };
  }

  /**
   * Helper method to set secure httpOnly cookies for access and refresh tokens
   * These cookies are:
   * - httpOnly: Cannot be accessed by JavaScript (prevents XSS attacks)
   * - secure: Only sent over HTTPS in production
   * - sameSite: 'strict' prevents CSRF attacks
   */
  private setTokenCookies(response: Response, accessToken: string, refreshToken: string): void {
    const isProduction = process.env.NODE_ENV === 'production';

    // Cookie options for security
    const cookieOptions = {
      httpOnly: true, // Prevents access via JavaScript
      secure: isProduction, // Only send over HTTPS in production
      sameSite: 'strict' as const, // Prevents CSRF attacks
      path: '/', // Available for entire application
    };

    // Set access token cookie (shorter expiry - typically 15 minutes)
    response.cookie('access_token', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
    });

    // Set refresh token cookie (longer expiry - 7 days)
    response.cookie('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });
  }

  /**
   * Helper method to clear token cookies on logout
   */
  private clearTokenCookies(response: Response): void {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    };

    response.clearCookie('access_token', cookieOptions);
    response.clearCookie('refresh_token', cookieOptions);
  }
}
