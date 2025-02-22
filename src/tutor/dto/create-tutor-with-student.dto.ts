import { ArrayMinSize, IsArray, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, Min, MinLength, ValidateNested } from "class-validator"
import { StudentDto } from "../../student/dto/create-student.dto"
import { Type } from "class-transformer"
import { TutorTypeList } from "../../common/enums/type-tutor.enum"

type TutorType = 'TUTOR' | 'PADRE' | 'MADRE' 


export class CreateTutorWithStudentsDto {
  @MaxLength(10)
  @MinLength(8)
  @IsNotEmpty()
  dni         : string   

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  firstName        :string

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  lastName    :string

  @IsEmail()
  @IsNotEmpty()
  @MinLength(10)
  email?      :string  

  @IsNotEmpty()
  @MinLength(9)
  phone1      :string 
  
  @IsString()
  @MinLength(9)
  @IsOptional()
  phone2?     :string

  @IsEnum(
    TutorTypeList,
    {message: `Invalid type. The type must be a valid value of ${TutorTypeList}`}
  )
  type        :TutorType

  @IsString()
  @IsNotEmpty()
  address     :string

  @IsString()
  @IsOptional()
  observation? :string 

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({each: true})
  @Type( ()=> StudentDto)
  students  : StudentDto[]
}
