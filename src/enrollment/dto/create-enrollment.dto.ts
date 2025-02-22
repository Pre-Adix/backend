import {
  IsUUID,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  IsString,
  IsDateString
} from 'class-validator';
import { Transform } from 'class-transformer';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { Modality, Shift, EnrollmentStatus } from '@prisma/client';

export class CreateEnrollmentDto {
  @IsDateString({}, { message: 'startDate debe estar en formato dd/MM/yyyy' })
  @Transform(({ value }) => value ? parse(value, 'dd/MM/yyyy', new Date(), { locale: es }).toISOString() : null)
  startDate: string;  

  @IsDateString({}, { message: 'endDate debe estar en formato dd/MM/yyyy' })
  @Transform(({ value }) => value ? parse(value, 'dd/MM/yyyy', new Date(), { locale: es }).toISOString() : null)
  endDate: string;

  @IsUUID()
  studentId: string;

  @IsUUID()
  cycleId: string;

  @IsUUID()
  careerId: string;

  @IsEnum(Modality, { message: `Invalid modality. Must be one of: ${Object.values(Modality).join(', ')}` })
  modality: Modality;

  @IsEnum(Shift, { message: `Invalid shift. Must be one of: ${Object.values(Shift).join(', ')}` })
  shift: Shift;

  @IsBoolean()
  credit: boolean;

  @IsBoolean()
  paymentCarnet: boolean;

  @IsNumber()
  carnetCost: number;

  @IsNumber()
  @Min(0)
  totalCost: number;

  @IsNumber()
  @IsOptional()
  initialPayment?: number;

  @IsNumber()
  @IsOptional()
  discounts?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;
}

