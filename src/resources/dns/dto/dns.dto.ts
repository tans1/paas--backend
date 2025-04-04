import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DNSDto {
  @ApiProperty({
    example: 'example.com',
    description: 'The domain name of the project',
  })
  @IsNotEmpty()
  @IsString()
  domain: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  projectId: number;
}
