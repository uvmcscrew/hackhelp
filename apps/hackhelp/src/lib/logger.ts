import { dev } from '$app/env';
import winston from 'winston';

export const logger = winston.createLogger({
	level: 'info',
	format: dev ? winston.format.simple() : winston.format.json(),
	transports: [new winston.transports.Console()]
});
