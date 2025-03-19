import { Module } from '@nestjs/common';
import { TutorModule } from './tutor/tutor.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { CycleModule } from './cycle/cycle.module';
import { CareerModule } from './career/career.module';
import { StudentModule } from './student/student.module';
import { AreaModule } from './area/area.module';
import { AdmissionModule } from './admission/admission.module';
import { AccountReceivableModule } from './account-receivable/account-receivable.module';
import { PaymentModule } from './payment/payment.module';
@Module({
  imports: [TutorModule, EnrollmentModule, CycleModule, CareerModule, StudentModule,  AreaModule, AdmissionModule, AccountReceivableModule, PaymentModule],
})
export class AppModule {}
