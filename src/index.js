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

const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const PORT = 8080;

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

/*
 * Routes
 */
app.use('/bib', require('./routes/bib'));
app.use('/aut', require('./routes/aut'));

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

const server = app.listen(PORT, () => console.log(`Application started on port ${PORT}`));

server.timeout = 1800000; // Half an hour
