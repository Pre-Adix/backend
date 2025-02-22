import { Module } from '@nestjs/common';
import { TutorModule } from './tutor/tutor.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { CycleModule } from './cycle/cycle.module';
import { CareerModule } from './career/career.module';
@Module({
  imports: [TutorModule, EnrollmentModule, CycleModule, CareerModule],
})
export class AppModule {}
