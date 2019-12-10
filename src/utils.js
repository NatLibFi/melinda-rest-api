/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* RESTful API for Melinda
*
* Copyright (C) 2018-2019 University Of Helsinki (The National Library Of Finland)
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

import HttpStatus from 'http-status';
import {Utils} from '@natlibfi/melinda-commons';

const {createLogger, toAlephId} = Utils;

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

export function logError(err) {
	const logger = createLogger();
	if (err !== 'SIGINT') {
		logger.log('error', 'stack' in err ? err.stack : err);
	}

	logger.log('error', err);
}

export async function validateLine(line, index, operation) {
	const logger = createLogger();
	const lineId = line.slice(0, 9).trim();
	const regex = /^d{9}$/;
	const valid = !new RegExp(regex).test(lineId);
	const old = lineId > 0;

	if (operation === 'create') {
		return {valid, old: false, id: toAlephId(index)};
	}

	logger.log('debug', `Line is valid: ${valid}`);
	return {valid, old, id: lineId};
}
