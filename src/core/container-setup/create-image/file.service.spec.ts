import { FileService } from './file.service';
import * as fs from 'fs';
import * as path from 'path';
import ignore from 'ignore';
import { HttpException } from '@nestjs/common';

jest.mock('fs');
jest.mock('path', () => ({ join: jest.fn((...p) => p.join('/')) }));
jest.mock('ignore');

describe('FileService', () => {
  let service: FileService;

  beforeEach(() => {
    service = new FileService();
  });

  describe('getRootFileNames', () => {
    it('returns directory entries names', () => {
      (fs.readdirSync as jest.Mock).mockReturnValue([
        { name: 'a.txt' },
        { name: 'b.js' },
      ]);
      expect(service.getRootFileNames('/dir')).toEqual(['a.txt','b.js']);
    });

    it('throws HttpException on fs error', () => {
      (fs.readdirSync as jest.Mock).mockImplementation(() => { throw new Error('fail'); });
      expect(() => service.getRootFileNames('/x')).toThrow(HttpException);
    });
  });

  describe('parseGitignore', () => {
    it('filters out ignored files', () => {
      (fs.readFileSync as jest.Mock).mockReturnValue('node_modules/\n*.log');
      const mockIgn = { add: jest.fn().mockReturnThis(), ignores: jest.fn(f=>f.endsWith('.js')) };
      (ignore as unknown as jest.Mock).mockReturnValue(mockIgn);

      const result = service.parseGitignore('/proj',['a.js','b.txt']);
      expect(path.join).toHaveBeenCalledWith('/proj','.gitignore');
      expect(mockIgn.add).toHaveBeenCalled();
      expect(result).toEqual(['b.txt']);
    });

    it('throws HttpException on error', () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => { throw new Error('nope'); });
      expect(() => service.parseGitignore('/p',[])).toThrow(HttpException);
    });
  });
});
