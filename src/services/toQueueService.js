/* eslint-disable no-unused-vars, no-warning-comments */
import {Utils} from '@natlibfi/melinda-commons';
import amqplib from 'amqplib';
import {AMQP_URL} from '../config';
import {logError} from '../utils';

const {createLogger} = Utils;
const logger = createLogger(); // eslint-disable-line no-unused-vars

export async function pushToQueue({queue, cataloger, QUEUEID, records, operation, chunkNumber = 0}) {
	let connection;
	let channel;

	try {
		connection = await amqplib.connect(AMQP_URL);
		channel = await connection.createChannel();

		// Logger.log('debug', `Record queue ${queue}`);
		// logger.log('debug', `Record cataloger ${cataloger}`)
		// logger.log('debug', `Record QUEUEID ${QUEUEID}`);
		// logger.log('debug', `Record records ${records}`);
		// logger.log('debug', `Record operation ${operation}`);

		const message = JSON.stringify({
			cataloger,
			records,
			operation,
			chunkNumber
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
