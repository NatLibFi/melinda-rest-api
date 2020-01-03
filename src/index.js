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
import ServiceError from './services/error';
import passport from 'passport';
import {MarcRecord} from '@natlibfi/marc-record';
import {Authentication, Utils} from '@natlibfi/melinda-commons';
import Mongoose from 'mongoose';
import {checkReplyQueue} from './services/replyToService';
import {createBibRouter, createBibBulkRouter, createApiDocRouter} from './routes';

import {
	HTTP_PORT, ENABLE_PROXY,
	ALEPH_X_SVC_URL, ALEPH_USER_LIBRARY,
	OWN_AUTHZ_URL, OWN_AUTHZ_API_KEY,
	MONGO_URI, MONGO_POOLSIZE, MONGO_DEBUG
} from './config';
import {logError} from './utils';

const {createLogger, createExpressLogger} = Utils;
const logger = createLogger(); // eslint-disable-line no-unused-vars

// Aleph creates partial subfields...
MarcRecord.setValidationOptions({subfieldValues: false});

process.on('SIGINT', () => {
	Mongoose.disconnect();
	process.exit(1);
});

run();

async function run() {
	const app = express();

	if (ENABLE_PROXY) {
		app.enable('trust proxy', true);
	}

	passport.use(new Authentication.Aleph.AlephStrategy({
		xServiceURL: ALEPH_X_SVC_URL, userLibrary: ALEPH_USER_LIBRARY,
		ownAuthzURL: OWN_AUTHZ_URL, ownAuthzApiKey: OWN_AUTHZ_API_KEY
	}));

	Mongoose.set('debug', MONGO_DEBUG);
	try {
		await Mongoose.connect(MONGO_URI, {useNewUrlParser: true, poolSize: MONGO_POOLSIZE});
	} catch (err) {
		throw new Error(`Failed connecting to MongoDB: ${err instanceof Error ? err.stack : err}`);
	}

	app.use(createExpressLogger());
	app.use(passport.initialize());
	app.use('/bulk', await createBibBulkRouter()); // Must be here to avoid bodyparser
	app.use(bodyParser.text({limit: '5MB', type: '*/*'}));
	app.use('/api', createApiDocRouter());
	app.use('/', await createBibRouter());
	app.use(handleError);

	app.listen(HTTP_PORT, () => logger.log('info', 'Started Melinda REST API'));
	checkReplyQueue();

	function handleError(err, req, res, next) {
		if (res.headersSent) {
			return next(err);
		}

		logError(err);
		if (err instanceof ServiceError) {
			console.log('responding service');
			res.status(err.status).send(err.payload).end();
		} else {
			console.log('responding internal');
			res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}
