/* eslint-disable no-unused-vars, valid-jsdoc, import/default */

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
import axios from 'axios';
import passport from 'passport';
import MarcRecord from 'marc-record-js';
import * as AuthorizedPortion from '@natlibfi/melinda-marc-record-utils/dist/authorized-portion';
import dateAddSeconds from 'date-fns/add_seconds';
import dateParse from 'date-fns/parse';
import dateFormat from 'date-fns/format';
import dateIsFuture from 'date-fns/is_future';
import {recordFrom, recordTo, findNewerCATFields, selectFirstSubfieldValue} from '../record-utils';
import fieldOrderComparator from '../marc-field-sort';
import validate from '../marc-record-validate';
import {LOCK_DURATION} from '../config';

export const getRecordLock = async (redis, recordId) => {
	const lock = await redis.hgetall('lock:' + recordId);

	const lockExists = Object.getOwnPropertyNames(lock).length > 0 && dateIsFuture(lock.expiresAt);

	if (!lockExists) {
		return false;
	}

	return lock;
};

export const fetchRecordById = (connection, recordId, verifyIfExists = false) => {
	return new Promise((resolve, reject) => {
		let record;

		connection.query('cql', `rec.id = ${recordId}`)
			.createReadStream()
			.on('data', r => {
				record = r.xml;
			})
			.on('close', () => {
				if (verifyIfExists) {
					if (record) {
						return resolve(true);
					}
					return resolve(false);
				}

				if (!record) {
					throw new Error('Record Not Found');
				}

				resolve(recordFrom(record, 'marcxml'));
			});
	});
};

/**
* @param {Object} connection node-zoom2 connection
* @param {Object} options
* @param {Boolean} options.noop Do not create the record but return the messages about the operation
* @param {Boolean} options.unique Do not create the record if there are duplicates in the datastore
* @param {Boolean} options.ownerAuthorization Require the credentials to have authority to change owner metadata
* @throws {Error}
* @return {Promise}
*/
export const postRecords = async (connection, options) => {
	return new Promise((resolve, reject) => {
		connection
			.updateRecord({
				record: options.record,
				action: 'recordInsert'
			}, (error, data) => {
				if (error) {
					reject(Object.assign(new Error(), {
						error: error.toString(),
						status: 500
					}));
					return;
				}

				// Find all lines that contain 'Record id:' and select last and extract record id
				const recordIdLines = data.apdu.split('\n').filter(line => line.indexOf('Record Id:') > -1);
				const recordId = recordIdLines[recordIdLines.length - 1].match(/Record Id: (\d+)/)[1];

				resolve({
					code: 200,
					data: {
						recordId,
						data
					}
				});
			});
	});
};

/**
* @param {Object} connection node-zoom2 connection
* @param {Object} redis ioredis connection
* @param {String} ownAuthApiUrl URL to aleph-own-auth-api
* @param {String} body The body of record to be updated
* @param {Object} options
* @param {String} options.recordId The identifier of the record that's going to be updated
* @param {String} options.format Format used to serialize and unserialize record
* @param {Boolean} options.noop Do not actually do the update but return the record in the format it would be uploaded
* @param {Boolean} options.sync Synchronize changes between the incoming record and the record in the datastore
* @param {Boolean} options.ownerAuthorization Require the credentials to have authority to change owner metadata
* @throws {Error}
* @return {Promise}
*/
export const postRecordsById = async (connection, redis, ownAuthApiUrl, body, options) => {
	const {recordId, format, user, sync = false, noop = false, ownerAuthorization = false} = options;

	const lock = await getRecordLock(redis, recordId);

	if (lock && lock.user !== user.userName) {
		return {
			status: 409,
			data: 'Conflict'
		};
	}

	const finalizedRecord = recordFrom(body, format);

	if (sync) {
		const originalRecord = await fetchRecordById(connection, recordId);

		const newerCATFields = findNewerCATFields(originalRecord, finalizedRecord);

		if (newerCATFields.length > 0) {
			if (newerCATFields.some(field => selectFirstSubfieldValue(field, 'a') !== 'CARETAKER')) {
				return {
					status: 409,
					data: 'Conflict'
				};
			}

			newerCATFields.forEach(field => finalizedRecord.appendField(field));

			const field005index = finalizedRecord.fields.findIndex(field => field.tag === '005');
			const field005 = originalRecord.fields.find(field => field.tag === '005');

			finalizedRecord.fields.splice(field005index, 1, field005);

			const fieldPairs = originalRecord.fields.map(field => {
				const subfield0 = selectFirstSubfieldValue(field, '0');

				if (subfield0 === undefined) {
					return false;
				}

				const pair = finalizedRecord.fields.find(comparedField => field.tag === comparedField.tag && subfield0 === selectFirstSubfieldValue(comparedField, '0'));

				if (pair === undefined) {
					return false;
				}

				return [
					field,
					pair
				];
			}).filter(a => a !== false);

			fieldPairs.forEach(([field1, field2]) => {
				const authorizedPortion = AuthorizedPortion.findAuthorizedPortion(AuthorizedPortion.RecordType.BIB, field1);
				const resultingField = AuthorizedPortion.updateAuthorizedPortion(AuthorizedPortion.RecordType.BIB, field2, authorizedPortion);

				finalizedRecord.fields.splice(finalizedRecord.fields.indexOf(field2), 1, resultingField);
			});

			finalizedRecord.fields.sort(fieldOrderComparator);
		}
	}

	if (ownerAuthorization) {
		const lowFields = finalizedRecord.fields.filter(field => field.tag === 'LOW');
		if (lowFields) {
			try {
				const ownLows = await fetchUserLowPermissions(user);
				const unauthorizedLows = lowFields.some(field => ownLows.indexOf(selectFirstSubfieldValue(field, 'a')) !== 0);

				if (unauthorizedLows) {
					return {
						status: 403,
						data: 'The credentials are not authorized for this operation'
					};
				}
			} catch (err) {
				console.error(err);

				throw new Error('Internal Server Error');
			}
		}
	}

	return {
		status: 200,
		data: recordTo(finalizedRecord, format)
	};

	async function fetchUserLowPermissions(user) {
		const response = await axios({
			url: ownAuthApiUrl,
			auth: {
				username: user.userName,
				password: user.password
			}
		});

		return response.data;
	}
};

