import amqplib from 'amqplib';
import {Utils} from '@natlibfi/melinda-commons';
import {EventEmitter} from 'events';
import {AMQP_URL} from '../config';
import {PRIO_IMPORT_QUEUES} from '@natlibfi/melinda-record-import-commons';

class ReplyEmitter extends EventEmitter {}
export const EMITTER = new ReplyEmitter();

const {createLogger} = Utils;

export default async function () {
	const {REPLY} = PRIO_IMPORT_QUEUES;
	const logger = createLogger();
	const connection = await amqplib.connect(AMQP_URL);
	const channel = await connection.createChannel();

	return {checkQueue};

	async function checkQueue(init = false, purge = false) {
		try {
			if (init) {
				await channel.assertQueue(REPLY, {durable: true, autoDelete: false});
			}

			if (purge) {
				await channel.purgeQueue(REPLY);
			}

			const channelInfo = await channel.checkQueue(REPLY);
			logger.log('debug', `${REPLY} queue: ${channelInfo.messageCount} messages`);
			if (channelInfo.messageCount < 1) {
				return setTimeout(checkQueue, 1000);
			}

			consume();
		} catch (err) {
			checkQueue(true);
			throw err;
		}
	}

	async function consume() {
		try {
			const queData = await channel.get(REPLY);

			if (queData) {
				const correlationId = queData.properties.correlationId;
				const content = JSON.parse(queData.content.toString());

				logger.log('debug', `Reading reply: ${correlationId}, ${JSON.stringify(content)}`);

				// Notify possible listenres that their job is done!
				EMITTER.emit(correlationId, content);

				// Ack message when all done
				channel.ack(queData);
			}

			checkQueue();
		} catch (err) {
			checkQueue(true);
			throw err;
		}
	}
}
