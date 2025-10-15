import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from '../common/enums';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async list() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async create(dto: CreateUserDto) {
    const user = this.repo.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      role: dto.role ?? Role.teacher,
      approved: dto.approved ?? true,
    });
    try {
      return await this.repo.save(user);
    } catch {
      throw new ConflictException('중복된 이메일');
    }
  }

  async approve(id: string) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('리소스 없음');
    user.approved = true;
    return this.repo.save(user);
  }

  async remove(id: string) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('리소스 없음');
    await this.repo.delete(id);
    return { ok: true };
  }
}
