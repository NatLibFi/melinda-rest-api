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

import {Router} from 'express';
import passport from 'passport';
import HttpStatus from 'http-status';
import {v4 as uuid} from 'uuid';
import ApiError from '@natlibfi/melinda-commons';
import {conversionFormats, checkIfOfflineHours} from '@natlibfi/melinda-rest-api-commons';
import {SRU_URL_BIB, OFFLINE_BEGIN, OFFLINE_DURATION} from '../config';
import createService from '../interfaces/prio';
import {formatRequestBoolean} from '../utils';

export default async () => {
	const CONTENT_TYPES = {
		'application/json': conversionFormats.JSON,
		'application/marc': conversionFormats.ISO2709,
		'application/xml': conversionFormats.MARCXML
	};

	const Service = await createService({
		sruURL: SRU_URL_BIB
	});

	return new Router()
		.use(passport.authenticate('melinda', {session: false}))
		.use(checkOfflineHours)
		.post('/', createResource)
		.get('/:id', readResource)
		.post('/:id', updateResource)
		.use((err, req, res, next) => {
			if (err instanceof ApiError) {
				res.status(err.status).send(err.payload);
			} else {
				next(err);
			}
		});

	async function readResource(req, res, next) {
		try {
			const type = req.accepts(Object.keys(CONTENT_TYPES));

			if (type) {
				const format = CONTENT_TYPES[type];
				const record = await Service.read({id: req.params.id, format});
				res.type(type).status(HttpStatus.OK).send(record);
			} else {
				throw new ApiError(HttpStatus.NOT_ACCEPTABLE);
			}
		} catch (err) {
			next(err);
		}
	}

	async function createResource(req, res, next) {
		try {
			const type = req.headers['content-type'];
			const format = CONTENT_TYPES[type];
			const correlationId = uuid();

			if (!format) {
				throw new ApiError(HttpStatus.UNSUPPORTED_MEDIA_TYPE);
			}

			const unique = req.query.unique === undefined ? true : formatRequestBoolean(req.query.unique);
			const noop = formatRequestBoolean(req.query.noop);
			const messages = await Service.create({
				format,
				unique,
				noop,
				data: req.body,
				cataloger: req.user,
				correlationId
			});

			if (!noop) {
				res.status(HttpStatus.CREATED).set('Record-ID', messages.id);
			}

			res.type('application/json').send(messages);
		} catch (err) {
			next(err);
		}
	}

	async function updateResource(req, res, next) {
		try {
			const type = req.headers['content-type'];
			const format = CONTENT_TYPES[type];
			const correlationId = uuid();

			if (!format) {
				throw new ApiError(HttpStatus.UNSUPPORTED_MEDIA_TYPE);
			}

			const noop = formatRequestBoolean(req.query.noop);
			const messages = await Service.update({
				id: req.params.id,
				data: req.body,
				format,
				cataloger: req.user,
				noop,
				correlationId
			});
			res.status(HttpStatus.OK).set('Record-ID', messages.id);
			res.type('application/json').json(messages);
		} catch (err) {
			next(err);
		}
	}

	function checkOfflineHours(req, res, next) {
		if (checkIfOfflineHours(OFFLINE_BEGIN, OFFLINE_DURATION)) {
			throw new ApiError(HttpStatus.SERVICE_UNAVAILABLE, `${HttpStatus['503_MESSAGE']} Offline hours begin at ${OFFLINE_BEGIN} and will last next ${OFFLINE_DURATION} hours.`);
		}

		next();
	}
};
