import { Body, Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from 'src/resources/auth/public-strategy';
import { BaseUser } from 'src/resources/users/dto/base-user.dto';
import { EventNames } from '../events/event.module';

@Controller('client')
export class ClientController {
  constructor(private eventEmitter: EventEmitter2) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Get('upload')
  @ApiOperation({ summary: 'Project Upload' })
  @ApiResponse({
    status: 200,
    description: 'The record found',
    type: [BaseUser],
  })
  upload() {
    console.log('upload');
    const projectPath =
      'C:\\Users\\user\\Desktop\\Final_Year_Project\\backend\\projects\\my-vue-app';
    this.eventEmitter.emit(EventNames.PROJECT_UPLOADED, {
      projectPath: projectPath,
    });
   
  }
}
