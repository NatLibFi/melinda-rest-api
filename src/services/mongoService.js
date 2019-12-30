/* eslint-disable no-unused-vars, no-warning-comments */
import Mongoose from 'mongoose';
import {QueueBlobModel} from '../models';
import moment from 'moment';
import {Utils} from '@natlibfi/melinda-commons';
import {BLOB_STATE} from '../config';

Mongoose.model('QueueBlobModel', QueueBlobModel);
const {createLogger} = Utils;
const logger = createLogger();

export async function createQueueItem({id, user, operation, queue}) {
	await Mongoose.models.QueueBlobModel.create({id, user, operation, queue});
}

export async function addBlob({id, blobNumber, numberOfRecords}) {
	const blobInfo = {
		modificationTime: moment(),
		$push: {
			queuedBlobs: {
				blobNumber: blobNumber,
				numberOfRecords: numberOfRecords
			}
		}
	};
	const {nModified} = await Mongoose.models.QueueBlobModel.updateOne({id}, blobInfo);

	if (nModified === 0) {
		throw new Error('409');
	}
}

export async function updateBlob({id, content}) {
	const data = await Mongoose.models.QueueBlobModel.findOne({id}).exec();
	const blobIndex = data.queuedBlobs.findIndex(checkBlobNumber);
	const marker = `queuedBlobs.${blobIndex}`;

	// Pick failed records from content
	data.queuedBlobs[blobIndex].failedRecords = content.metadata.failedRecords;
	data.queuedBlobs[blobIndex].blobState = content.status;
	const update = {
		modificationTime: moment(),
		$set: {}
	};
	update.$set[marker] = data.queuedBlobs[blobIndex];
	const {nModified} = Mongoose.models.QueueBlobModel.updateOne({id}, update);
	logger.log('info', `${nModified} blob/s received confirmation`);

	function checkBlobNumber(blob) {
		return blob.blobNumber === content.blobNumber;
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
