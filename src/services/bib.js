/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* RESTful API for Melinda
*
* Copyright (C) 2018-2019 University Of Helsinki (The National Library Of Finland)
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

import HttpStatus from 'http-status';
import {RecordMatching, OwnAuthorization} from '@natlibfi/melinda-commons';
import createSruClient from '@natlibfi/sru-client';

import createConversionService, {ConversionError} from './conversion';
import createValidationService, {ValidationError} from './validation';
import ServiceError from './error';
import {Utils} from '@natlibfi/melinda-commons';
import {pushToQueue} from './toQueueService';
import {NAME_QUEUE_PRIORITY} from '../config';
import {MARCXML} from '@natlibfi/marc-record-serializers';
import {EMITTER} from './replyToService';

export {FORMATS} from './conversion';

const {createLogger, toAlephId} = Utils;

export default async function ({sruURL}) {
	const logger = createLogger();
	const {OwnAuthorizationError} = OwnAuthorization;
	const ConversionService = createConversionService();
	const ValidationService = await createValidationService();
	const sruClient = createSruClient({serverUrl: 'https://sru.api.melinda-test.kansalliskirjasto.fi/bib', version: '2.0', maximumRecords: '1'});
	const RecordMatchingService = RecordMatching.createBibService({sruURL});

	return {read, create, update};

	async function read({id, format}) {
		try {
			logger.log('debug', `Reading record ${id} from datastore`);
			const record = await getRecord(id);

			logger.log('debug', `Serializing record ${id}`);
			return ConversionService.serialize(record, format);
		} catch (err) {
			throw err;
		}
	}

	async function create({data, format, user, noop, unique, QUEUEID}) {
		try {
			logger.log('debug', 'Unserializing record');
			const record = ConversionService.unserialize(data, format);

			logger.log('debug', 'Checking LOW-tag authorization');
			OwnAuthorization.validateChanges(user.authorization, record);

			if (unique) {
				logger.log('debug', 'Attempting to find matching records in the datastore');
				const matchingIds = await RecordMatchingService.find(record);

				if (matchingIds.length > 0) {
					throw new ServiceError(HttpStatus.CONFLICT, matchingIds);
				}
			}

			logger.log('debug', 'Validating the record');
			const validationResults = await ValidationService.validate(record);

			if (noop) {
				return validationResults;
			}

			updateField001ToParamId('1', record);
			logger.log('debug', 'Sending a new record to QUEUE');
			pushToQueue({queue: NAME_QUEUE_PRIORITY, user: user.id, QUEUEID, records: [record], operation: 'create'});

			const messages = {};
			await new Promise((res, rej) => {
				EMITTER.on(QUEUEID, reply => {
					console.log(reply);
					messages.status = reply.status;
					messages.id = reply.metadata.ids[0];
					res();
				}).on('error', err => {
					rej(err);
				});
			});

			return messages;
		} catch (err) {
			if (err instanceof ConversionError) {
				throw new ServiceError(HttpStatus.BAD_REQUEST);
			} else if (err instanceof OwnAuthorizationError) {
				throw new ServiceError(HttpStatus.FORBIDDEN);
			} else if (err instanceof ValidationError) {
				throw new ServiceError(HttpStatus.UNPROCESSABLE_ENTITY, err.messages);
			}

			throw err;
		}
	}

	async function update({id, data, format, user, noop, QUEUEID}) {
		try {
			logger.log('debug', 'Unserializing record');
			const record = ConversionService.unserialize(data, format);

			logger.log('debug', `Reading record ${id} from datastore`);
			const existingRecord = await getRecord(id);

			logger.log('debug', 'Checking LOW-tag authorization');
			OwnAuthorization.validateChanges(user.authorization, record, existingRecord);

			logger.log('debug', 'Validating the record');
			const validationResults = await ValidationService.validate(record);

			if (noop) {
				return validationResults;
			}

			updateField001ToParamId(id, record);
			logger.log('debug', `Sending updating task for record ${id} to queue`);
			pushToQueue({queue: NAME_QUEUE_PRIORITY, user: user.id, QUEUEID, records: [record], operation: 'update'});
			// OLD await DatastoreService.update({id, record, cataloger: user.id});

			const messages = {};
			await new Promise((res, rej) => {
				EMITTER.on(QUEUEID, reply => {
					console.log(reply);
					messages.status = reply.status;
					messages.id = reply.metadata.ids[0];
					res();
				}).on('error', err => {
					rej(err);
				});
			});

			return messages;
		} catch (err) {
			if (err instanceof ConversionError) {
				throw new ServiceError(HttpStatus.BAD_REQUEST);
			} else if (err instanceof OwnAuthorizationError) {
				throw new ServiceError(HttpStatus.FORBIDDEN);
			} else if (err instanceof ValidationError) {
				throw new ServiceError(HttpStatus.UNPROCESSABLE_ENTITY, err.messages);
			}

			throw err;
		}
	}

	async function getRecord(id) {
		let record;
		await new Promise((resolve, reject) => {
			sruClient.searchRetrieve(`rec.id=${id}`)
				.on('record', xmlString => {
					record = MARCXML.from(xmlString);
				})
				.on('end', () => resolve())
				.on('error', err => reject(err));
		});

		return record;
	}

	function updateField001ToParamId(id, record) {
		const fields = record.get(/^001$/);

		if (fields.length === 0) {
			// Return to break out of function
			return record.insertField({tag: '001', value: toAlephId(id)});
		}

		fields.map(field => {
			field.value = toAlephId(id);
			return field;
		});
	}
}
