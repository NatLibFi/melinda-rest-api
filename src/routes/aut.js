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
import * as aut from '../services/aut';
import {MIMETYPES, MIMETYPES_JSON, MIMETYPES_TEXT} from '../constants';

const router = new express.Router();

router.use(bodyParser.json({type: MIMETYPES_JSON}));
router.use(bodyParser.text({type: MIMETYPES_TEXT}));

/**
 * Create a record
 */
router.post('/names/records', async (req, res) => {
	const options = {
		noop: req.query.noop,
		unique: req.query.unique
	};

	try {
		const result = await aut.postAutNamesRecords(options);
		res.status(result.status || 200).send(result.data);
	} catch (err) {
		return res.status(err.status).send({
			status: err.status,
			error: err.error
		});
	}
});

/**
 * Update a record
 */
router.post('/names/records/:id', async (req, res) => {
	const type = req.get('Content-Type');

	const format = MIMETYPES[type];

	const options = {
		recordId: req.params.id,
		noop: req.query.noop === 'true',
		sync: req.query.sync === 'true',
		user: req.user,
		format
	};

	try {
		const result = await aut.postAutNamesRecordsById(req.body, options);
		res.status(result.status || 200).send(result.data);
	} catch (err) {
		return res.status(err.status).send({
			status: err.status,
			error: err.error
		});
	}
});

/**
 * Retrieve a record
 */
router.get('/names/records/:id', async (req, res) => {
	const type = req.accepts(Object.keys(MIMETYPES));

	const format = MIMETYPES[type];

	const options = {
		recordId: req.params.id,
		format
	};

	try {
		const result = await aut.getAutNamesRecordsById(options);
		res.status(result.status || 200).send(result.data);
	} catch (err) {
		return res.status(err.status).send({
			status: err.status,
			error: err.error
		});
	}
});

/**
 * Lock a record or renew the record's lock
 */
router.post('/names/records/:id/lock', async (req, res) => {
	const options = {
		recordId: req.params.id,
		user: req.user
	};

	try {
		const result = await aut.postAutNamesRecordsByIdLock(options);
		res.status(result.status || 200).send(result.data);
	} catch (err) {
		return res.status(err.status).send({
			status: err.status,
			error: err.error
		});
	}
});

/**
 * Unlock a record
 */
router.delete('/names/records/:id/lock', async (req, res) => {
	const options = {
		recordId: req.params.id,
		user: req.user
	};

	try {
		const result = await aut.deleteAutNamesRecordsByIdLock(options);
		res.status(result.status || 200).send(result.data);
	} catch (err) {
		return res.status(err.status).send({
			status: err.status,
			error: err.error
		});
	}
});

/**
 * Retrieve information about a record lock
 */
router.get('/names/records/:id/lock', async (req, res) => {
	const options = {
		recordId: req.params.id,
		user: req.user
	};

	try {
		const result = await aut.getAutNamesRecordsByIdLock(options);
		res.status(result.status || 200).send(result.data);
	} catch (err) {
		return res.status(err.status).send({
			status: err.status,
			error: err.error
		});
	}
});

/**
 * Create a record
 */
router.post('/subjects/records', async (req, res) => {
	const options = {
		noop: req.query.noop,
		unique: req.query.unique
	};

	try {
		const result = await aut.postAutSubjectsRecords(options);
		res.status(result.status || 200).send(result.data);
	} catch (err) {
		return res.status(err.status).send({
			status: err.status,
			error: err.error
		});
	}
});

/**
 * Update a record
 */
router.post('/subjects/records/:id', async (req, res) => {
	const type = req.get('Content-Type');

	const format = MIMETYPES[type];

	const options = {
		recordId: req.params.id,
		noop: req.query.noop === 'true',
		sync: req.query.sync === 'true',
		user: req.user,
		format
	};

	try {
		const result = await aut.postAutSubjectsRecordsById(req.body, options);
		res.status(result.status || 200).send(result.data);
	} catch (err) {
		return res.status(err.status).send({
			status: err.status,
			error: err.error
		});
	}
});

/**
 * Retrieve a record
 */
router.get('/subjects/records/:id', async (req, res) => {
	const type = req.accepts(Object.keys(MIMETYPES));

	const format = MIMETYPES[type];

	const options = {
		recordId: req.params.id,
		format
	};

	try {
		const result = await aut.getAutSubjectsRecordsById(options);
		res.status(result.status || 200).send(result.data);
	} catch (err) {
		return res.status(err.status).send({
			status: err.status,
			error: err.error
		});
	}
});

/**
 * Lock a record or renew the record's lock
 */
router.post('/subjects/records/:id/lock', async (req, res) => {
	const options = {
		recordId: req.params.id,
		user: req.user
	};

	try {
		const result = await aut.postAutSubjectsRecordsByIdLock(options);
		res.status(result.status || 200).send(result.data);
	} catch (err) {
		return res.status(err.status).send({
			status: err.status,
			error: err.error
		});
	}
});

/**
 * Unlock a record
 */
router.delete('/subjects/records/:id/lock', async (req, res) => {
	const options = {
		recordId: req.params.id,
		user: req.user
	};

	try {
		const result = await aut.deleteAutSubjectsRecordsByIdLock(options);
		res.status(result.status || 200).send(result.data);
	} catch (err) {
		return res.status(err.status).send({
			status: err.status,
			error: err.error
		});
	}
});

/**
 * Retrieve information about a record lock
 */
router.get('/subjects/records/:id/lock', async (req, res) => {
	const options = {
		recordId: req.params.id,
		user: req.user
	};

	try {
		const result = await aut.getAutSubjectsRecordsByIdLock(options);
		res.status(result.status || 200).send(result.data);
	} catch (err) {
		return res.status(err.status).send({
			status: err.status,
			error: err.error
		});
	}
});

export default router;
