/* eslint-disable no-unused-vars, no-warning-comments */
import Mongoose from 'mongoose';
import {QueueBlobModel} from '../models';
import moment from 'moment';
import {Utils} from '@natlibfi/melinda-commons';
import {CHUNK_STATE} from '@natlibfi/melinda-record-import-commons';

Mongoose.model('QueueBlobModel', QueueBlobModel);
const {createLogger} = Utils;
const logger = createLogger();

export async function createQueueItem({id, user, operation, queue}) {
	await Mongoose.models.QueueBlobModel.create({id, user, operation, queue});
}

export async function addChunk({id, operation, user, chunkNumber, numberOfRecords}) {
	const chunkInfo = {
		modificationTime: moment(),
		$push: {
			queuedChunks: {
				chunkNumber: chunkNumber,
				numberOfRecords: numberOfRecords
			}
		}
	};

	// Updates Queue blob where id, operation and user match
	const {nModified} = await Mongoose.models.QueueBlobModel.updateOne({id, operation, user}, chunkInfo);

	if (nModified === 0) {
		throw new Error('409');
	}
}

export async function updateChunk({id, operation, user, content}) {
	const data = await Mongoose.models.QueueBlobModel.findOne({id, operation, user}).exec();
	const chunkIndex = data.queuedChunks.findIndex(checkChunkNumber);
	const marker = `queuedChunks.${chunkIndex}`;

	data.queuedChunks[chunkIndex].chunkState = content.status;
	if (content.status !== CHUNK_STATE.ERROR || content.metadata.failedRecords) {
		// Pick failed records from content
		data.queuedChunks[chunkIndex].failedRecords = content.metadata.failedRecords;
	}

	const update = {
		modificationTime: moment(),
		$set: {}
	};
	update.$set[marker] = data.queuedChunks[chunkIndex];
	const {nModified} = await Mongoose.models.QueueBlobModel.updateOne({id, operation, user}, update);
	logger.log('info', `${nModified} chunk/s received confirmation`);

	function checkChunkNumber(chunk) {
		return chunk.chunkNumber === content.chunkNumber;
	}
}

export async function queryBulk({user, id, operation, creationTime, modificationTime}) {
	const queryOpts = {
		limit: 100
	};

	const query = await generateQuery();
	console.log(query);
	const data = await Mongoose.models.QueueBlobModel.find(query, undefined, queryOpts);
	return data;

	async function generateQuery() {
		const doc = {};

		if (user) {
			doc.user = {$in: user};
		} else {
			return false;
		}

		if (id) {
			doc.id = {$in: id};
		}

		if (operation) {
			doc.operation = {$in: operation};
		}

		if (creationTime) {
			if (creationTime.length === 1) {
				doc.creationTime = formatTime(creationTime[0]);
			} else {
				doc.$and = [
					{creationTime: {$gte: formatTime(creationTime[0])}},
					{creationTime: {$lte: formatTime(creationTime[1])}}
				];
			}
		}

		if (modificationTime) {
			if (modificationTime.length === 1) {
				doc.modificationTime = formatTime(modificationTime[0]);
			} else {
				doc.$and = [
					{modificationTime: {$gte: formatTime(modificationTime[0])}},
					{modificationTime: {$lte: formatTime(modificationTime[1])}}
				];
			}
		}

		return doc;

		function formatTime(timestamp) {
			// Ditch the timezone
			const time = moment.utc(timestamp);
			return time.toDate();
		}
	}
}
