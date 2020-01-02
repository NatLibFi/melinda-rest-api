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

import {Utils} from '@natlibfi/melinda-commons';
import {Router} from 'express';
import passport from 'passport';
import HttpStatus from 'http-status';
import ServiceError from '../services/error';
import uuid from 'uuid';
import createService from '../services/bib-bulk';
import {Json, MARCXML, AlephSequential, ISO2709} from '@natlibfi/marc-record-serializers';

const {createLogger} = Utils;
const logger = createLogger(); // eslint-disable-line no-unused-vars

const CONTENT_TYPES = ['application/xml', 'application/marc', 'application/json', 'application/alephseq'];

export default async () => {
	const Service = await createService();

	return new Router()
		.use(passport.authenticate('melinda', {session: false}))
		.post('/:operation', handleStream)
		.get('/', doQuerry)
		.use((err, req, res, next) => {
			if (err instanceof ServiceError) {
				res.status(err.status).send(err.payload);
			} else {
				next(err);
			}
		});

	async function handleStream(req, res, next) {
		try {
			logger.log('debug', 'Bulk blob');
			const params = {
				type: req.headers['content-type'],
				operation: req.params.operation,
				QUEUEID: uuid.v1(),
				user: req.user.id
			};

			if (params.operation === undefined || (
				params.operation.toLowerCase() !== 'update' &&
				params.operation.toLowerCase() !== 'create')
			) {
				throw new ServiceError(HttpStatus[400], 'Invalid operation');
			}

			// Custom content-types? or just: application/text, application/json, application/marc & application/xml
			if (params.type === undefined || !CONTENT_TYPES.includes(params.type)) {
				throw new ServiceError(HttpStatus[400], 'Invalid content-type');
			}

			if (params.type === 'application/alephseq') {
				await Service.handleTransformation(new AlephSequential.Reader(req), params);
			}

			if (params.type === 'application/json') {
				await Service.handleTransformation(new Json.Reader(req), params);
			}

			if (params.type === 'application/xml') {
				await Service.handleTransformation(new MARCXML.Reader(req), params);
			}

			if (params.type === 'application/marc') {
				await Service.handleTransformation(new ISO2709.Reader(req), params);
			}

			res.type('application/json').json(params).end();
		} catch (err) {
			next(err);
		}
	}

	async function doQuerry(req, res, next) {
		try {
			const response = await Service.doQuerry({user: req.user.id, query: req.query});
			console.log(response);
			res.json({request: req.query, response}).end();
		} catch (err) {
			next(err);
		}
	}
};
