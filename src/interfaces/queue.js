/* eslint-disable no-unused-vars, no-warning-comments */
import {Utils} from '@natlibfi/melinda-commons';
import {PRIO_IMPORT_QUEUES} from '@natlibfi/melinda-record-import-commons';
import amqplib from 'amqplib';
import {AMQP_URL} from '../config';
import {logError} from '../utils';

const {createLogger} = Utils;
const {REQUESTS} = PRIO_IMPORT_QUEUES;
const logger = createLogger(); // eslint-disable-line no-unused-vars

/*
Queues are single-threaded in RabbitMQ, and one queue can handle up to about 50 thousand messages.
You will achieve better throughput on a multi-core system if you have multiple queues
and consumers and if you have as many queues as cores on the underlying node(s).

The RabbitMQ management interface collects and calculates metrics for every queue in the cluster.
This might slow down the server if you have thousands upon thousands of active queues and consumers.
The CPU and RAM usage may also be affected negatively if you have too many queues.
https://www.cloudamqp.com/blog/2017-12-29-part1-rabbitmq-best-practice.html
*/

export async function pushToQueue({headers, correlationId, data}) {
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
				correlationId
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
