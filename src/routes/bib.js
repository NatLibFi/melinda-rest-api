const express = require('express');
const bib = require('../services/bib');

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
	const options = {
	};

	try {
		const result = await bib.getBibRecordsById(options);
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

module.exports = router;
