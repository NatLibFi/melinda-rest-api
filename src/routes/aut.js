const express = require('express');
const aut = require('../services/aut');

const router = new express.Router();

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
	const options = {
		id: req.params.id,
		noop: req.query.noop,
		sync: req.query.sync
	};

	try {
		const result = await aut.postAutNamesRecordsById(options);
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
	const options = {
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
	const options = {
		id: req.params.id,
		noop: req.query.noop,
		sync: req.query.sync
	};

	try {
		const result = await aut.postAutSubjectsRecordsById(options);
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
	const options = {
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

module.exports = router;