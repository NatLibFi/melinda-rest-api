import amqplib from 'amqplib';
import {Utils} from '@natlibfi/melinda-commons';
import {EventEmitter} from 'events';
import {NAME_QUEUE_REPLY, AMQP_URL, NAME_QUEUE_BULK} from '../config';
import {updateBlob} from './mongoService';
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
	let replyQueueCount;

	try {
		connection = await amqplib.connect(AMQP_URL);
		channel = await connection.createChannel();

		const replyChannel = await channel.checkQueue(NAME_QUEUE_REPLY);
		replyQueueCount = replyChannel.messageCount;
		logger.log('debug', `${NAME_QUEUE_REPLY} queue: ${replyQueueCount} blobs`);

		if (replyQueueCount > 0) {
			channel.prefetch(1); // Per consumer limit
			const queData = await channel.get(NAME_QUEUE_REPLY);
			if (queData) {
				const correlationId = queData.properties.correlationId;
				const content = JSON.parse(queData.content.toString());

				// Notify possible listenres that their job is done!
				logger.log('debug', `Reading reply: ${correlationId}, ${content}`);
				if (content.queue === NAME_QUEUE_BULK) {
					// Save response to db to be querried;
					logger.log('debug', 'Bulk response');
				}

				updateBlob({id: correlationId, content});
				EMITTER.emit(correlationId, content);
				channel.ack(queData); // TODO: dont ack before data is saved
			}
		}
	} catch (err) {
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
