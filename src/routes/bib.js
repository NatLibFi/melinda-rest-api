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
import bodyParser from 'body-parser';
import * as bib from '../services/bib';
import {MIMETYPES, MIMETYPES_JSON, MIMETYPES_TEXT} from '../constants';

const router = new express.Router();

router.use(bodyParser.json({type: MIMETYPES_JSON}));
router.use(bodyParser.text({type: MIMETYPES_TEXT}));

/**
 * Create a record
 */
router.post('/records', async (req, res) => {
	const options = {
		noop: req.query.noop,
		unique: req.query.unique,
		ownerAuthorization: req.query.ownerAuthorization
	};

	try {
		const result = await bib.postBibRecords(options);
		res.status(result.status || 200).send(result.data);
	} catch (err) {
		return res.status(err.status || 500).send(err.message);
	}
});

/**
 * Update a record
 */
router.post('/records/:id', async (req, res) => {
	const type = req.get('Content-Type');

	const format = MIMETYPES[type];

	const options = {
		recordId: req.params.id,
		noop: req.query.noop === 'true',
		sync: req.query.sync === 'true',
		ownerAuthorization: req.query.ownerAuthorization == 'true',
		user: req.user,
		format
	};

	try {
		const result = await bib.postBibRecordsById(req.body, options);
		res.status(result.status || 200).send(result.data);
	} catch (err) {
		return res.status(err.status || 500).send(err.message);
	}
});

/**
 * Retrieve a record
 */
router.get('/records/:id', async (req, res) => {
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

/**
 * Lock a record or renew the record's lock
 */
router.post('/records/:id/lock', async (req, res) => {
	const options = {
		recordId: req.params.id,
		user: req.user
	};

	try {
		const result = await bib.postBibRecordsByIdLock(options);

		res.status(result.status || 200).send(result.data);
	} catch (err) {
		console.log(err);
		return res.status(err.status || 500).send(err.message);
	}
});

/**
 * Unlock a record
 */
router.delete('/records/:id/lock', async (req, res) => {
	const options = {
		recordId: req.params.id,
		user: req.user
	};

	try {
		const result = await bib.deleteBibRecordsByIdLock(options);
		res.status(result.status || 200).send(result.data);
	} catch (err) {
		return res.status(err.status || 500).send(err.message);
	}
});

/**
 * Retrieve information about a record lock
 */
router.get('/records/:id/lock', async (req, res) => {
	const options = {
		recordId: req.params.id,
		user: req.user
	};

	try {
		const result = await bib.getBibRecordsByIdLock(options);
		res.status(result.status || 200).send(result.data);
	} catch (err) {
		return res.status(err.status || 500).send(err.message);
	}
});

export default router;