/**
* @param {Object} connection node-zoom2 connection
* @param {Object} options
* @throws {Error}
* @return {Promise}
*/
export const getRecordById = async (connection, options) => {
	const {recordId, format = 'json'} = options;

	const record = await fetchRecordById(connection, recordId);

	return {
		status: 200,
		data: recordTo(record, format)
	};
};

/**
* @param {Object} connection node-zoom2 connection
* @param {Object} redis ioredis connection
* @param {Object} options
* @throws {Error}
* @return {Promise}
*/
export const postRecordsByIdLock = async (connection, redis, options) => {
	try {
		const {recordId, user} = options;

		const recordExists = await fetchRecordById(connection, recordId, true);

		if (!recordExists) {
			return {
				status: 404,
				data: 'Not Found'
			};
		}

		const lock = await getRecordLock(redis, recordId);

		if (lock && lock.user !== user.userName) {
			return {
				status: 409,
				data: 'Creating or updating a lock failed because the lock is held by another user'
			};
		}

		const expiresAt = dateAddSeconds(Date.now(), LOCK_DURATION);

		const result = await redis.multi()
			.hmset('lock:' + recordId, {
				user: user.userName,
				expiresAt: dateFormat(expiresAt)
			})
			.expireat('lock:' + recordId, dateFormat(expiresAt, 'X'))
			.exec();

		if (lock) {
			return {
				status: 204,
				data: 'The lock was succesfully renewed'
			};
		}

		return {
			status: 201,
			data: 'The lock was succesfully created'
		};
	} catch (err) {
		console.error(err);
		throw new Error('Internal Server Error');
	}
};

/**
* @param {Object} connection node-zoom2 connection
* @param {Object} redis ioredis connection
* @param {Object} options
* @throws {Error}
* @return {Promise}
*/
export const deleteRecordsByIdLock = async (connection, redis, options) => {
	try {
		const {recordId, user} = options;

		const lock = await getRecordLock(redis, recordId);

		if (!lock) {
			return {
				status: 404,
				data: 'Not Found'
			};
		}

		const result = await redis.del('lock:' + recordId);

		return {
			status: 204,
			data: 'The lock was succesfully deleted'
		};
	} catch (err) {
		console.error(err);
		throw new Error('Internal Server Error');
	}
};

/**
* @param {Object} connection node-zoom2 connection
* @param {Object} redis ioredis connection
* @param {Object} options
* @throws {Error}
* @return {Promise}
*/
export const getRecordsByIdLock = async (connection, redis, options) => {
	try {
		const {recordId, user} = options;

		const lock = await getRecordLock(redis, recordId);

		if (!lock) {
			return {
				status: 404,
				data: 'Not Found'
			};
		}

		return {
			status: 200,
			data: lock
		};
	} catch (err) {
		console.error(err);
		throw new Error('Internal Server Error');
	}
};
