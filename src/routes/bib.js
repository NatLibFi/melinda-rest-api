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
import {Strategy as MelindaStrategy} from '../auth';
// Import createBibService as bib from '../services/bib';
import {ALEPH_X_SERVICE_URL, ALEPH_USER_LIBRARY} from '../config'

export default Router;

const BibRouter = new Router();

passport.use(new MelindaStrategy({url: ALEPH_X_SERVICE_URL, library: ALEPH_USER_LIBRARY}));
BibRouter.use(passport.initialize());

BibRouter.use(passport.authenticate('melinda'));

BibRouter.post('/', async res => {
	console.log('BAR');
	res.send('FOO');
});
/*
Router.post('/', async (req, res) => {
	try {
		const options = {
			noop: req.query.noop,
			unique: req.query.unique,
			data: req.body,
			format: parseContentType(req),
			cataloguer: req.user.id
		};

		const id = await bib.create(options);
		res.status(result.status || 200).send(result.data);
	} catch (err) {
		if (err instanceof RecordServiceError) {
		}

		return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
	}
});

Router.post('/:id', async (req, res) => {
	const type = req.get('Content-Type');

	const format = MIMETYPES[type];

	const options = {
		format,
		recordId: req.params.id,
		noop: req.query.noop === 'true',
		sync: req.query.sync === 'true',
		cataloguer: req.user.id
	};

	try {
		const result = await bib.postBibRecordsById(req.body, options);
		res.status(result.status || 200).send(result.data);
	} catch (err) {
		return res.status(err.status || 500).send(err.message);
	}
});

Router.get('/:id', async (req, res) => {
	const type = req.accepts(Object.keys(MIMETYPES));

	const format = MIMETYPES[type];

	const options = {
		recordId: req.params.id,
		format
	};

	try {
		const result = await bib.getBibRecordById(options);

		res.type(type).status(result.status || 200).send(result.data);
	} catch (err) {
		return res.status(err.status || 500).send(err.message);
	}
});

function parseContentType(request) {
	const type = request.headers['Content-Type'];

	switch (type) {
		case 'application/marc':
		return 'iso2709';
		case 'application/xml':
		return 'marcxml';
		case 'application/json':
		return 'json';
	}
}
*/
