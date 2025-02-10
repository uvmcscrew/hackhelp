import { dev } from '$app/environment';
import winston from 'winston';

export const logger = winston.createLogger({
	level: 'info',
	format: dev ? winston.format.simple() : winston.format.json(),
	transports: [new winston.transports.Console()]
});
