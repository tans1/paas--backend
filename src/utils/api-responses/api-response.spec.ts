import { CustomApiResponse } from './api-response';

describe('CustomApiResponse', () => {
  describe('constructor', () => {
    it('initializes all properties correctly', () => {
      const resp = new CustomApiResponse(true, 'OK', 100, { a: 1 });
      expect(resp.success).toBe(true);
      expect(resp.message).toBe('OK');
      expect(resp.error_code).toBe(100);
      expect(resp.data).toEqual({ a: 1 });
    });

    it('defaults data to null when not provided', () => {
      const resp = new CustomApiResponse(false, 'Fail', 400);
      expect(resp.success).toBe(false);
      expect(resp.message).toBe('Fail');
      expect(resp.error_code).toBe(400);
      expect(resp.data).toBeNull();
    });
  });

  describe('static success', () => {
    it('creates a success response with default message and null data', () => {
      const resp = CustomApiResponse.success();
      expect(resp).toBeInstanceOf(CustomApiResponse);
      expect(resp.success).toBe(true);
      expect(resp.message).toBe('Success');
      expect(resp.error_code).toBeUndefined();
      expect(resp.data).toBeNull();
    });

    it('accepts custom data and message', () => {
      const payload = { id: 1 };
      const resp = CustomApiResponse.success(payload, 'All good');
      expect(resp.success).toBe(true);
      expect(resp.message).toBe('All good');
      expect(resp.error_code).toBeUndefined();
      expect(resp.data).toBe(payload);
    });
  });

  describe('static error', () => {
    it('creates an error response with given message and error code, data null by default', () => {
      const resp = CustomApiResponse.error('Oops', 123);
      expect(resp.success).toBe(false);
      expect(resp.message).toBe('Oops');
      expect(resp.error_code).toBe(123);
      expect(resp.data).toBeNull();
    });

    it('accepts optional data parameter', () => {
      const payload = ['x', 'y'];
      const resp = CustomApiResponse.error('Bad', 500, payload);
      expect(resp.success).toBe(false);
      expect(resp.message).toBe('Bad');
      expect(resp.error_code).toBe(500);
      expect(resp.data).toBe(payload);
    });
  });
});
