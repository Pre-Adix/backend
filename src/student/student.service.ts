import { Injectable, NotFoundException } from '@nestjs/common';
import { StudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StudentService {

  constructor(
    private prismaService: PrismaService
  ) { }

  async create(createStudentDto: StudentDto) {
    if (createStudentDto.birthday){
      // Convertir la fecha de cumpleaños a un objeto Date
      // y luego a una cadena en formato ISO 8601
      const birthday = new Date(createStudentDto.birthday);
      createStudentDto.birthday = birthday;
    }
    return await this.prismaService.student.create(
      {
        data: { ...createStudentDto }
      });
  }

  async findAll() {
    return await this.prismaService.student.findMany(
      {
        where: { deletedAt: null },
        include: { tutor: true, enrollments: true, accountReceivable: true }
      }
    );
  }

  async findOne(id: string) {
    return await this.prismaService.student.findUnique(
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
          { lastName: { contains: query, mode: 'insensitive' } },
          { tutorId: { contains: query, mode: 'insensitive' } },
        ],
        deletedAt: null
      },
      include: {
        tutor: true,
        enrollments: true,
        accountReceivable: true,
      },
    });
   
    // if (result.length === 0) {
    //   throw new NotFoundException('Estudiante no encontrado');
    // }
  
    return result;
  }
  
  
  async update(id: string, updateStudentDto: UpdateStudentDto) {
    return await this.prismaService.student.update(
      {
        where: { id: id },
        data: updateStudentDto  
        });
  }

  async remove(id: string) {
    return await this.prismaService.student.update(
      {
        where: { id: id },
        data: { deletedAt: new Date() }
      });
  }
}
