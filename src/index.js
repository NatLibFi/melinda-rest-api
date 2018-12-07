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


// Import aut from './routes/aut';
import bib from './routes/bib';

import {HTTP_PORT, SWAGGER_UI_URL} from './config';

const app = express();

app.use(bodyParser.text({limit: '5MB'}));

app.use('/bib', bib);
//app.use('/aut', aut);
app.use('/doc', express.static(path.resolve(__dirname, '..', 'doc')));

app.use('/', (req, res) => {
	const accepts = req.accepts('text/html', 'application/xhtml+xml', 'application/json');

	if (accepts === 'application/json') {
		res.redirect(HttpStatus.MOVED_PERMANENTLY, '/doc/api.json');
	} else {
		res.redirect(HttpStatus.MOVED_PERMANENTLY, SWAGGER_UI_URL);
	}
});

app.listen(HTTP_PORT, () => console.log('Started Melinda REST API'));
