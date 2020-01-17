/* eslint-disable no-unused-vars, no-warning-comments */

/* QueueItem:
	{
		"id":"test",
		"cataloger":"xxx0000",
		"operation":"update",
		"contentType":"application/json",
		"queueItemState":"PENDING_QUEUING",
		"creationTime":"2020-01-01T00:00:00.000Z",
		"modificationTime":"2020-01-01T00:00:01.000Z"
	}
*/

import {MongoClient, GridFSBucket, ObjectId} from 'mongodb';
import moment from 'moment';
import DatabaseError, {Utils} from '@natlibfi/melinda-commons';
import {QUEUE_ITEM_STATE} from '@natlibfi/melinda-record-import-commons/dist/constants';
import {MONGO_URI} from '../config';

const {createLogger} = Utils;

export default async function () {
	const logger = createLogger();
	const client = await MongoClient.connect(MONGO_URI, {useNewUrlParser: true});
	const db = client.db('rest-api');

	return {create, setState, query, remove, readContent, removeContent};

	async function create({id, cataloger, operation, contentType, stream}) {
		// Create QueueItem
		const newQueueItem = {
			id,
			cataloger,
			operation,
			contentType,
			queueItemState: QUEUE_ITEM_STATE.UPLOADING,
			creationTime: moment().toDate(),
			modificationTime: moment().toDate()
		};

		db.collection('queue-items').insertOne(newQueueItem, (err, res) => {
			if (err) {
				throw err;
			}

			console.log('queue-item created');
		});

		const gridFSBucket = new GridFSBucket(db, {bucketName: 'queueItems'});

		return new Promise((resolve, reject) => {
			const outputStream = gridFSBucket.openUploadStream(id);

			stream
				.on('error', reject)
				.on('data', chunk => outputStream.write(chunk))
				.on('end', () => outputStream.end(undefined, undefined, () => {
					resolve(id);
				}));
		});
	}

	async function setState(params) {
		await db.collection('queue-items').updateOne({
			cataloger: params.cataloger,
			id: params.id,
			operation: params.operation
		}, {$set: {
			queueItemState: params.state,
			modificationTime: moment().toDate()
		}});
		return db.collection('queue-items').findOne({
			cataloger: params.cataloger,
			id: params.id,
			operation: params.operation
		}, {projection: {_id: 0}});
	}

	async function query(params) {
		const result = await db.collection('queue-items').find(params, {projection: {_id: 0}}).toArray();
		console.log(result);
		return result;
	}

	async function remove(params) {
		const gridFSBucket = new GridFSBucket(db, {bucketName: 'queueItems'});

		try {
			await getFileMetadata({gridFSBucket, filename: params.id});
			throw new DatabaseError(400);
		} catch (err) {
			if (!(err instanceof DatabaseError && err.status === 404)) {
				throw err;
			}
		}

		await db.collection('queue-items').deleteOne(params);
		return true;
	}

	async function readContent(params) {
		const result = await db.collection('queue-items').findOne(params);
		// Check if the file exists

		if (result) {
			const gridFSBucket = new GridFSBucket(db, {bucketName: 'queueItems'});
			await getFileMetadata({gridFSBucket, filename: params.id});
			console.log(result);
			return {
				contentType: result.contentType,
				readStream: gridFSBucket.openDownloadStreamByName(params.id)
			};
		}

		throw new DatabaseError(404);
	}

	async function removeContent(params) {
		const result = await db.collection('queue-items').findOne(params);
		if (result) {
			const gridFSBucket = new GridFSBucket(db, {bucketName: 'queueItems'});
			const {_id: fileId} = await getFileMetadata({gridFSBucket, filename: params.id});
			console.log(fileId);
			await gridFSBucket.delete(fileId);
			return true;
		}
	}

	async function getFileMetadata({gridFSBucket, filename}) {
		return new Promise((resolve, reject) => {
			gridFSBucket.find({filename})
				.on('error', reject)
				.on('data', resolve)
				.on('end', () => reject(new DatabaseError(404)));
		});
	}

	/* To validator
	async function addChunk({id, operation, cataloger, chunkNumber, numberOfRecords}) {
		const updateInfo = {
			modificationTime: moment(),
			$push: {
				queuedChunks: {
					chunkNumber: chunkNumber,
					numberOfRecords: numberOfRecords
				}
			}
		};

		// Updates Queue blob where id, operation and cataloger match
		const {nModified} = await Mongoose.models.QueueItemModel.updateOne({id, operation, cataloger}, updateInfo);

		if (nModified === 0) {
			throw new DatabaseError(409);
		}
	}

	async function updateChunk({id, chunkNumber, operation, cataloger, content}) {
		const data = await Mongoose.models.QueueItemModel.findOne({id, operation, cataloger}).exec();
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
		const {nModified} = await Mongoose.models.QueueItemModel.updateOne({id, operation, cataloger}, update);
		logger.log('info', `${nModified} chunk/s received confirmation`);

		function checkChunkNumber(chunk) {
			return chunk.chunkNumber === chunkNumber;
		}
	}
	*/
}
