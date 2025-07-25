import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserDirectReadService } from '@/user/direct-read/user-direct-read.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userDirectReadService: UserDirectReadService) {
    super({
      // Custom function to extract JWT from httpOnly cookies
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtStrategy.extractJWTFromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(), // Fallback for API clients that might still use headers
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'default-secret-key',
    });
  }

  /**
   * Custom extractor function to get JWT token from httpOnly cookies
   * This method extracts the access_token from the request cookies
   */
  private static extractJWTFromCookie(request: Request): string | null {
    if (request.cookies && 'access_token' in request.cookies) {
      return request.cookies.access_token;
    }
    return null;
  }

  public async validate(payload: any) {
    return this.userDirectReadService.findByEmail(payload.email);
  }
}
