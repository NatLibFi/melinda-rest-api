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

import express from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import swaggerUi from 'swagger-ui-express';
import passport from 'passport';

import apiDoc from '../api';
import aut from './routes/aut';
import bib from './routes/bib';

import initializeAuth from './auth';

const app = express();

app.use(passport.initialize());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

app.use(passport.authenticate('basic'));

initializeAuth();

/* Routes
 */
app.use('/bib', bib);
app.use('/aut', aut);

app.use('/', (req, res, next) => {
	const accepts = req.accepts('text/html', 'application/xhtml+xml', 'application/json');

	if (req.headers['content-type'] === 'application/json' || accepts === 'application/json') {
		return res.send(apiDoc);
	}

	next();
}, swaggerUi.serve, swaggerUi.setup(apiDoc));

// Catch 404
app.use((req, res) => {
	console.error(`Error 404 on ${req.url}.`);
	res.status(404).send({status: 404, error: 'Not found'});
});

// Catch errors
app.use((err, req, res) => {
	const status = err.status || 500;
	console.error(`Error ${status} (${err.message}) on ${req.method} ${req.url} with payload ${req.body}.`);
	res.status(status).send({status, error: 'Server error'});
});

export default app;
