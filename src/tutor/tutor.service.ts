import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTutorDto } from './dto/create-tutor.dto';
import { UpdateTutorDto } from './dto/update-tutor.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationDto } from 'src/common';

@Injectable()
export class TutorService {

  constructor(
    private prismaService: PrismaService
  ) {}

  async create(createTutorDto: CreateTutorDto) {
    
    return this.prismaService.$transaction(async (prismaData) => {
      const existingTutor = await prismaData.tutor.findUnique({
        where: { dni: createTutorDto.dni },
      });

      if (existingTutor) {
        throw new ConflictException('El tutor con este DNI ya existe.');
      }
      const tutor = await prismaData.tutor.create({
        data: {...createTutorDto},
        include: { students: true },
      });

      return tutor;
    });
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
    if (!tutor) {
      throw new BadRequestException('El tutor no existe.');
    }
    return tutor;
  }
 
  async searchTutorBy(query: string) {
    const result = await this.prismaService.tutor.findMany({
      where: {
        OR: [
          { dni: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } }
        ],
        deletedAt: null
      },
      include: {
        students: true,
      },
    });
     if (result.length === 0) {
          throw new NotFoundException('Estudiante no encontrado');
        }
      
        return result;
  }

  update(id: string, updateTutorDto: UpdateTutorDto) {
    return `This action updates a #${id} tutor`;
  }

  remove(id: string) {
    return this.prismaService.tutor.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }
}
