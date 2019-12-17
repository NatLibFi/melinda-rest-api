/* eslint-disable no-warning-comments, no-unused-vars */

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

import {Utils} from '@natlibfi/melinda-commons';
import {Router} from 'express';
import passport from 'passport';
import HttpStatus from 'http-status';
import ServiceError from '../services/error';
import {pushToQueue} from '../services/bib-bulk';
import {createWhitelistMiddleware, validateLine} from '../utils';
import fileUpload from 'express-fileupload';
import uuid from 'uuid';
import fs from 'fs';
import readline from 'readline';
import path from 'path';
import {once} from 'events';

import {
	IP_FILTER_BIB_BULK, TMP_FILE_LOCATION, CHUNK_SIZE, NAME_QUEUE_BULK
} from '../config';

const {createLogger} = Utils;
const logger = createLogger(); // eslint-disable-line no-unused-vars

export default async () => {
	const ipFilterList = JSON.parse(IP_FILTER_BIB_BULK).map(rule => new RegExp(rule));

	return new Router()
		.use(createWhitelistMiddleware(ipFilterList))
		.use(passport.authenticate('melinda', {session: false}))
		.post('/:operation', fileUpload({
			limits: {fileSize: 50 * 1024 * 1024},
			debug: true
		}), sendToQueue)
		.use((err, req, res, next) => {
			if (err instanceof ServiceError) {
				res.status(err.status).send(err.payload);
			} else {
				next(err);
			}
		});

	async function sendToQueue(req, res, next) {
		logger.log('debug', 'Bulk blob');
		let operation = req.params.operation;
		const QUEUEID = uuid.v1();

		if (operation !== undefined && operation.toLowerCase() !== 'update' && operation.toLowerCase() !== 'create') {
			return res.sendStatus(HttpStatus[400]);
		}

		if (!req.files) {
			return res.sendStatus(HttpStatus[422]);
		}

		try {
			logger.log('debug', 'Sending now!');
			let amount = 0;
			let index = 1;
			const records = [];
			let record = [];
			let currentRecordId = '';
			await req.files.file.mv(TMP_FILE_LOCATION + QUEUEID);

			const stream = fs.createReadStream(path.resolve('dist/tmp/' + QUEUEID));
			const rl = readline.createInterface({
				input: stream,
				crlfDelay: Infinity
			});

			rl.on('line', async line => {
				// Number of queues
				/* Queues are single-threaded in RabbitMQ, and one queue can handle up to about 50 thousand messages.
				You will achieve better throughput on a multi-core system if you have multiple queues
				and consumers and if you have as many queues as cores on the underlying node(s).

				The RabbitMQ management interface collects and calculates metrics for every queue in the cluster.
				This might slow down the server if you have thousands upon thousands of active queues and consumers.
				The CPU and RAM usage may also be affected negatively if you have too many queues.
				https://www.cloudamqp.com/blog/2017-12-29-part1-rabbitmq-best-practice.html */
				const validation = await validateLine(line, index, operation);
				// Check validation result logger.log('debug', JSON.stringify(validation));
				if (validation.valid) {
					if (currentRecordId === '') {
						currentRecordId = validation.id;
					}

					if (currentRecordId !== validation.id && record.length > 0) {
						records.push(record);
						record = [];
						if (records.length > CHUNK_SIZE) {
							const chunk = records.splice(0, CHUNK_SIZE);
							amount += chunk.length;
							await pushToQueue({queue: NAME_QUEUE_BULK, user: req.user, QUEUEID, format: 'alephseq', chunk, operation});
						}

						currentRecordId = validation.id;
					}

					record.push(line);
				}
			}).on('close', async () => {
				if (record.length > 0) {
					records.push(record);
					amount += records.length;
					await pushToQueue({queue: NAME_QUEUE_BULK, user: req.user, QUEUEID, format: 'alephseq', records, operation});
				}
			});

			await once(rl, 'close');

			// TODO => to queue
			const messages = {
				records: amount, tempfile: TMP_FILE_LOCATION, QID: QUEUEID
			};

			res.type('application/json').send(messages);
		} catch (err) {
			next(err);
		}
	}
};
