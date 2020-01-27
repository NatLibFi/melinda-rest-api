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
import {promisify} from 'util';
import ApiError, {Utils} from '@natlibfi/melinda-commons';
import {amqpFactory, conversion} from '@natlibfi/melinda-rest-api-commons';
import {MARCXML} from '@natlibfi/marc-record-serializers';
import createSruClient from '@natlibfi/sru-client';
import {SRU_URL_BIB, AMQP_URL, POLL_WAIT_TIME} from '../config';

const setTimeoutPromise = promisify(setTimeout);
const {createLogger} = Utils;

export default async function () {
	const logger = createLogger();
	const amqpOperator = await amqpFactory(AMQP_URL);
	const sruClient = createSruClient({serverUrl: SRU_URL_BIB, version: '2.0', maximumRecords: '1'});

	return {read, create, update};

	async function read({id, format}) {
		try {
			logger.log('debug', `Reading record ${id} from datastore`);
			const record = await getRecord(id);

			logger.log('debug', `Serializing record ${id}`);
			return conversion.serialize(record, format);
		} catch (err) {
			throw err;
		}
	}

	async function create({data, format, cataloger, noop, unique, correlationId}) {
		try {
			logger.log('debug', 'Sending a new record to queue');
			const headers = {
				operation: 'CREATE',
				format,
				cataloger,
				noop,
				unique
			};

			// {queue, correlationId, headers, data}
			await amqpOperator.sendToQueue({queue: 'REQUESTS', correlationId, headers, data});

			logger.log('debug', `Waiting response to id: ${correlationId}`);
			const response = await check(correlationId);
			const responseData = response.content.data;

			logger.log('debug', `Got response to id: ${correlationId}`);
			logger.log('debug', `Priority data: ${JSON.stringify(responseData)}`);

			// Ack message
			amqpOperator.ackMessages([response]);
			amqpOperator.removeQueue(correlationId);

			if (responseData.status !== 'CREATED') {
				throw new ApiError(responseData.status, response.payload || '');
			}

			// Reply to http
			return responseData;
		} catch (err) {
			if (err.status === 400) {
				throw new ApiError(HttpStatus.BAD_REQUEST);
			} else if (err.status === 403) {
				throw new ApiError(HttpStatus.FORBIDDEN);
			}

			throw err;
		}
	}

	async function update({id, data, format, cataloger, noop, correlationId}) {
		try {
			logger.log('debug', `Sending updating task for record ${id} to queue`);
			const headers = {
				operation: 'UPDATE',
				id,
				format,
				cataloger,
				noop
			};

			// {queue, correlationId, headers, data}
			await amqpOperator.sendToQueue({queue: 'REQUESTS', correlationId, headers, data});

			logger.log('debug', `Waiting response to id: ${correlationId}`);
			const response = await check(correlationId);
			const responseData = response.content.data;
			logger.log('debug', `Got response to id: ${correlationId}`);
			logger.log('debug', `Response data: ${JSON.stringify(responseData)}`);

			// Ack message
			await amqpOperator.ackMessages([response]);
			await amqpOperator.removeQueue(correlationId);

			if (responseData.status !== 'UPDATED') {
				throw new ApiError(responseData.status, response.payload || '');
			}

			// Reply to http
			return responseData;
		} catch (err) {
			if (err.status === 400) {
				throw new ApiError(HttpStatus.BAD_REQUEST);
			} else if (err.status === 403) {
				throw new ApiError(HttpStatus.FORBIDDEN);
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

	async function check(queue) {
		// Check queue
		const result = await amqpOperator.checkQueue(queue, 'raw', false);

		if (result) {
			// Work with results
			result.content = JSON.parse(result.content.toString());
			return result;
		}

		// Nothing in queue
		await setTimeoutPromise(POLL_WAIT_TIME);
		return check(queue);
	}
}
