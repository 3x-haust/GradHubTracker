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
  ArrayNotEmpty,
  IsNotEmpty,
} from 'class-validator';
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

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsEnum(DepartmentEnum)
  @IsNotEmpty()
  department!: DepartmentEnum;

  @IsInt()
  @Min(0)
  @Max(100)
  grade!: number;

  @IsIn(['상', '중', '하'])
  @IsNotEmpty()
  attendance!: '상' | '중' | '하';

  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  certificates!: string[];

  @IsArray()
  @IsEnum(DesiredFieldEnum, { each: true })
  @ArrayUnique()
  @ArrayNotEmpty()
  desiredField!: DesiredFieldEnum[];

  @IsArray()
  @IsEnum(StatusEnum, { each: true })
  @ArrayNotEmpty()
  currentStatus!: StatusEnum[];

  @IsInt()
  graduationYear!: number;

  @IsOptional()
  @IsString()
  memo?: string | null;
}
