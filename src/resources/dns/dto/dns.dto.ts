import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class DNSDto {
  @ApiProperty({
    example: 'example.com',
    description: 'The domain name of the project',
  })
  @IsNotEmpty()
  @IsString()
  domain: string;

  @ApiProperty({
    example: 123,
    description: 'The ID of the project',
  })
  @IsNotEmpty()
  @IsNumber()
  projectId: number;
}
