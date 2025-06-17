import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn(),
  },
}));
jest.mock('@nestjs/swagger', () => {
  const actual = jest.requireActual('@nestjs/swagger');
  return {
    ...actual,
    DocumentBuilder: jest.fn().mockImplementation(() => ({
      setTitle: jest.fn().mockReturnThis(),
      setDescription: jest.fn().mockReturnThis(),
      setVersion: jest.fn().mockReturnThis(),
      addTag: jest.fn().mockReturnThis(),
      addBearerAuth: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue({}),
    })),
    SwaggerModule: {
      createDocument: jest.fn().mockReturnValue({}),
      setup: jest.fn(),
    },
  };
});

describe('bootstrap', () => {
  let appMock: any;

  beforeEach(() => {
    // fresh mock per test
    appMock = {
      enableCors: jest.fn(),
      listen: jest.fn().mockResolvedValue(undefined),
    };
    (NestFactory.create as jest.Mock).mockResolvedValue(appMock);

    process.env.NODE_ENV = 'development';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.PORT = '1234';
  });

  it('creates the app, configures CORS, Swagger, and starts listening', async () => {
    await jest.isolateModulesAsync(async () => {
      // require inside isolate so our mocks take effect
      require('./main');
    });

    // ensure app created
    expect(NestFactory.create).toHaveBeenCalled();
    // ensure CORS configured
    expect(appMock.enableCors).toHaveBeenCalledWith({
      origin: 'http://localhost:3000',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With',
      exposedHeaders: 'Authorization',
      credentials: true,
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });
    // swagger flow
    expect(DocumentBuilder).toHaveBeenCalled();
    expect(SwaggerModule.createDocument).toHaveBeenCalledWith(appMock, {});
    expect(SwaggerModule.setup).toHaveBeenCalledWith('api', appMock, {});
    // listen
    expect(appMock.listen).toHaveBeenCalledWith('1234', '0.0.0.0');
  });
});
