import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserDirectReadService } from '../user/direct-read/user-direct-read.service';
import { LoginResponseDto } from './dto/login-response.dto';
import { ICommonUser } from '@/user/interfaces/common-user.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly userDirectReadService: UserDirectReadService,
    private readonly jwtService: JwtService,
  ) {}

  public async validateUser(email: string, password: string): Promise<ICommonUser | null> {
    const user = await this.userDirectReadService.findByEmailWithPasswordHash(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      company: user.company,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  public async login(user: ICommonUser): Promise<LoginResponseDto> {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: {
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        company: user.company,
      },
    };
  }

  public async refresh(refreshToken: string) {
    const decoded = this.jwtService.verify(refreshToken);
    const payload = { email: decoded.email, sub: decoded.sub };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }
}
