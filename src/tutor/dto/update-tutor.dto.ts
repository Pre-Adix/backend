import { PartialType } from '@nestjs/mapped-types';
import { CreateTutorWithStudentsDto } from './create-tutor-with-student.dto';

export class UpdateTutorDto extends PartialType(CreateTutorWithStudentsDto) {}
