import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Graduate } from './graduate.entity';
import { CreateGraduateDto } from './dto/create-graduate.dto';
import { UpdateGraduateDto } from './dto/update-graduate.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { StatusEnum } from '../common/enums';

@Injectable()
export class GraduatesService {
  constructor(
    @InjectRepository(Graduate) private repo: Repository<Graduate>,
    private logs: ActivityLogsService,
  ) {}

  private extractPgError(e: unknown): { code?: string; constraint?: string } {
    const err = e as
      | undefined
      | null
      | {
          code?: string;
          constraint?: string;
          driverError?: { code?: string; constraint?: string };
        };
    const code = err?.code ?? err?.driverError?.code;
    const constraint = err?.constraint ?? err?.driverError?.constraint;
    return { code, constraint };
  }

  async create(dto: CreateGraduateDto, actorUserId?: string | null) {
    const entity = this.repo.create({
      ...dto,
      email: dto.email ?? null,
      memo: dto.memo ?? null,
    });
    try {
      const saved = await this.repo.save(entity);
      await this.logs.log({
        type: 'register',
        actorUserId: actorUserId ?? null,
        graduateId: saved.id,
        message: `${saved.name} 졸업생을 등록했습니다`,
      });
      return saved;
    } catch (e) {
      const { code, constraint } = this.extractPgError(e);
      if (code === '23505') {
        if (constraint && String(constraint).includes('email')) {
          throw new ConflictException({
            statusCode: 409,
            message: '중복 데이터',
            errors: [{ field: 'email', message: '이미 등록된 이메일입니다' }],
          });
        }
        throw new ConflictException({
          statusCode: 409,
          message: '중복 데이터',
        });
      }
      throw e;
    }
  }

  async findAll(params: { page?: number; pageSize?: number; q?: string }) {
    const page = Math.max(params.page ?? 1, 1);
    const take = Math.min(params.pageSize ?? 20, 100);
    const skip = (page - 1) * take;
    const qb = this.repo.createQueryBuilder('g');
    if (params.q) {
      qb.where('g.name ILIKE :q OR g.phone ILIKE :q OR g.email ILIKE :q', {
        q: `%${params.q}%`,
      });
    }
    qb.orderBy('g.updatedAt', 'DESC');
    qb.take(take).skip(skip);
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, pageSize: take };
  }

  async findOne(id: string) {
    const g = await this.repo.findOne({ where: { id } });
    if (!g) throw new NotFoundException('리소스 없음');
    return g;
  }

  async findByPhoneDigits(digitsOnly: string) {
    if (!digitsOnly) return null;
    const all = await this.repo
      .createQueryBuilder('g')
      .where("regexp_replace(g.phone, '[^0-9]', '', 'g') = :d", {
        d: digitsOnly,
      })
      .getOne();
    return all ?? null;
  }

  async findByEmail(email: string) {
    if (!email) return null;
    return (await this.repo.findOne({ where: { email } })) ?? null;
  }

  async findByNameBirthDate(name: string, birthDate: string) {
    if (!name || !birthDate) return null;
    return (await this.repo.findOne({ where: { name, birthDate } })) ?? null;
  }

  async update(
    id: string,
    dto: UpdateGraduateDto,
    actorUserId?: string | null,
  ) {
    const g = await this.findOne(id);
    Object.assign(g, dto);
    let saved: Graduate;
    try {
      saved = await this.repo.save(g);
    } catch (e) {
      const { code, constraint } = this.extractPgError(e);
      if (code === '23505') {
        if (constraint && String(constraint).includes('email')) {
          throw new ConflictException({
            statusCode: 409,
            message: '중복 데이터',
            errors: [{ field: 'email', message: '이미 등록된 이메일입니다' }],
          });
        }
        throw new ConflictException({
          statusCode: 409,
          message: '중복 데이터',
        });
      }
      throw e;
    }
    await this.logs.log({
      type: 'update',
      actorUserId: actorUserId ?? null,
      graduateId: id,
      message: `${saved.name} 졸업생 정보를 수정했습니다`,
    });
    return saved;
  }

  async remove(id: string, actorUserId?: string | null) {
    const g = await this.findOne(id);
    await this.logs.log({
      type: 'delete',
      actorUserId: actorUserId ?? null,
      graduateId: id,
      message: `${g.name} 졸업생을 삭제했습니다`,
    });
    if (g.photoUrl) {
      const uploadDir = process.env.UPLOAD_DIR ?? './uploads';
      const path = join(
        process.cwd(),
        g.photoUrl.replace('/uploads', uploadDir),
      );
      try {
        if (existsSync(path)) unlinkSync(path);
      } catch {
        // ignore file removal errors
      }
    }
    await this.repo.delete(id);
    return { ok: true };
  }

  async setPhoto(id: string, url: string, actorUserId?: string | null) {
    const g = await this.findOne(id);
    if (g.photoUrl) {
      const uploadDir = process.env.UPLOAD_DIR ?? './uploads';
      const path = join(
        process.cwd(),
        g.photoUrl.replace('/uploads', uploadDir),
      );
      try {
        if (existsSync(path)) unlinkSync(path);
      } catch {
        // ignore
      }
    }
    g.photoUrl = url;
    const saved = await this.repo.save(g);
    await this.logs.log({
      type: 'update',
      actorUserId: actorUserId ?? null,
      graduateId: id,
      message: `${g.name} 졸업생의 사진을 업로드했습니다`,
    });
    return saved;
  }

  async clearPhoto(id: string, actorUserId?: string | null) {
    const g = await this.findOne(id);
    g.photoUrl = null;
    const saved = await this.repo.save(g);
    await this.logs.log({
      type: 'update',
      actorUserId: actorUserId ?? null,
      graduateId: id,
      message: `${g.name} 졸업생의 사진을 삭제했습니다`,
    });
    return saved;
  }

  async getStats() {
    const total = await this.repo.count();
    const employed = await this.repo
      .createQueryBuilder('g')
      .where(':s = ANY(g.currentStatus)', { s: StatusEnum.재직중 })
      .getCount();
    const furtherStudy = await this.repo
      .createQueryBuilder('g')
      .where(':s = ANY(g.currentStatus)', { s: StatusEnum.재학중 })
      .getCount();
    const jobSeeking = await this.repo
      .createQueryBuilder('g')
      .where(':s = ANY(g.currentStatus)', { s: StatusEnum.구직중 })
      .getCount();

    const employedRate =
      total > 0 ? Math.round((employed / total) * 1000) / 10 : 0;
    const furtherStudyRate =
      total > 0 ? Math.round((furtherStudy / total) * 1000) / 10 : 0;
    return {
      total,
      employed,
      employedRate,
      furtherStudy,
      furtherStudyRate,
      jobSeeking,
    };
  }
}
