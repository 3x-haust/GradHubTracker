import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Graduate } from '../graduates/graduate.entity';

export type ActivityType =
  | 'register'
  | 'update'
  | 'employment'
  | 'education'
  | 'import'
  | 'delete';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('activity_logs_type_idx')
  @Column({ type: 'varchar', length: 20 })
  type!: ActivityType;

  @Index('activity_logs_actor_idx')
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actorUserId' })
  actorUser?: User | null;

  @Column({ type: 'uuid', nullable: true })
  actorUserId!: string | null;

  @Index('activity_logs_graduate_idx')
  @ManyToOne(() => Graduate, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'graduateId' })
  graduate?: Graduate | null;

  @Column({ type: 'uuid', nullable: true })
  graduateId!: string | null;

  @Column({ type: 'text' })
  message!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  at!: Date;
}
