import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  DepartmentEnum,
  DesiredFieldEnum,
  Employment,
  Education,
  StatusEnum,
} from '../common/enums';

@Entity('graduates')
export class Graduate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  photoUrl!: string | null;

  @Index('graduates_graduation_year_idx')
  @Column({ type: 'int' })
  graduationYear!: number;

  @Index('graduates_name_idx')
  @Column({ type: 'varchar', length: 60 })
  name!: string;

  @Column({ type: 'varchar', length: 1 })
  gender!: '남' | '여';

  @Column({ type: 'date' })
  birthDate!: string; // ISO yyyy-MM-dd

  @Index('graduates_phone_idx')
  @Column({ type: 'varchar', length: 30 })
  phone!: string;

  @Index('graduates_email_unique', { unique: true })
  @Column({ type: 'varchar', length: 200, nullable: true, unique: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 300 })
  address!: string;

  @Column({ type: 'enum', enum: DepartmentEnum })
  department!: DepartmentEnum;

  @Column({ type: 'int' })
  grade!: number;

  @Column({ type: 'varchar', length: 1 })
  attendance!: '상' | '중' | '하';

  @Column({ type: 'text', array: true, default: '{}' })
  certificates!: string[];

  @Column({
    type: 'enum',
    enum: DesiredFieldEnum,
    array: true,
    default: '{}',
  })
  desiredField!: DesiredFieldEnum[];

  @Column({ type: 'enum', enum: StatusEnum, array: true, default: '{}' })
  currentStatus!: StatusEnum[];

  @Column({ type: 'jsonb', default: '[]' })
  employmentHistory!: Employment[];

  @Column({ type: 'jsonb', default: '[]' })
  educationHistory!: Education[];

  @Column({ type: 'text', nullable: true })
  memo!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
