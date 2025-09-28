import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Credenciales inválidas');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');
    return user;
  }

  async login(user: { id: string; email: string }) {
    const payload = { sub: user.id, email: user.email };
    const access_token = await this.jwt.signAsync(payload);
    return { access_token, user: { id: user.id, email: user.email } };
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }
}
