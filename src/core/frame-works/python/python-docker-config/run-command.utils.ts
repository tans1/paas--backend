import { PORT } from '../constants';

export function modifyRunCommand(runCommand: string): string {
  // Remove any existing port specifications
  let modifiedCommand = runCommand
    .replace(/\s*--port\s*=\s*\d+/, '') // Remove --port=3000
    .replace(/\s*--port\s+\d+/, '') // Remove --port 3000
    .replace(/\s*-p\s+\d+/, '') // Remove -p 3000
    .replace(/\s*--port\s*=\s*\$PORT/, '') // Remove --port=$PORT
    .replace(/\s*--port\s+\$PORT/, '') // Remove --port $PORT
    .replace(/\s*-p\s+\$PORT/, ''); // Remove -p $PORT

  // Trim any extra spaces that might have been left
  modifiedCommand = modifiedCommand.replace(/\s+/g, ' ').trim();

  // Add our port specification
  return `${modifiedCommand} --port ${PORT}`;
}
