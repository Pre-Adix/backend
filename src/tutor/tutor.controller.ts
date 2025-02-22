import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { TutorService } from './tutor.service';
import { CreateTutorWithStudentsDto } from './dto/create-tutor-with-student.dto';
import { UpdateTutorDto } from './dto/update-tutor.dto';
import { PaginationDto } from 'src/common';

@Controller('tutor')
export class TutorController {
  constructor(private readonly tutorService: TutorService) {}

  @Post()
  create(@Body() createTutorDto: CreateTutorWithStudentsDto) {
    return this.tutorService.create(createTutorDto);
  }

  @Get()
  findAll(@Query() paginationDto:PaginationDto) {
    return this.tutorService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tutorService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTutorDto: UpdateTutorDto) {
    return this.tutorService.update(id, updateTutorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tutorService.remove(id);
  }
}
