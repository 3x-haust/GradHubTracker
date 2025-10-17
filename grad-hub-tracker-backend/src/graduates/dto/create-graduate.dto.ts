import {
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  Matches,
  ArrayUnique,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  DepartmentEnum,
  DesiredFieldEnum,
  StatusEnum,
} from '../../common/enums';

export class CreateGraduateDto {
  @IsString()
  @Matches(/^[가-힣]+$/)
  @IsNotEmpty()
  name!: string;

  @IsIn(['남', '여'])
  @IsNotEmpty()
  gender!: '남' | '여';

  @IsDateString()
  @IsNotEmpty()
  birthDate!: string;

  @IsString()
  @Matches(/^010-\d{4}-\d{4}$/, {
    message: '전화번호 형식은 010-1234-5678 이어야 합니다.',
  })
  @IsNotEmpty()
  phone!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsEnum(DepartmentEnum)
  @IsNotEmpty()
  department!: DepartmentEnum;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  grade?: number;

  @IsOptional()
  @IsIn(['상', '중', '하'])
  attendance?: '상' | '중' | '하';

  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  certificates!: string[];

  @IsOptional()
  @IsArray()
  @IsEnum(DesiredFieldEnum, { each: true })
  @ArrayUnique()
  desiredField?: DesiredFieldEnum[];

  @IsOptional()
  @IsArray()
  @IsEnum(StatusEnum, { each: true })
  currentStatus?: StatusEnum[];

  @IsInt()
  graduationYear!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmploymentItemDto)
  employmentHistory!: EmploymentItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationItemDto)
  educationHistory!: EducationItemDto[];

  @IsOptional()
  @IsString()
  memo?: string | null;
}

const PERIOD_REGEX =
  /^(?:\d{4}(?:[./-]\d{1,2}(?:[./-]\d{1,2})?)?)(?:\s*[-~]\s*(?:\d{4}(?:[./-]\d{1,2}(?:[./-]\d{1,2})?)?)?)?$/;

export class EmploymentItemDto {
  @IsString()
  @IsNotEmpty()
  company!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(PERIOD_REGEX, {
    message:
      '기간 형식이 올바르지 않습니다. 예: 2025.01 또는 2025.01 - 2025.12 또는 2025.01.01 -',
  })
  period!: string;
}

export class EducationItemDto {
  @IsString()
  @IsNotEmpty()
  school!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(PERIOD_REGEX, {
    message:
      '기간 형식이 올바르지 않습니다. 예: 2025.03 또는 2025.03 - 또는 2025.03.01 - 2028.02.28',
  })
  period!: string;
}
