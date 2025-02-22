import {  IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, IsUUID, MinLength } from "class-validator"
import { UserSexList } from "../../common/enums/user-sex.enum"
import { Gender } from "@prisma/client"

export class StudentDto {

  code?      :string 

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  firstName      :string

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  lastName  :string

  @IsEmail()
  email?     :string  

  @IsString()
  phone?     :string   

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  address   :string

  @IsUrl()
  @IsOptional()
  img?       :string

  @IsString()
  @IsNotEmpty()
  schoolId    :string

  @IsEnum(
    UserSexList,
    {message: `Invalid type. The type must be a valid value of ${UserSexList}`}
  )
  gender       : Gender

  @IsOptional()
  birthday?  :Date

}