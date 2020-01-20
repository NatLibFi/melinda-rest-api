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

import {MARCXML} from '@natlibfi/marc-record-serializers';
import ServiceError, {Utils} from '@natlibfi/melinda-commons';
import createSruClient from '@natlibfi/sru-client';
import HttpStatus from 'http-status';
import createConversionService, {ConversionError} from './conversion';
import {pushToQueue} from './toQueue';
import {SRU_URL_BIB} from '../config';
import {EMITTER} from '../interfaces/reply';

const {createLogger} = Utils;

export default async function () {
	const logger = createLogger();
	const ConversionService = createConversionService();
	const sruClient = createSruClient({serverUrl: SRU_URL_BIB, version: '2.0', maximumRecords: '1'});

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

	async function create({data, format, cataloger, noop, unique, correlationId}) {
		try {
			logger.log('debug', 'Sending a new record to queue');
			const headers = {
				operation: 'create',
				format,
				cataloger,
				noop,
				unique
			};

			pushToQueue({headers, correlationId, data});

			const messages = {};
			await new Promise((res, rej) => {
				EMITTER.on(correlationId, reply => {
					logger.log('debug', `Priority data: ${JSON.stringify(reply)}`);
					messages.status = reply.status;

					if (reply.metadata.ids) {
						messages.id = reply.metadata.ids[0];
					}

					if (reply.metadata.failedRecords) {
						rej(new ServiceError(HttpStatus.UNPROCESSABLE_ENTITY, reply.metadata.failedRecords));
					}

					res();
				}).on('error', err => {
					if (err.id === correlationId) {
						rej(err.error);
					}
				});
			});

			return messages;
		} catch (err) {
			if (err instanceof ConversionError) {
				throw new ServiceError(HttpStatus.BAD_REQUEST);
			} else if (err.status === 403) {
				throw new ServiceError(HttpStatus.FORBIDDEN);
			}

			throw err;
		}
	}

	async function update({id, data, format, cataloger, noop, correlationId}) {
		// TODO: Move validation to validator
		try {
			logger.log('debug', `Sending updating task for record ${id} to queue`);
			const headers = {
				operation: 'update',
				id,
				format,
				cataloger,
				noop
			};

			pushToQueue({headers, correlationId, data});

			const messages = {};
			logger.log('debug', `weiting response to id: ${correlationId}`);
			await new Promise((res, rej) => {
				EMITTER.on(correlationId, reply => {
					logger.log('debug', `Priority data: ${JSON.stringify(reply)}`);
					messages.id = reply.data;

					res();
				}).on('error', err => {
					rej(err);
				});
			});

			return messages;
		} catch (err) {
			if (err instanceof ConversionError) {
				throw new ServiceError(HttpStatus.BAD_REQUEST);
			} else if (err.status === 403) {
				throw new ServiceError(HttpStatus.FORBIDDEN);
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
}
