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

import fs from 'fs';
import path from 'path';
import HttpStatus from 'http-status';
import express from 'express';
import bodyParser from 'body-parser';
import passport from 'passport';
import {MarcRecord} from '@natlibfi/marc-record';
import {Authentication} from '@natlibfi/melinda-commons';

import createBibRouter from './routes/bib';
import {createLogger, createExpressLogger} from './utils';
import {
	HTTP_PORT, ENABLE_PROXY, SWAGGER_UI_URL,
	ALEPH_X_SVC_URL, ALEPH_USER_LIBRARY,
	OWN_AUTHZ_URL, OWN_AUTHZ_API_KEY
} from './config';

// Aleph creates partial subfields...
MarcRecord.setValidationOptions({subfieldValues: false});

process.on('SIGINT', () => {
	process.exit(1);
});

run();

async function run() {
	const Logger = createLogger();
	const app = express();
	const BibRouter = await createBibRouter();
	const apiDoc = JSON.parse(fs.readFileSync(path.join(__dirname, 'api.json'), 'utf8'));

	if (ENABLE_PROXY) {
		app.enable('trust proxy', true);
	}

	passport.use(new Authentication.MelindaStrategy({
		xServiceURL: ALEPH_X_SVC_URL, userLibrary: ALEPH_USER_LIBRARY,
		ownAuthzURL: OWN_AUTHZ_URL, ownAuthzApiKey: OWN_AUTHZ_API_KEY
	}));

	app.use(createExpressLogger());
	app.use(bodyParser.text({limit: '5MB', type: '*/*'}));
	app.use(passport.initialize());

	app.use('/bib', BibRouter);
	app.get('/', handleDocRequest);
	app.use(handleError);

	app.listen(HTTP_PORT, () => Logger.log('info', 'Started Melinda REST API'));

	function handleDocRequest(req, res) {
		const accepts = req.accepts('text/html', 'application/xhtml+xml', 'application/json');

		if (!accepts) {
			return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
		}

		if (accepts === 'application/json') {
			res.json(apiDoc);
		} else {
			res.redirect(HttpStatus.MOVED_PERMANENTLY, SWAGGER_UI_URL);
		}
	}

	function handleError(err, req, res, next) {
		if (res.headersSent) {
			return next(err);
		}

		console.log(err.stack);
		res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
	}
}
