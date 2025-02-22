import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTutorWithStudentsDto } from './dto/create-tutor-with-student.dto';
import { UpdateTutorDto } from './dto/update-tutor.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationDto } from 'src/common';

@Injectable()
export class TutorService {

  constructor(
    private prismaService: PrismaService
  ) {}

  async create(dataDto: CreateTutorWithStudentsDto) {
    const { students, ...tutorData } = dataDto;

    return this.prismaService.$transaction(async (prismaData) => {
      const existingTutor = await prismaData.tutor.findUnique({
        where: { dni: dataDto.dni },
      });

      if (existingTutor) {
        throw new BadRequestException('El tutor con este DNI ya existe.');
      }

      // Crear el tutor
      const tutor = await prismaData.tutor.create({
        data: {
          ...tutorData,
          students: {
            create: students.map((student) => ({
              ...student,
              code: this.generateStudentCode(student.firstName, student.lastName),
            })),
          },
        },
        include: { students: true },
      });

      return tutor;
    });
  }

  private generateStudentCode(  firstName: string, lastName: string): string {
      const year: number = new Date().getFullYear();
      const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
      return `${year}${initials}`;

  }

  async findAll(paginationDto:PaginationDto) {
    const { limit, page } = paginationDto;
    const totalPage = await this.prismaService.tutor.count(
      {
        where: { deletedAt: null }
      }
    );
    const lastPage = Math.ceil(totalPage / limit);
    
    return{
      meta:{
        total: totalPage,
        lastPage,
        page
      },
      data: await this.prismaService.tutor.findMany({
        where: { deletedAt: null },
        take: limit,
        skip: (page - 1) * limit,
        include: { students: true }
      })
    }

  }

  async findOne(id: string) {
    const tutor = await this.prismaService.tutor.findUnique(
      {
        where: { id: id },
        include: { students: true }
      }
    );
    return tutor;
  }

  update(id: string, updateTutorDto: UpdateTutorDto) {
    return `This action updates a #${id} tutor`;
  }

  remove(id: string) {
    return `This action removes a #${id} tutor`;
  }
}
