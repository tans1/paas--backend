import { AuthenticatedRequest } from './user.types';

describe('User Types', () => {
  describe('AuthenticatedRequest', () => {
    it('should allow user property with email', () => {
      const request: AuthenticatedRequest = {
        user: {
          email: 'test@example.com',
        },
      } as AuthenticatedRequest;

      expect(request.user).toBeDefined();
      expect(request.user?.email).toBe('test@example.com');
    });

    it('should allow undefined user property', () => {
      const request: AuthenticatedRequest = {} as AuthenticatedRequest;

      expect(request.user).toBeUndefined();
    });

    it('should extend Express Request type', () => {
      const request: AuthenticatedRequest = {
        method: 'GET',
        url: '/test',
        headers: {},
        user: {
          email: 'test@example.com',
        },
      } as AuthenticatedRequest;

      expect(request.method).toBe('GET');
      expect(request.url).toBe('/test');
      expect(request.headers).toBeDefined();
      expect(request.user?.email).toBe('test@example.com');
    });
  });
}); 