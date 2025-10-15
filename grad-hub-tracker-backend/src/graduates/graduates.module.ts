import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Graduate } from './graduate.entity';
import { GraduatesService } from './graduates.service';
import { GraduatesController } from './graduates.controller';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([Graduate]), ActivityLogsModule],
  controllers: [GraduatesController],
  providers: [GraduatesService],
})
export class GraduatesModule {}
