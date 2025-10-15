import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { AuthGuard } from '@nestjs/passport';
import { ActivityType } from './activity-log.entity';

@UseGuards(AuthGuard('jwt'))
@Controller('activity-logs')
export class ActivityLogsController {
  constructor(private service: ActivityLogsService) {}

  @Get()
  list(
    @Query('type') type?: string,
    @Query('graduateId') graduateId?: string,
    @Query('userId') userId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.service.findAll({
      type: (type as ActivityType) ?? undefined,
      graduateId: graduateId ?? undefined,
      userId: userId ?? undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }
}
