import { HttpStatus } from '@nestjs/common';
import {
  TokenNotFoundException,
  CallBackFailedException,
  OtherException,
  NotFoundException,
  InternalErrorException,
  InvalidDataException,
} from './github.exception';

describe('GitHub Exceptions', () => {
  describe('TokenNotFoundException', () => {
    it('should create with correct message and status', () => {
      const exception = new TokenNotFoundException();
      expect(exception.message).toBe('Could not get GitHub access token');
      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('CallBackFailedException', () => {
    it('should create with correct message and status', () => {
      const exception = new CallBackFailedException();
      expect(exception.message).toBe('Callback failed');
      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('OtherException', () => {
    it('should create with default status', () => {
      const exception = new OtherException('Test error');
      expect(exception.message).toBe('Test error');
      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
    });

    it('should create with custom status', () => {
      const exception = new OtherException('Test error', HttpStatus.BAD_REQUEST);
      expect(exception.message).toBe('Test error');
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('NotFoundException', () => {
    it('should create with default message and status', () => {
      const exception = new NotFoundException();
      expect(exception.message).toBe('Not Found');
      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
    });

    it('should create with custom message and status', () => {
      const exception = new NotFoundException('Custom not found', HttpStatus.NOT_FOUND);
      expect(exception.message).toBe('Custom not found');
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('InternalErrorException', () => {
    it('should create with default message and status', () => {
      const exception = new InternalErrorException();
      expect(exception.message).toBe('Internal Server Error');
      expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should create with custom message and status', () => {
      const exception = new InternalErrorException('Custom error', HttpStatus.BAD_GATEWAY);
      expect(exception.message).toBe('Custom error');
      expect(exception.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });
  });

  describe('InvalidDataException', () => {
    it('should create with default message and status', () => {
      const exception = new InvalidDataException();
      expect(exception.message).toBe('Invalid data');
      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
    });

    it('should create with custom message and status', () => {
      const exception = new InvalidDataException('Custom invalid data', HttpStatus.BAD_REQUEST);
      expect(exception.message).toBe('Custom invalid data');
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });
  });
}); 