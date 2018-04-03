/* eslint-disable no-unused-vars, valid-jsdoc */

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
import MarcRecord from 'marc-record-js';
import * as AuthorizedPortion from '@natlibfi/melinda-marc-record-utils/dist/authorized-portion';
import IORedis from 'ioredis';
import dateAddSeconds from 'date-fns/add_seconds';
import dateParse from 'date-fns/parse';
import dateFormat from 'date-fns/format';
import dateIsFuture from 'date-fns/is_future';
import {readEnvironmentVariable} from '../utils';
import connection from '../z3950';
import {recordFrom, recordTo, findNewerCATFields, selectFirstSubfieldValue} from '../record-utils';
import fieldOrderComparator from '../marc-field-sort';

const redisPrefix = readEnvironmentVariable('REDIS_PREFIX', 'melinda-rest-api', false);
const lockDuration = readEnvironmentVariable('LOCK_DURATION', 3600, false);

const redis = new IORedis({
	keyPrefix: redisPrefix ? redisPrefix + ':' : ''
});

export const getRecordLock = async (recordId) => {
	const lock = await redis.hgetall('lock:' + recordId);

	const lockExists = Object.getOwnPropertyNames(lock).length > 0 && dateIsFuture(lock.expiresAt);

	if (!lockExists) {
		return false;
	}

	return lock;
};

export const fetchRecordById = (recordId, verifyIfExists = false) => {
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
 * @param {Object} options
 * @param {Boolean} options.noop Do not create the record but return the messages about the operation
 * @param {Boolean} options.unique Do not create the record if there are duplicates in the datastore
 * @param {Boolean} options.ownerAuthorization Require the credentials to have authority to change owner metadata
 * @throws {Error}
 * @return {Promise}
 */
export const postBibRecords = async options => {
  // Implement your business logic here...
  //
  // This function should return as follows:
  //
  // return {
  //   status: 200, // Or another success code.
  //   data: [] // Optional. You can put whatever you want here.
  // };
  //
  // If an error happens during your business logic implementation,
  // you should throw an error as follows:
  //
  // throw new Error({
  //   status: 500, // Or another error code.
  //   error: 'Server Error' // Or another error message.
  // });

	return {
		code: 200,
		data: 'postBibRecords ok!'
	};
};

/**
 * @param {Object} options
 * @param {String} options.id The identifier of the record that&#x27;s going to be updated
 * @param {Boolean} options.noop Do not actually do the update but return the record in the format it would be uploaded
 * @param {Boolean} options.sync Synchronize changes between the incoming record and the record in the datastore
 * @param {Boolean} options.ownerAuthorization Require the credentials to have authority to change owner metadata
 * @throws {Error}
 * @return {Promise}
 */
export const postBibRecordsById = async (body, options) => {
	const {recordId, format, sync = false, noop = false} = options;

	const lock = await getRecordLock(recordId);

	if (lock && lock.user !== lock.userName) {
		return {
			status: 409,
			data: 'Conflict'
		};
	}

	const finalizedRecord = recordFrom(body, format);

	if (sync) {
		const originalRecord = await fetchRecordById(recordId);

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

	return {
		status: 200,
		data: recordTo(finalizedRecord, format)
	};
};

/**
 * @param {Object} options
 * @throws {Error}
 * @return {Promise}
 */
export const getBibRecordById = async options => {
	const {recordId, format = 'json'} = options;

	const record = await fetchRecordById(recordId);

	return {
		status: 200,
		data: recordTo(record, format)
	};
};

/**
 * @param {Object} options
 * @throws {Error}
 * @return {Promise}
 */
export const postBibRecordsByIdLock = async options => {
	try {
		const {recordId, user} = options;

		const recordExists = await fetchRecordById(recordId, true);

		if (!recordExists) {
			return {
				status: 404,
				data: 'Not Found'
			};
		}

		const lock = await getRecordLock(recordId);

		if (lock && lock.user !== user.userName) {
			return {
				status: 409,
				data: 'Creating or updating a lock failed because the lock is held by another user'
			};
		}

		const expiresAt = dateAddSeconds(Date.now(), lockDuration);

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
 * @param {Object} options
 * @throws {Error}
 * @return {Promise}
 */
export const deleteBibRecordsByIdLock = async options => {
	try {
		const {recordId, user} = options;

		const lock = await getRecordLock(recordId);

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
 * @param {Object} options
 * @throws {Error}
 * @return {Promise}
 */
export const getBibRecordsByIdLock = async options => {
	try {
		const {recordId, user} = options;

		const lock = await getRecordLock(recordId);

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
