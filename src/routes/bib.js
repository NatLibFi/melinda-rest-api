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
import * as bib from '../services/bib';

const router = new express.Router();

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
		return res.status(err.status).send({
			status: err.status,
			error: err.error
		});
	}
});

/**
 * Update a record
 */
router.post('/records/:id', async (req, res) => {
	const options = {
		id: req.params.id,
		noop: req.query.noop,
		sync: req.query.sync,
		ownerAuthorization: req.query.ownerAuthorization
	};

	try {
		const result = await bib.postBibRecordsById(options);
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
router.get('/records/:id', async (req, res) => {
	const type = req.accepts('json', 'xml');
	const options = {
		recordId: req.params.id,
		format: type
	};

	try {
		const result = await bib.getBibRecordById(options);

		res.type(type).status(result.status || 200).send(result.data);
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
router.post('/records/:id/lock', async (req, res) => {
	const options = {
	};

	try {
		const result = await bib.postBibRecordsByIdLock(options);
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
router.delete('/records/:id/lock', async (req, res) => {
	const options = {
	};

	try {
		const result = await bib.deleteBibRecordsByIdLock(options);
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
router.get('/records/:id/lock', async (req, res) => {
	const options = {
	};

	try {
		const result = await bib.getBibRecordsByIdLock(options);
		res.status(result.status || 200).send(result.data);
	} catch (err) {
		return res.status(err.status).send({
			status: err.status,
			error: err.error
		});
	}
});

export default router;
