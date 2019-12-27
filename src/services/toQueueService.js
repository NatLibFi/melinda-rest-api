/* eslint-disable no-unused-vars, no-warning-comments */
import {Utils} from '@natlibfi/melinda-commons';
import amqplib from 'amqplib';
import {AMQP_URL} from '../config';
import {logError} from '../utils';

const {createLogger} = Utils;
const logger = createLogger(); // eslint-disable-line no-unused-vars

export async function pushToQueue({queue, user, QUEUEID, records, operation, blobNumber = 0}) {
	let connection;
	let channel;

	try {
		connection = await amqplib.connect(AMQP_URL);
		channel = await connection.createChannel();

		// Logger.log('debug', `Record queue ${queue}`);
		// logger.log('debug', `Record user ${user}`)
		// logger.log('debug', `Record QUEUEID ${QUEUEID}`);
		// logger.log('debug', `Record records ${records}`);
		// logger.log('debug', `Record operation ${operation}`);

		const message = JSON.stringify({
			cataloger: user,
			records,
			operation,
			blobNumber
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
		// TODO: (id: QUEUEID, user: catalogger_id, operation, queue, queuedBlobs: [blobnumber, failedRecords:[], numberOfRecords])
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
