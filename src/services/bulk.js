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
import ServiceError, {Utils} from '@natlibfi/melinda-commons';
import moment from 'moment';
import {logError} from '../utils';
import {mongoFactory} from '../interfaces';
import {QUEUE_ITEM_STATE} from '@natlibfi/melinda-record-import-commons/dist/constants';

const {createLogger} = Utils;

export default async function () {
	const logger = createLogger(); // eslint-disable-line no-unused-vars
	const mongoOperator = await mongoFactory();

	return {create, doQuerry, readContent, remove, removeContent};

	async function create(req, {correlationId, cataloger, operation, contentType}) {
		try {
			await mongoOperator.create({correlationId, cataloger, operation, contentType, stream: req});
			console.log('Stream uploaded!');
			return mongoOperator.setState({correlationId, cataloger, operation, state: QUEUE_ITEM_STATE.PENDING_QUEUING});
		} catch (error) {
			logError(error);
		}
	}

	async function readContent({cataloger, correlationId}) {
		if (correlationId) {
			return mongoOperator.readContent({cataloger, correlationId});
		}

		throw new ServiceError(400);
	}

	async function remove({cataloger, correlationId}) {
		if (correlationId) {
			return mongoOperator.remove({cataloger, correlationId});
		}

		throw new ServiceError(400);
	}

	async function removeContent({cataloger, correlationId}) {
		if (correlationId) {
			return mongoOperator.removeContent({cataloger, correlationId});
		}

		throw new ServiceError(400);
	}

	async function doQuerry({cataloger, query}) {
		// Query filters cataloger, correlationId, operation, creationTime, modificationTime
		const params = await generateQuery();

		logger.log('debug', `Queue blobs querried: ${params}`);

		if (params) {
			return mongoOperator.query(params);
		}

		throw new ServiceError(400);

		async function generateQuery() {
			const doc = {};

			if (cataloger) {
				doc.cataloger = cataloger;
			} else {
				return false;
			}

			if (query.id) {
				doc.correlationId = query.id;
			}

			if (query.operation) {
				doc.operation = query.operation;
			}

			if (query.creationTime) {
				if (query.creationTime.length === 1) {
					doc.creationTime = formatTime(query.creationTime[0]);
				} else {
					doc.$and = [
						{creationTime: {$gte: formatTime(query.creationTime[0])}},
						{creationTime: {$lte: formatTime(query.creationTime[1])}}
					];
				}
			}

			if (query.modificationTime) {
				if (query.modificationTime.length === 1) {
					doc.modificationTime = formatTime(query.modificationTime[0]);
				} else {
					doc.$and = [
						{modificationTime: {$gte: formatTime(query.modificationTime[0])}},
						{modificationTime: {$lte: formatTime(query.modificationTime[1])}}
					];
				}
			}

			return doc;
		}

		function formatTime(timestamp) {
			// Ditch the timezone
			const time = moment.utc(timestamp);
			return time.toDate();
		}
	}
}
