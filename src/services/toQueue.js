/* eslint-disable no-unused-vars, no-warning-comments */
import {Utils} from '@natlibfi/melinda-commons';
import {PRIO_IMPORT_QUEUES} from '@natlibfi/melinda-record-import-commons';
import amqplib from 'amqplib';
import {AMQP_URL} from '../config';
import {logError} from '../utils';

const {createLogger} = Utils;
const {REQUESTS} = PRIO_IMPORT_QUEUES;
const logger = createLogger(); // eslint-disable-line no-unused-vars

export async function pushToQueue({headers, qid, data}) {
	let connection;
	let channel;

	try {
		connection = await amqplib.connect(AMQP_URL);
		channel = await connection.createChannel();
		await channel.assertQueue(REQUESTS, {durable: true});
		// Debug
		// logger.log('debug', `Record headers ${headers}`)
		// logger.log('debug', `Record qid ${qid}`);
		// logger.log('debug', `Record record ${record}`);

		const message = JSON.stringify({data});

		await channel.sendToQueue(
			REQUESTS,
			Buffer.from(message),
			{
				persistent: true,
				headers,
				correlationId: qid
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
