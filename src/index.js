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

import path from 'path';
import HttpStatus from 'http-status';
import express from 'express';
import bodyParser from 'body-parser';
import passport from 'passport';
import {MarcRecord} from '@natlibfi/marc-record';

import {Strategy as MelindaStrategy} from './auth';
import createBibRouter from './routes/bib';
import {createLogger} from './utils';
import {HTTP_PORT, SWAGGER_UI_URL, ALEPH_X_API_URL, ALEPH_USER_LIBRARY} from './config';

// Aleph creates partial subfields...
MarcRecord.setValidationOptions({subfieldValues: false});

run();

async function run() {
	const Logger = createLogger();
	const app = express();
	const BibRouter = await createBibRouter();

	passport.use(new MelindaStrategy({url: ALEPH_X_API_URL, library: ALEPH_USER_LIBRARY}));

	app.use(bodyParser.text({limit: '5MB', type: '*/*'}));
	app.use(passport.initialize());

	app.use('/bib', BibRouter);
	app.get('/doc', express.static(path.resolve(__dirname, '..', 'doc')));
	app.get('/', docHandler);
	app.use(errorHandler);

	app.listen(HTTP_PORT, () => console.log('Started Melinda REST API'));

	function docHandler(req, res) {
		const accepts = req.accepts('text/html', 'application/xhtml+xml', 'application/json');

		if (!accepts) {
			return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
		}

		if (accepts === 'application/json') {
			res.redirect(HttpStatus.MOVED_PERMANENTLY, '/doc/api.json');
		} else {
			res.redirect(HttpStatus.MOVED_PERMANENTLY, SWAGGER_UI_URL);
		}
	}

	function errorHandler(err, req, res, next) {
		if (res.headersSent) {
			return next(err);
		}

		Logger.log('error', err.stack);
		res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
	}
}
