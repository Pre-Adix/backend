import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Payment, PaymentStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePaymentDto): Promise<Payment> {
    const account = await this.prisma.accountReceivable.findUnique({
      where: { id: dto.accountReceivableId },
    });

    if (!account) {
      throw new NotFoundException(`Cuenta por cobrar con ID ${dto.accountReceivableId} no encontrada`);
    }

    if (dto.amountPaid > Number(account.pendingBalance)) {
      throw new BadRequestException('El monto pagado no puede ser mayor al saldo pendiente');
    }

    const payment = await this.prisma.payment.create({
      data: { ...dto },
    });

    // Actualizar el saldo pendiente de la cuenta por cobrar
    const newPendingBalance = Number(account.pendingBalance) - dto.amountPaid;
    await this.prisma.accountReceivable.update({
      where: { id: dto.accountReceivableId },
      data: {
        pendingBalance: newPendingBalance,
        status: newPendingBalance === 0 ? PaymentStatus.PAGADO : PaymentStatus.PENDIENTE,
      },
    });

    return payment;
  }

  async findAll(): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      include: { accountReceivable: true },
    });
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { accountReceivable: true },
    });

    if (!payment) {
      throw new NotFoundException(`Pago con ID ${id} no encontrado`);
    }
    return payment;
  }

  async update(id: string, dto: CreatePaymentDto): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException(`Pago con ID ${id} no encontrado`);
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id },
      data: { ...dto },
    });

    return updatedPayment;
  }

  async findPaymentsByStudent(studentId: string): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: { accountReceivable: { studentId } },
    });
  }

  async findPaymentsByAccount(accountId: string): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: { accountReceivableId: accountId },
    });
  }


  async remove(id: string): Promise<void> {
    await this.prisma.payment.update({
      where: { id },
      data: { status: PaymentStatus.ANULADO },
    })
  }
}
