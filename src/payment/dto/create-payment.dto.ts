import { PaymentMethod, PaymentStatus } from "@prisma/client";
import { IsDate, IsDecimal, IsEnum, IsOptional, IsString, IsUUID } from "class-validator";

export class CreatePaymentDto {
  @IsUUID()
  accountReceivableId: string;

  @IsString()
  invoiceNumber: string;

  @IsDate()
  dueDate: Date;

  @IsDecimal()
  amountPaid: number;

  @IsDate()
  paymentDate: Date;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
