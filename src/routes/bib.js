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

import {Router} from 'express';
import passport from 'passport';
import HttpStatus from 'http-status';
import ipFilter from 'express-ip-filter';
import ServiceError from '../services/error';
import createService, {FORMATS} from '../services/bib';

import {
	IP_FILTER_BIB, ALEPH_LIBRARY_BIB, SRU_URL, RECORD_LOAD_URL,
	RECORD_LOAD_API_KEY, OWN_AUTHORIZATION_URL,
	OWN_AUTHORIZATION_API_KEY
} from '../config';

export default async () => {
	const CONTENT_TYPES = {
		'application/json': FORMATS.JSON,
		'application/marc': FORMATS.ISO2709,
		'application/xml': FORMATS.MARCXML
	};

	const ipFilterList = JSON.parse(IP_FILTER_BIB);
	const Service = await createService({
		sruURL: SRU_URL, authorizationURL: OWN_AUTHORIZATION_URL,
		authorizationApiKey: OWN_AUTHORIZATION_API_KEY,
		recordLoadURL: RECORD_LOAD_URL, recordLoadApiKey: RECORD_LOAD_API_KEY,
		recordLoadLibrary: ALEPH_LIBRARY_BIB
	});

	return new Router()
		.use(ipFilter({filter: ipFilterList}))
		.use(passport.authenticate('melinda', {session: false}))
		.post('/', createResource)
		.get('/:id', readResource)
	//	.post('/:id', updateResource)
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

			if (!format) {
				return res.sendStatus(HttpStatus.UNSUPPORTED_MEDIA_TYPE);
			}

			const {messages, id} = await Service.create({
				format,
				data: req.body,
				cataloger: req.user.id,
				noop: req.query.noop,
				unique: req.query.unique
			});

			if (!req.query.noop) {
				res.status(HttpStatus.CREATED).set('Record-ID', id);
			}

			res.type('application/json').send(messages);
		} catch (err) {
			next(err);
		}
	}
};

/* Async function updateResource(req, res) {
const type = req.get('Content-Type');

const format = MIMETYPES[type];

const options = {
format,
recordId: req.params.id,
noop: req.query.noop === 'true',
sync: req.query.sync === 'true',
cataloger: req.user.id
};

try {
const result = await bib.postBibRecordsById(req.body, options);
res.status(result.status || 200).send(result.data);
} catch (err) {
return res.status(err.status || 500).send(err.message);
}
} */
