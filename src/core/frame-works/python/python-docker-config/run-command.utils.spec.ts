import { modifyRunCommand } from './run-command.utils';
import { PORT } from '../constants';

describe('modifyRunCommand', () => {
  it('removes existing port flags and appends new --port', () => {
    const input = 'uvicorn app:app --port=8000 -p 5000 --port $PORT';
    const result = modifyRunCommand(input);
    expect(result).toBe(`uvicorn app:app --port ${PORT}`);
  });

  it('trims extra spaces and appends port', () => {
    const input = '  python server.py   ';
    const result = modifyRunCommand(input);
    expect(result).toBe(`python server.py --port ${PORT}`);
  });

  it('handles commands with no existing port flags', () => {
    const input = 'gunicorn app:app';
    const result = modifyRunCommand(input);
    expect(result).toBe(`gunicorn app:app --port ${PORT}`);
  });
});
