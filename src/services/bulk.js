/* eslint-disable no-unused-vars, no-warning-comments */

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

/*
Queues are single-threaded in RabbitMQ, and one queue can handle up to about 50 thousand messages.
You will achieve better throughput on a multi-core system if you have multiple queues
and consumers and if you have as many queues as cores on the underlying node(s).

The RabbitMQ management interface collects and calculates metrics for every queue in the cluster.
This might slow down the server if you have thousands upon thousands of active queues and consumers.
The CPU and RAM usage may also be affected negatively if you have too many queues.
https://www.cloudamqp.com/blog/2017-12-29-part1-rabbitmq-best-practice.html
*/

// COMMON
import {Utils} from '@natlibfi/melinda-commons';
import {CHUNK_SIZE, IMPORT_QUEUES} from '@natlibfi/melinda-record-import-commons';
import {logError} from '../utils';
import {toAlephId} from '@natlibfi/melinda-commons/dist/utils';
import {pushToQueue} from './toQueueService';
import {createQueueItem, addChunk, queryBulk} from './mongoService';
import {Json, MARCXML, AlephSequential, ISO2709} from '@natlibfi/marc-record-serializers';

const {createLogger} = Utils;
const {BULK_CREATE, BULK_UPDATE} = IMPORT_QUEUES;

export default async function () {
	const logger = createLogger(); // eslint-disable-line no-unused-vars

	return {handleTransformation, doQuerry};

	async function handleTransformation(req, {type, operation, QUEUEID, cataloger}) {
		try {
			const records = [];
			const promises = [];
			const queue = (operation === 'create') ? BULK_CREATE : BULK_UPDATE;
			let reader;
			let chunkNumber = -1;

			// Check if Queue blob already exists id + operation + cataloger
			const dbData = await queryBulk({cataloger, id: QUEUEID, operation});
			if (dbData.length > 0) {
				chunkNumber = dbData[0].queuedChunks.length - 1;
			} else {
				createQueueItem({id: QUEUEID, cataloger, operation, queue});
			}

			// TODO: FIX initialize reader here
			if (type === 'application/alephseq') {
				reader = new AlephSequential.Reader(req);
			}

			if (type === 'application/json') {
				reader = new Json.Reader(req);
			}

			if (type === 'application/xml') {
				reader = new MARCXML.Reader(req);
			}

			if (type === 'application/marc') {
				reader = new ISO2709.Reader(req);
			}

			await new Promise((res, rej) => {
				reader.on('data', record => {
					promises.push(transform(record));
					async function transform(value) {
						// TODO Validation
						// TODO: operation update -> Check OWN auth
						// Operation Create -> f001 new value
						if (operation.toLowerCase() === 'create') {
							// Field 001 value -> 000000000, 000000001, 000000002....
							updateField001ToParamId(`${records.length + 1}`, value);
						}

						records.push(value.toObject());
						if (records.length >= CHUNK_SIZE) {
							chunkNumber++;
							const chunk = records.splice(0, CHUNK_SIZE);
							logger.log('debug', 'chunk pushed');
							pushToQueue({queue, cataloger, QUEUEID, records: chunk, operation, chunkNumber});
							await addChunk({id: QUEUEID, operation, cataloger, chunkNumber, numberOfRecords: chunk.length});
						}
					}
				}).on('end', async () => {
					logger.log('debug', `Readed ${promises.length} records from stream`);
					await Promise.all(promises);
					logger.log('info', 'Request handling done!');
					if (records !== undefined && records.length > 0) {
						chunkNumber++;
						pushToQueue({queue, cataloger, QUEUEID, records, operation, chunkNumber});
						addChunk({id: QUEUEID, operation, cataloger, chunkNumber, numberOfRecords: records.length});
					}

					res();
				}).on('error', err => {
					logError(err);
					rej(err);
				});
			});
		} catch (err) {
			logError(err);
			throw err;
		}
	}

	async function doQuerry({cataloger, query}) {
		// Query filters cataloger, id, operation, creationTime, modificationTime
		const params = {
			cataloger
		};
		if (query.id) {
			params.id = query.id;
		}

		if (query.operation) {
			params.operation = query.operation;
		}

		if (query.creationTime) {
			params.creationTime = query.creationTime;
		}

		if (query.modificationTime) {
			params.modificationTime = query.modificationTime;
		}

		logger.log('debug', `Queue blobs querried: ${params}`);
		return queryBulk(params);
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