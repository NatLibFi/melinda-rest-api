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

import HttpStatus from 'http-status';
import express from 'express';
import bodyParser from 'body-parser';
import passport from 'passport';
import {MarcRecord} from '@natlibfi/marc-record';
import {Authentication, Utils} from '@natlibfi/melinda-commons';

import {createBibRouter, createApiDocRouter} from './routes';

import {
	HTTP_PORT, ENABLE_PROXY,
	ALEPH_X_SVC_URL, ALEPH_USER_LIBRARY,
	OWN_AUTHZ_URL, OWN_AUTHZ_API_KEY
} from './config';

const {createLogger, createExpressLogger} = Utils;

// Aleph creates partial subfields...
MarcRecord.setValidationOptions({subfieldValues: false});

process.on('SIGINT', () => {
	process.exit(1);
});

run();

async function run() {
	const Logger = createLogger();
	const app = express();

	if (ENABLE_PROXY) {
		app.enable('trust proxy', true);
	}

	passport.use(new Authentication.Aleph.AlephStrategy({
		xServiceURL: ALEPH_X_SVC_URL, userLibrary: ALEPH_USER_LIBRARY,
		ownAuthzURL: OWN_AUTHZ_URL, ownAuthzApiKey: OWN_AUTHZ_API_KEY
	}));

	app.use(createExpressLogger());
	app.use(bodyParser.text({limit: '5MB', type: '*/*'}));
	app.use(passport.initialize());

	app.use('/', createApiDocRouter());
	app.use('/bib', createBibRouter());
	app.use(handleError);

	app.listen(HTTP_PORT, () => Logger.log('info', 'Started Melinda REST API'));

	function handleError(err, req, res, next) {
		if (res.headersSent) {
			return next(err);
		}

		console.log(err.stack);
		res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
	}
}
