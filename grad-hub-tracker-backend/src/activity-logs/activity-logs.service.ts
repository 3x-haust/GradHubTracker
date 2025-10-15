import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog, ActivityType } from './activity-log.entity';

@Injectable()
export class ActivityLogsService {
  constructor(
    @InjectRepository(ActivityLog) private repo: Repository<ActivityLog>,
  ) {}

  async log(params: {
    type: ActivityType;
    actorUserId?: string | null;
    graduateId?: string | null;
    message: string;
  }): Promise<ActivityLog> {
    const entity = this.repo.create({
      type: params.type,
      actorUserId: params.actorUserId ?? null,
      graduateId: params.graduateId ?? null,
      message: params.message,
    });
    return this.repo.save(entity);
  }

  async findAll(query: {
    type?: ActivityType;
    graduateId?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }) {
    const qb = this.repo.createQueryBuilder('log').orderBy('log.at', 'DESC');
    if (query.type) qb.andWhere('log.type = :type', { type: query.type });
    if (query.graduateId)
      qb.andWhere('log.graduateId = :gid', { gid: query.graduateId });
    if (query.userId)
      qb.andWhere('log.actorUserId = :uid', { uid: query.userId });
    qb.take(Math.min(query.limit ?? 50, 200));
    qb.skip(query.offset ?? 0);
    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }
}
