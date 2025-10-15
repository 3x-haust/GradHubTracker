import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Role } from '../common/enums';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;
  private googleAudiences: string[];
  private adminEmails: Set<string>;

  constructor(
    private jwt: JwtService,
    @InjectRepository(User) private users: Repository<User>,
  ) {
    const clientIds = (process.env.GOOGLE_CLIENT_ID ?? '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);
    this.googleAudiences = clientIds;
    this.googleClient = new OAuth2Client(clientIds[0]);
    this.adminEmails = new Set(
      (process.env.ADMIN_EMAILS ?? '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    );
  }

  async loginWithGoogleIdToken(idToken: string) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience:
        this.googleAudiences.length > 1
          ? this.googleAudiences
          : this.googleAudiences[0],
    });
    const payload = ticket.getPayload();
    const email = (payload?.email ?? '').toLowerCase();
    const name = payload?.name ?? '사용자';
    if (!email) throw new UnauthorizedException('인증 실패');

    let user = await this.users.findOne({ where: { email } });
    if (!user) {
      user = this.users.create({
        email,
        name,
        role: this.adminEmails.has(email) ? Role.admin : Role.teacher,
        approved: this.adminEmails.has(email),
      });
      try {
        await this.users.save(user);
      } catch {
        throw new ConflictException('중복된 이메일');
      }
    }

    if (!user.approved) throw new UnauthorizedException('승인되지 않은 사용자');

    const token = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      approved: user.approved,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        approved: user.approved,
      },
    };
  }
}
