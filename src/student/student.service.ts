import { Injectable, NotFoundException } from '@nestjs/common';
import { StudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StudentService {

  constructor(
    private readonly prismaService: PrismaService
  ) { }

  create(createStudentDto: StudentDto) {
    return this.prismaService.student.create(
      {
        data: { ...createStudentDto }
      });
  }

  findAll() {
    return this.prismaService.student.findMany(
      {
        where: { deletedAt: null },
        include: { tutor: true, enrollments: true, accountReceivable: true }
      }
    );
  }

  findOne(id: string) {
    return this.prismaService.student.findUnique(
      {
        where: { id: id },
        include: { tutor: true, enrollments: true, accountReceivable: true }
      });
  }
  
  async findStudentByName(query: string) {
    const result = await this.prismaService.student.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } }
        ],
        deletedAt: null
      },
      include: {
        tutor: true,
        enrollments: true,
        accountReceivable: true,
      },
    });
   
    if (result.length === 0) {
      throw new NotFoundException('Estudiante no encontrado');
    }
  
    return result;
  }
  
  
  update(id: string, updateStudentDto: UpdateStudentDto) {
    return this.prismaService.student.update(
      {
        where: { id: id },
        data: updateStudentDto  
        });
  }

  remove(id: string) {
    return this.prismaService.student.update(
      {
        where: { id: id },
        data: { deletedAt: new Date() }
      });
  }
}
