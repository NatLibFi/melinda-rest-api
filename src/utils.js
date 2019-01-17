/* eslint-disable no-unused-vars, valid-jsdoc, import/default */

/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* RESTful API for Melinda
*
* Copyright (C) 2018 University Of Helsinki (The National Library Of Finland)
*
* This file is part of melinda-rest-api
*
* melinda-rest-api program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* melinda-rest-api is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
* @licend  The above is the entire license notice
* for the JavaScript code in this file.
*
*/

/* istanbul ignore file */

import fs from 'fs';
import path from 'path';
import HttpStatus from 'http-status';
import moment from 'moment';
import winston from 'winston';
import expressWinston from 'express-winston';

function createLoggerOptions() {
	const timestamp = winston.format(info => {
		info.timestamp = moment().format();
		return info;
	});

	return {
		format: winston.format.combine(timestamp(), winston.format.printf(formatMessage)),
		transports: [
			new winston.transports.Console({
				level: process.env.DEBUG ? 'debug' : 'info',
				silent: process.env.NODE_ENV === 'test'
			})
		]
	};

	function formatMessage(i) {
		return `${i.timestamp} - ${i.level}: ${i.message}`;
	}
}

export function createLogger() {
	return winston.createLogger(createLoggerOptions());
}

export function createExpressLogger() {
	return expressWinston.logger(Object.assign({
		meta: true,
		msg: '{{req.ip}} HTTP {{req.method}} {{req.path}} - {{res.statusCode}} {{res.responseTime}}ms',
		ignoreRoute: function (req, res) {
			return false;
		}
	}, createLoggerOptions()));
}

export function readEnvironmentVariable(name, defaultValue, opts = {}) {
	if (process.env[name] === undefined) {
		if (defaultValue === undefined) {
			const message = `Mandatory environment variable missing: ${name}`;
			console.log('error', message);
			throw new Error(message);
		}

		const loggedDefaultValue = opts.hideDefaultValue ? '[hidden]' : defaultValue;
		console.log(`No environment variable set for ${name}, using default value: ${loggedDefaultValue}`);
	}

	return process.env[name] || defaultValue;
}

export function formatRequestBoolean(value) {
	if (Number.isNaN(Number(value))) {
		return value === 'true';
	}

	return Boolean(Number(value));
}

export function createWhitelistMiddleware(whitelist) {
	return (req, res, next) => {
		const ip = req.ip.split(/:/).pop();

		if (whitelist.some(pattern => pattern.test(ip))) {
			return next();
		}

		res.sendStatus(HttpStatus.FORBIDDEN);
	};
}
