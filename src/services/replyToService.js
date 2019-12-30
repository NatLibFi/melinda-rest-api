import amqplib from 'amqplib';
import {Utils} from '@natlibfi/melinda-commons';
import {EventEmitter} from 'events';
import {AMQP_URL, NAME_QUEUE_REPLY_BULK, NAME_QUEUE_REPLY_PRIO, NAME_QUEUE_BULK} from '../config';
import {updateChunk} from './mongoService';

class ReplyEmitter extends EventEmitter {}
export const EMITTER = new ReplyEmitter();

const {createLogger} = Utils;
const logger = createLogger();

export async function checkReplyQueue() {
	await operateQueue();

	setTimeout(checkReplyQueue, 5000);
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
			await channel.purgeQueue(NAME_QUEUE_REPLY_PRIO);
			await channel.purgeQueue(NAME_QUEUE_REPLY_BULK);
		}

		channelInfo.prio = await channel.checkQueue(NAME_QUEUE_REPLY_PRIO);
		logger.log('debug', `${NAME_QUEUE_REPLY_PRIO} queue: ${channelInfo.prio.messageCount} chunks`);
		channelInfo.bulk = await channel.checkQueue(NAME_QUEUE_REPLY_BULK);
		logger.log('debug', `${NAME_QUEUE_REPLY_BULK} queue: ${channelInfo.bulk.messageCount} chunks`);

		let consumeQueue;
		if (channelInfo.prio.messageCount > 0) {
			consumeQueue = NAME_QUEUE_REPLY_PRIO;
		} else if (channelInfo.bulk.messageCount > 0) {
			consumeQueue = NAME_QUEUE_REPLY_BULK;
		}

		if (consumeQueue) {
			channel.prefetch(1); // Per consumer limit
			const queData = await channel.get(consumeQueue);
			if (queData) {
				const correlationId = queData.properties.correlationId;
				const content = JSON.parse(queData.content.toString());

				logger.log('debug', `Reading reply: ${correlationId}, ${JSON.stringify(content)}`);
				if (content.queue === NAME_QUEUE_BULK) {
					logger.log('debug', 'Bulk response');
				}

				// Notify possible listenres that their job is done!
				EMITTER.emit(correlationId, content);
				// Save response to db to be querried
				await updateChunk({id: correlationId, content});
				// Ack message when all done
				channel.ack(queData);
			}
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
