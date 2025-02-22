import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { EnrollmentStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class EnrollmentService {

  constructor(
    private prismaService: PrismaService) { }

  create(createEnrollmentDto: CreateEnrollmentDto) {

    return this.prismaService.$transaction(async (tx) => {
      const {
        studentId,
        cycleId,
        careerId,
        startDate,
        endDate,
        modality,
        shift,
        credit,
        paymentCarnet,
        carnetCost,
        totalCost,
        initialPayment,
        discounts,
        notes,
      } = createEnrollmentDto;

      
      // Crear matrícula
      const enrollment = await tx.enrollment.create({
        data: {
          studentId,
          cycleId,
          careerId,
          startDate,
          endDate,
          modality,
          shift,
          credit,
          paymentCarnet,
          carnetCost,
          totalCost,
          initialPayment,
          discounts,
          status: EnrollmentStatus.ACTIVO,
          notes,
        },
        include: { student: true, cycle: true, career: true },
      });
      
      const accountsReceivable = [];
      
      // Calcular el saldo pendiente
      let outstandingBalance = 0;
      if (!discounts || discounts === 0 ) {
        outstandingBalance = Number(totalCost) - Number(initialPayment)
      } else {
        outstandingBalance = Number(totalCost) - Number(initialPayment) - Number(discounts);
      }
      console.log(totalCost)
      console.log(initialPayment)
      console.log(outstandingBalance)

      // Caso 1: Pago inicial registrado
      if (initialPayment > 0) {
        accountsReceivable.push({
          studentId: studentId,
          concept: 'MATRÍCULA - PAGO INICIAL',
          totalAmount: initialPayment,
          pendingBalance: 0,
          status: PaymentStatus.PAGADO,
        });
      }
      // Caso 2: Pago por carnet (si no se ha pagado)
      if (!paymentCarnet && carnetCost > 0) {
        accountsReceivable.push({
          studentId: studentId,
          concept: 'PAGO CARNET',
          totalAmount: carnetCost,
          pendingBalance: carnetCost,
          status: PaymentStatus.PENDIENTE,
        });
      }

      // Caso 3: Pago en cuotas (solo si es crédito)
      if (credit) {
        const installmentPercentages = [0.3, 0.3, 0.2, 0.2];

        installmentPercentages.forEach((percentage, index) => {
          accountsReceivable.push({
            studentId: studentId,
            concept: `MATRÍCULA - CUOTA ${index + 1}`,
            totalAmount: outstandingBalance * percentage,
            pendingBalance: outstandingBalance * percentage,
            status: PaymentStatus.PENDIENTE,
          });
        });
      } else {
        accountsReceivable.push({
          studentId: enrollment.id,
          concept: 'MATRÍCULA',
          totalAmount: outstandingBalance,
          pendingBalance: outstandingBalance,
          status: PaymentStatus.PENDIENTE,
        });
      }

      // Crear cuentas por cobrar
      await tx.accountReceivable.createMany({
        data: accountsReceivable,
      });

      return { message: 'Matrícula creada exitosamente', enrollment };
    });
  }


  async findAll() {
    return this.prismaService.enrollment.findMany({ where: { deletedAt: null } });
  }

  async findOne(id: string) {
    const enrollment = await this.prismaService.enrollment.findUnique({ where: { id, deletedAt: null } });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    return enrollment;
  }

  async update(id: string, updateEnrollmentDto: UpdateEnrollmentDto) {
    return this.prismaService.enrollment.update({
      where: { id },
      data: updateEnrollmentDto,
    });
  }

  async remove(id: string) {
    return this.prismaService.enrollment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
