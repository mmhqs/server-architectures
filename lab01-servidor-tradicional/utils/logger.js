const winston = require('winston');

// Define o formato do log
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

// Cria o logger
const logger = winston.createLogger({
  level: 'info', // Nível mínimo de log a ser gravado
  format: logFormat,
  transports: [
    // Grava logs no console (para desenvolvimento)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Grava logs em um arquivo (útil em produção)
    new winston.transports.File({ filename: 'logs/app.log' })
  ],
});

module.exports = logger;