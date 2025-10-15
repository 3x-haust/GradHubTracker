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
} from 'class-validator';
import {
  DepartmentEnum,
  DesiredFieldEnum,
  StatusEnum,
} from '../../common/enums';

export class CreateGraduateDto {
  @IsString()
  @Matches(/^[가-힣]+$/)
  name!: string;

  @IsIn(['남', '여'])
  gender!: '남' | '여';

  @IsDateString()
  birthDate!: string;

  @IsString()
  @Matches(/^[0-9-]+$/)
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string | null;

  @IsString()
  address!: string;

  @IsEnum(DepartmentEnum)
  department!: DepartmentEnum;

  @IsInt()
  @Min(0)
  @Max(100)
  grade!: number;

  @IsIn(['상', '중', '하'])
  attendance!: '상' | '중' | '하';

  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  certificates!: string[];

  @IsArray()
  @IsEnum(DesiredFieldEnum, { each: true })
  desiredField!: DesiredFieldEnum[];

  @IsArray()
  @IsEnum(StatusEnum, { each: true })
  currentStatus!: StatusEnum[];

  @IsInt()
  graduationYear!: number;

  @IsOptional()
  @IsString()
  memo?: string | null;
}
