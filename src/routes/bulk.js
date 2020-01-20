/* eslint-disable no-warning-comments, no-unused-vars */

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

import ServiceError, {Utils} from '@natlibfi/melinda-commons';
import {Router} from 'express';
import passport from 'passport';
import HttpStatus from 'http-status';
import uuid from 'uuid';
import createService from '../services/bulk';
import {OPERATIONS} from '@natlibfi/melinda-record-import-commons';

const {createLogger} = Utils;
const logger = createLogger(); // eslint-disable-line no-unused-vars

const CONTENT_TYPES = ['application/xml', 'application/marc', 'application/json', 'application/alephseq'];

export default async () => {
	const Service = await createService();

	return new Router()
		.use(passport.authenticate('melinda', {session: false}))
		.post('/:operation', create)
		.get('/', doQuery)
		.get('/:id', readContent)
		.delete('/', remove)
		.delete('/:id', removeContent)
		.use((err, req, res, next) => {
			if (err instanceof ServiceError) {
				res.status(err.status).send(err.payload);
			} else {
				next(err);
			}
		});

	async function create(req, res, next) {
		try {
			logger.log('debug', 'Bulk blob');
			const params = {
				contentType: req.headers['content-type'],
				operation: req.params.operation,
				correlationId: req.query.id || uuid.v1(),
				cataloger: req.user.id
			};
			logger.log('debug', 'Params done');

			if (params.operation === undefined || !OPERATIONS.includes(params.operation)) {
				logger.log('debug', 'Invalid operation');
				throw new ServiceError(HttpStatus.BAD_REQUEST, 'Invalid operation');
			}

			// Custom content-types? or just: application/text, application/json, application/marc & application/xml
			if (params.contentType === undefined || !CONTENT_TYPES.includes(params.contentType)) {
				logger.log('debug', 'Invalid content type');
				throw new ServiceError(HttpStatus.BAD_REQUEST, 'Invalid content-type');
			}

			const response = await Service.create(req, params);

			res.type('application/json').json(response);
		} catch (err) {
			next(err);
		}
	}

	async function doQuery(req, res, next) {
		try {
			const response = await Service.doQuerry({cataloger: req.user.id, query: req.query});
			res.json({request: req.query, result: response});
		} catch (err) {
			next(err);
		}
	}

	/* Functions after this are here only to test purposes */
	async function readContent(req, res, next) {
		try {
			const {contentType, readStream} = await Service.readContent({cataloger: req.user.id, correlationId: req.params.id});
			res.set('Content-Type', contentType);
			readStream.pipe(res);
		} catch (err) {
			next(err);
		}
	}

	async function remove(req, res, next) {
		try {
			const response = await Service.remove({cataloger: req.user.id, correlationId: req.query.id});
			res.json({request: req.query, result: response});
		} catch (err) {
			next(err);
		}
	}

	async function removeContent(req, res, next) {
		try {
			await Service.removeContent({cataloger: req.user.id, correlationId: req.params.id});
			res.sendStatus(204);
		} catch (err) {
			next(err);
		}
	}
};
