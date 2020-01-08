import amqplib from 'amqplib';
import {Utils} from '@natlibfi/melinda-commons';
import {EventEmitter} from 'events';
import {AMQP_URL} from '../config';
import {IMPORT_QUEUES} from '@natlibfi/melinda-record-import-commons';

import {updateChunk} from './mongoService';

class ReplyEmitter extends EventEmitter {}
export const EMITTER = new ReplyEmitter();

const {createLogger} = Utils;
const logger = createLogger();
const {PRIO_REPLY, BULK_REPLY} = IMPORT_QUEUES;

export async function checkReplyQueue() {
	const {prio, bulk} = await operateQueue();

	if (prio > 0) {
		await consumeQueue(PRIO_REPLY);
	} else if (bulk > 0) {
		await consumeQueue(BULK_REPLY);
	} else {
		setTimeout(checkReplyQueue, 1000);
	}
}

async function operateQueue() {
	let connection;
	let channel;
	const channelInfo = {};
	const purge = false;

	try {
		connection = await amqplib.connect(AMQP_URL);
		channel = await connection.createChannel();

		if (purge) {
			await channel.purgeQueue(PRIO_REPLY);
			await channel.purgeQueue(BULK_REPLY);
		}

		channelInfo.prio = await channel.checkQueue(PRIO_REPLY);
		logger.log('debug', `${PRIO_REPLY} queue: ${channelInfo.prio.messageCount} chunks`);
		channelInfo.bulk = await channel.checkQueue(BULK_REPLY);
		logger.log('debug', `${BULK_REPLY} queue: ${channelInfo.bulk.messageCount} chunks`);
	} catch (err) {
		checkReplyQueue();
		throw err;
	} finally {
		if (channel) {
			await channel.close();
		}

		if (connection) {
			await connection.close();
		}
	}

	return {prio: channelInfo.prio.messageCount, bulk: channelInfo.bulk.messageCount};
}

async function consumeQueue(queue) {
	let connection;
	let channel;
	try {
		connection = await amqplib.connect(AMQP_URL);
		channel = await connection.createChannel();

		channel.prefetch(1); // Per consumer limit
		const queData = await channel.get(queue);
		if (queData) {
			const correlationId = queData.properties.correlationId;
			const content = JSON.parse(queData.content.toString());

			logger.log('debug', `Reading reply: ${correlationId}, ${JSON.stringify(content)}`);
			// Notify possible listenres that their job is done!
			if (queue === PRIO_REPLY) {
				EMITTER.emit(correlationId, content);
			}

			// Save response to db to be querried
			// If error pass all records to failed records?
			await updateChunk({id: correlationId, operation: content.operation, cataloger: content.cataloger, content});

			// Ack message when all done
			channel.ack(queData);
			checkReplyQueue();
		} else {
			throw new Error(`Error while consuming data from queue ${queue}`);
		}
	} catch (err) {
		checkReplyQueue();
		throw err;
	} finally {
		if (channel) {
			await channel.close();
		}

		if (connection) {
			await connection.close();
		}
	}
}
