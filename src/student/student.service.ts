import { Injectable } from '@nestjs/common';
import { StudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StudentService {

  constructor(
    private readonly prismaService: PrismaService
  ) { }

  create(createStudentDto: StudentDto) {
    let tutorId = "hola"
    return this.prismaService.student.create(
      {
        data: {
          code: this.generateStudentCode(createStudentDto.firstName, createStudentDto.lastName),
          firstName: createStudentDto.firstName,
          lastName: createStudentDto.lastName,
          email: createStudentDto.email,
          phone: createStudentDto.phone,
          address: createStudentDto.address,
          gender: createStudentDto.gender,
          birthday: createStudentDto.birthday,

          school: { connect: { id: createStudentDto.schoolId } },
          tutor: { connect: { id: tutorId } }
        }
      });
  }

  private generateStudentCode(firstName: string, lastName: string): string {
    const year: number = new Date().getFullYear();
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    return `${year}${initials}`;

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

  update(id: string, updateStudentDto: UpdateStudentDto) {
    return `This action updates a #${id} student`;
  }

  remove(id: string) {
    return `This action removes a #${id} student`;
  }
}
