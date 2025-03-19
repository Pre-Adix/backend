import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Enrollment,  PaymentStatus, PaymentMethod } from '@prisma/client';
import { AccountReceivableService } from 'src/account-receivable/account-receivable.service';
import { PaymentService } from 'src/payment/payment.service';

type CompatibleUpdateEnrollmentDto = Omit<UpdateEnrollmentDto, 'student' | 'tutor'>;

@Injectable()
export class EnrollmentService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly accountReceivableService: AccountReceivableService,
    private readonly paymentService: PaymentService,
  ) { }


  async create(createEnrollmentDto: CreateEnrollmentDto): Promise<{ message: string; enrollment: Enrollment }> {

    const newEnrollment = await this.prismaService.$transaction(async (tx: Prisma.TransactionClient) => {

      // Crear la matrícula
      const enrollment = await this.validateAndCreateEnrollment(tx, createEnrollmentDto);

      // Crear las cuentas por cobrar (cuotas)
      await this.createAccountReceivable(tx, createEnrollmentDto, enrollment);
      
      const fullEnrollment = await tx.enrollment.findUnique({
        where: { id: enrollment.id },
        include: {
          student: { select: { firstName: true, lastName: true } },
          career: { select: { area: { select: { name: true } } } },
          admission: { select: { name: true } },
        },
      });

      if (!fullEnrollment) {
        throw new NotFoundException('Enrollment not found after creation');
      }
      const codeStudent = await this.generateCodeStudent(tx, fullEnrollment);
      await tx.enrollment.update({ where: { id: enrollment.id }, data: { codeStudent } });

      return { message: 'Matrícula creada exitosamente', enrollment: { ...enrollment, codeStudent } };
    });
    return newEnrollment;
  }

  private async createAccountReceivable(
    tx: Prisma.TransactionClient,
    dto: CreateEnrollmentDto,
    enrollment: Enrollment
  ) {
    const totalAmount = dto.totalCost - (dto.discounts || 0);
    const numberOfInstallments = dto.credit ? dto.numInstallments || 4 : 1;
    const amountPerInstallment = totalAmount / numberOfInstallments;

    let quote = 0

    if(dto.initialPayment >= amountPerInstallment) {
      quote = 1
      const initialAccount = await this.accountReceivableService.create({
        studentId: enrollment.studentId,
        totalAmount: amountPerInstallment,
        pendingBalance: amountPerInstallment,
        status: PaymentStatus.PAGADO,
        concept: 'Matrícula - Cuota 1',
        dueDate: new Date(),
      });
      
      
      await this.paymentService.create({
        accountReceivableId: initialAccount.id,
        invoiceNumber: `INV-${initialAccount.id}-0`,
        dueDate: new Date(),
        amountPaid: dto.initialPayment,
        paymentMethod: PaymentMethod.EFECTIVO,
        status: PaymentStatus.PAGADO,
        notes: 'Pago correspondiente a cuota 1',
        paymentDate: new Date(),
      });

    }
  
    // Crear cuentas por cobrar mensuales según número de cuotas
    for (quote ; quote < numberOfInstallments; quote++) {
      const dueDate = this.getNextDueDate(quote);
  
      const accountReceivable = await this.accountReceivableService.create({
        studentId: enrollment.studentId,
        totalAmount: amountPerInstallment,
        pendingBalance: amountPerInstallment,
        concept: `Matrícula - Cuota ${quote + 1}`,
        dueDate,
      });
  
      await this.paymentService.create({
        accountReceivableId: accountReceivable.id,
        invoiceNumber: `INV-${accountReceivable.id}-${quote + 1}`,
        dueDate,
        amountPaid: 0,
        paymentMethod: PaymentMethod.EFECTIVO,
        status: PaymentStatus.PENDIENTE,
        notes: `Pago correspondiente a cuota ${quote + 1}`,
        paymentDate: new Date(),
      });
    }
  
    // Crear cuenta por cobrar para carnet si no ha sido pagado
    if (!dto.paymentCarnet) {
      const carnetAccount = await this.accountReceivableService.create({
        studentId: enrollment.studentId,
        totalAmount: dto.carnetCost || 0,
        pendingBalance: dto.carnetCost || 0,
        concept: 'Pago de Carnet',
        dueDate: this.getNextDueDate(0),
      });
  
      await this.paymentService.create({
        accountReceivableId: carnetAccount.id,
        invoiceNumber: `INV-${carnetAccount.id}`,
        dueDate: this.getNextDueDate(0),
        amountPaid: 0,
        paymentMethod: PaymentMethod.EFECTIVO,
        status: PaymentStatus.PENDIENTE,
        notes: 'Pago de carnet pendiente',
        paymentDate: new Date(),
      });
    } else {
      // Si ya pagó el carnet, registrar el pago automáticamente como COMPLETADO
      const carnetAccount = await this.accountReceivableService.create({
        studentId: enrollment.studentId,
        totalAmount: dto.carnetCost || 0,
        pendingBalance: 0,
        concept: 'Pago de Carnet',
        dueDate: this.getNextDueDate(0),
      });
  
      await this.paymentService.create({
        accountReceivableId: carnetAccount.id,
        invoiceNumber: `INV-${carnetAccount.id}`,
        dueDate: this.getNextDueDate(0),
        amountPaid: dto.carnetCost || 0,
        paymentMethod: PaymentMethod.EFECTIVO,
        status: PaymentStatus.PAGADO,
        notes: 'Pago de carnet realizado',
        paymentDate: new Date(),
      });
    }
  }
  
  private getNextDueDate(index: number = 0): Date {
    const today = new Date();
    const nextDueDate = new Date(today.setMonth(today.getMonth() + index)); // Incrementamos el mes para la próxima cuota
    nextDueDate.setDate(30); // Se fija el día 30 de cada mes
    return nextDueDate;
  }

  private async validateAndCreateEnrollment(
    tx: Prisma.TransactionClient,
    dto: CreateEnrollmentDto
  ): Promise<Enrollment> {
    const { studentId, cycleId, careerId, admissionId } = dto;
    

    const activeEnrollment = await tx.enrollment.findFirst({
      where: { studentId, cycleId, careerId, admissionId, deletedAt: null },
      include: { student: true, cycle: true, career: true, admission: true },
    });

    if (activeEnrollment) {
      throw new BadRequestException(
        `El estudiante ya tiene una matrícula activa en el ciclo ${activeEnrollment.cycle.name}, carrera ${activeEnrollment.career.name}, admisión ${activeEnrollment.admission.name}`
      );
    }

    return tx.enrollment.create({
      data: {
        startDate: dto.startDate,
        endDate: dto.endDate,
        modality: dto.modality,
        shift: dto.shift,
        credit: dto.credit,
        paymentCarnet: dto.paymentCarnet,
        carnetCost: dto.carnetCost,
        totalCost: dto.totalCost,
        initialPayment: dto.initialPayment,
        discounts: dto.discounts,
        notes: dto.notes,
        student: { connect: { id: studentId } },
        cycle: { connect: { id: dto.cycleId } },
        admission: { connect: { id: dto.admissionId } },
        career: { connect: { id: dto.careerId } },
        
      },
      include: {
        student: { select: { firstName: true, lastName: true } },
        cycle: true,
        career: { select: { name: true, area: { select: { name: true } } } },
        admission: { select: { name: true } },
      },
    });

  }

  private async generateCodeStudent(
    tx: Prisma.TransactionClient,
    enrollment: Enrollment & {
      student: { firstName: string; lastName: string };
      career: { area: { name: string } };
      admission: { name: string };
    }
  ): Promise<string> {
    const { student, career, admission } = enrollment;

    // Validar que todas las propiedades necesarias están presentes
    const { firstName, lastName } = student;
    const { area } = career;
    const { name: admissionName } = admission;

    if (!firstName || !lastName || !area || !area.name || !admissionName) {
      throw new Error("Faltan propiedades necesarias para generar el código de estudiante");
    }

    // Generar las iniciales del nombre
    const nameInitials = `${firstName.slice(0, 2).toUpperCase()}${lastName.slice(0, 2).toUpperCase()}`;

    // Construir la base del código
    const codeBase = `${admissionName}-${area.name}-${nameInitials}`.replace(/\s+/g, '-');

    // Asegurarse de que el código generado sea único
    let counter = 1;
    let finalCode: string;
    do {
      finalCode = `${codeBase}-${String(counter).padStart(2, '0')}`;
      counter++;
    } while (await tx.enrollment.findUnique({ where: { codeStudent: finalCode } }));

    return finalCode;
  }

  async findAll(): Promise<Enrollment[]> {
    const enrollment = await this.prismaService.enrollment.findMany({
      where: { deletedAt: null },
      include: { student: true, cycle: true, career: { include: { area: true } }, admission: true }
    });
    if(enrollment.length <= 0) throw new NotFoundException('Enrollment not found');
    return enrollment;
  }

  async findOne(id: string): Promise<Enrollment> {
    const enrollment = await this.prismaService.enrollment.findUnique({
      where: { id, deletedAt: null },
      include: { student: true, cycle: true, career: true, admission: true },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    return enrollment;
  }

  
  async update(id: string, updateEnrollmentDto: CompatibleUpdateEnrollmentDto): Promise<Enrollment> {
    
    return this.prismaService.enrollment.update({ where: { id }, data: updateEnrollmentDto });
  }

  async remove(id: string): Promise<Enrollment> {
    return this.prismaService.enrollment.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
