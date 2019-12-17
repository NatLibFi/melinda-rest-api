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
import {AMQP_URL, NAME_QUEUE_REPLY} from '../config';
import {logError} from '../utils';

const {createLogger} = Utils;
const logger = createLogger(); // eslint-disable-line no-unused-vars

export async function pushToQueue({queue, user, QUEUEID, format, records, operation}) {
	// TODO send to queue!!
	let connection;
	let channel;

	// TODO: operation update -> Check OWN auth

	try {
		connection = await amqplib.connect(AMQP_URL);
		channel = await connection.createChannel();

		// Logger.log('debug', `Record queue ${queue}`);
		// logger.log('debug', `Record user.id ${user.id}`)
		// logger.log('debug', `Record QUEUEID ${QUEUEID}`);
		// logger.log('debug', `Record format ${format}`);
		// logger.log('debug', `Record records ${records}`);
		// logger.log('debug', `Record operation ${operation}`);

		const message = JSON.stringify({
			queue,
			cataloger: user.id,
			format,
			records,
			operation
		});
		// Logger.log('debug', `Record message ${message}`);

		await channel.sendToQueue(
			queue,
			Buffer.from(message),
			{
				persistent: true,
				correlationId: QUEUEID
			}
		);

		logger.log('debug', `${records.length} Record(s) has been sent in queue`);

		const reply = checkReply();

		await Promise.all([reply]);
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

	// Move to log server?
	function checkReply() {
		return new Promise((resolve, reject) => {
			let timeOut;
			try {
				logger.log('debug', `Checkking reply for ${QUEUEID}`);
				channel.consume(NAME_QUEUE_REPLY, reply => {
					if (reply.properties.correlationId === QUEUEID) {
						logger.log('info', reply.content.toString());
						// TODO Write to db to be requested?
						clearMyTimeOut(timeOut);
						channel.ack(reply);
						resolve(true);
					}
				});
				timeOut = setTimeout(checkReply, 3000);
			} catch (err) {
				clearMyTimeOut(timeOut);
				reject(err);
			}
		});

		function clearMyTimeOut(timeOut) {
			clearTimeout(timeOut);
		}
	}
}
