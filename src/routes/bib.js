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
import ServiceError from '../services/error';
import createService, {FORMATS} from '../services/bib';
import {formatRequestBoolean} from '../utils';
import uuid from 'uuid';
import {SRU_URL_BIB} from '../config';
import {CHUNK_STATE} from '@natlibfi/melinda-record-import-commons';

export default async () => {
	const CONTENT_TYPES = {
		'application/json': FORMATS.JSON,
		'application/marc': FORMATS.ISO2709,
		'application/xml': FORMATS.MARCXML
	};

	const Service = await createService({
		sruURL: SRU_URL_BIB
	});

	return new Router()
		.use(passport.authenticate('melinda', {session: false}))
		.post('/', createResource)
		.get('/:id', readResource)
		.post('/:id', updateResource)
		.use((err, req, res, next) => {
			if (err instanceof ServiceError) {
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
				res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
			}
		} catch (err) {
			next(err);
		}
	}

	async function createResource(req, res, next) {
		try {
			const type = req.headers['content-type'];
			const format = CONTENT_TYPES[type];
			const QUEUEID = uuid.v1();

			if (!format) {
				return res.sendStatus(HttpStatus.UNSUPPORTED_MEDIA_TYPE);
			}

			const unique = req.query.unique === undefined ? true : formatRequestBoolean(req.query.unique);
			const noop = formatRequestBoolean(req.query.noop);
			const {messages, id} = await Service.create({
				format, unique, noop,
				data: req.body,
				cataloger: req.user,
				QUEUEID
			});

			if (!noop) {
				res.status(HttpStatus.CREATED).set('Record-ID', id);
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
			const QUEUEID = uuid.v1();

			if (!format) {
				return res.sendStatus(HttpStatus.UNSUPPORTED_MEDIA_TYPE);
			}

			const noop = formatRequestBoolean(req.query.noop);
			const messages = await Service.update({
				format, noop,
				data: req.body,
				id: req.params.id,
				cataloger: req.user,
				QUEUEID
			});

			if (messages.status === CHUNK_STATE.ERROR) {
				res.sendStatus(422).json(messages.failedRecords).end();
			}

			res.type('application/json').json(messages).end();
		} catch (err) {
			next(err);
		}
	}
};
