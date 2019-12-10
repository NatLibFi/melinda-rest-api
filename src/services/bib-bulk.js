/* eslint-disable no-warning-comments */

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
import amqplib from 'amqplib';
import {AMQP_URL} from '../config';
import {logError} from '../utils';

const {createLogger} = Utils;
const logger = createLogger();

export async function pushToQueue({queue, QUEUEID, format, records, operation}) {
	// TODO send to queue!!
	let connection;
	let channel;

	try {
		connection = await amqplib.connect(AMQP_URL);
		channel = await connection.createChannel();

		// Logger.log('debug', `Record queue ${queue}`);
		// logger.log('debug', `Record QUEUEID ${QUEUEID}`);
		// logger.log('debug', `Record format ${format}`);
		// logger.log('debug', `Record records ${records}`);
		// logger.log('debug', `Record operation ${operation}`);

		records.forEach(async record => {
			const message = JSON.stringify({
				queue,
				QUEUEID,
				format,
				record,
				operation
			});

			// Logger.log('debug', `Record message ${message}`);

			await channel.sendToQueue(
				queue,
				Buffer.from(message),
				{persistent: true}
			);
		});

		logger.log('debug', 'Records has been set in queue');
	} catch (err) {
		logError(err);
	} finally {
		if (channel) {
			await channel.close();
		}

		if (connection) {
			await connection.close();
		}
	}
}
