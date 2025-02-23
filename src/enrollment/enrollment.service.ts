import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
      let {
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

      // Validar que el estudiante no tenga una matrícula activa
      const activeEnrollment = await tx.enrollment.findFirst({
        where: {
          studentId,
          cycleId,
          careerId,
          status: EnrollmentStatus.ACTIVO
        },
        include: { student: true, cycle: true, career: true },
      });
      if (activeEnrollment) {
        throw new BadRequestException(`El estudiante ya tiene una matrícula activa en el ciclo ${activeEnrollment.cycle.name} de la carrera ${activeEnrollment.career.name}`);
      }
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
      if (!discounts || discounts === 0) discounts = 0;
      if (!initialPayment || initialPayment === 0) initialPayment = 0;
      if (!totalCost || totalCost === 0) totalCost = 0;
      if (!carnetCost || carnetCost === 0) carnetCost = 0;

      const outstandingBalance = totalCost - initialPayment - discounts;

      // Pago por carnet (si no se ha pagado)
      if (!paymentCarnet && carnetCost > 0) {
        accountsReceivable.push({
          studentId: studentId,
          paymentDate: new Date(Date.now()),
          concept: 'PAGO CARNET',
          totalAmount: carnetCost,

          pendingBalance: carnetCost,
          status: PaymentStatus.PENDIENTE,
        });
      }
      if (paymentCarnet && carnetCost > 0) {
        accountsReceivable.push({
          studentId: studentId,
          paymentDate: new Date(Date.now()),
          concept: 'PAGO CARNET',
          totalAmount: carnetCost,
          pendingBalance: 0,
          status: PaymentStatus.PAGADO,
        });
      }

      // Pago inicial registrado
      if (initialPayment > 0) {
        accountsReceivable.push({
          studentId: studentId,
          paymentDate: new Date(Date.now()),
          concept: 'MATRÍCULA - CUOTA 1',
          totalAmount: initialPayment,
          pendingBalance: 0,
          status: PaymentStatus.PAGADO,
        });
      }

      // Pago en cuotas (solo si es crédito)
      if (credit) {
        const installmentPercentages = [0.4, 0.4, 0.2];

        installmentPercentages.forEach((percentage, index) => {
          accountsReceivable.push({
            studentId: studentId,
            paymentDate: new Date(Date.now() + (index + 1) * 30 * 24 * 60 * 60 * 1000),
            concept: `MATRÍCULA - CUOTA ${index + 2}`,
            totalAmount: outstandingBalance * percentage,
            pendingBalance: outstandingBalance * percentage,
            status: PaymentStatus.PENDIENTE,
          });
        });
      } else {
        accountsReceivable.push({
          studentId: studentId,
          paymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          concept: 'MATRÍCULA - TOTAL',
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
    return this.prismaService.enrollment.findMany(
      {
        where: { deletedAt: null },
        include: { student: true, cycle: true, career: true }
      });
  }

  async findOne(id: string) {
    const enrollment = await this.prismaService.enrollment.findUnique(
      {
        where: { id, deletedAt: null },
        include: { student: true, cycle: true, career: true }
      });
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
