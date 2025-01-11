import { HttpException, HttpStatus } from '@nestjs/common';

export class TokenNotFoundException extends HttpException {
  constructor() {
    super('Could not get GitHub access token', HttpStatus.FORBIDDEN);
  }
}

export class CallBackFailedException extends HttpException {
  constructor() {
    super('Callback failed', HttpStatus.FORBIDDEN);
  }
}

export class OtherException extends HttpException {
  constructor(message: string, status: number = HttpStatus.FORBIDDEN) {
    super(message, status);
  }
}

export class NotFoundException extends HttpException {
  constructor(
    message: string = 'Not Found',
    status: number = HttpStatus.FORBIDDEN,
  ) {
    super(message, status);
  }
}

export class InternalErrorException extends HttpException {
  constructor(
    message: string = 'Internal Server Error',
    status: number = HttpStatus.FORBIDDEN,
  ) {
    super(message, status);
  }
}

export class InvalidDataException extends HttpException {
  constructor(
    message: string = 'Invalid data',
    status: number = HttpStatus.FORBIDDEN,
  ) {
    super(message, status);
  }
}
