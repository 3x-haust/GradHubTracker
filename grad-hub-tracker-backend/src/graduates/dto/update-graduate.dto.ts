import { PartialType } from '@nestjs/mapped-types';
import { CreateGraduateDto } from './create-graduate.dto';

export class UpdateGraduateDto extends PartialType(CreateGraduateDto) {}
