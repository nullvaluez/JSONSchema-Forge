import { createLogger, format, transports } from 'winston';
import fs from 'fs-extra';
import path from 'path';

export function configureLogger(logDirectory) {
  fs.ensureDirSync(logDirectory);

  const logger = createLogger({
    level: 'debug',
    format: format.combine(
      format.timestamp(),
      format.printf(
        ({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`
      )
    ),
    transports: [
      new transports.Console({ level: 'debug' }),
      new transports.File({ filename: path.join(logDirectory, 'app.log') }),
      new transports.File({ filename: path.join(logDirectory, 'error.log'), level: 'error' }),
    ],
  });

  return logger;
}
