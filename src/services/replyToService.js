import amqplib from 'amqplib';
import {Utils} from '@natlibfi/melinda-commons';
import {EventEmitter} from 'events';
import {AMQP_URL} from '../config';
import {QUEUE_NAME_REPLY_BULK, QUEUE_NAME_REPLY_PRIO} from '@natlibfi/melinda-record-import-commons';

import {updateChunk} from './mongoService';

class ReplyEmitter extends EventEmitter {}
export const EMITTER = new ReplyEmitter();

const {createLogger} = Utils;
const logger = createLogger();

export async function checkReplyQueue() {
	const {prio, bulk} = await operateQueue();

	if (prio > 0) {
		await consumeQueue(QUEUE_NAME_REPLY_PRIO);
	} else if (bulk > 0) {
		await consumeQueue(QUEUE_NAME_REPLY_BULK);
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
			await channel.purgeQueue(QUEUE_NAME_REPLY_PRIO);
			await channel.purgeQueue(QUEUE_NAME_REPLY_BULK);
		}

		channelInfo.prio = await channel.checkQueue(QUEUE_NAME_REPLY_PRIO);
		logger.log('debug', `${QUEUE_NAME_REPLY_PRIO} queue: ${channelInfo.prio.messageCount} chunks`);
		channelInfo.bulk = await channel.checkQueue(QUEUE_NAME_REPLY_BULK);
		logger.log('debug', `${QUEUE_NAME_REPLY_BULK} queue: ${channelInfo.bulk.messageCount} chunks`);
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
			if (queue === QUEUE_NAME_REPLY_PRIO) {
				EMITTER.emit(correlationId, content);
			}

			// Save response to db to be querried
			// If error pass all records to failed records?
			await updateChunk({id: correlationId, content});

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
