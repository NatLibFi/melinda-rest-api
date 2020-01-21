/* eslint-disable no-unused-vars, no-warning-comments */

/* QueueItem:
	{
		"correlationId":"test",
		"cataloger":"xxx0000",
		"operation":"update",
		"contentType":"application/json",
		"queueItemState":"PENDING_QUEUING",
		"creationTime":"2020-01-01T00:00:00.000Z",
		"modificationTime":"2020-01-01T00:00:01.000Z"
	}
*/

import {MongoClient, GridFSBucket} from 'mongodb';
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

	async function create({correlationId, cataloger, operation, contentType, recordLoadQueryParams, stream}) {
		// Create QueueItem
		const newQueueItem = {
			correlationId,
			cataloger,
			operation,
			contentType,
			recordLoadQueryParams,
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
			const outputStream = gridFSBucket.openUploadStream(correlationId);

			stream
				.on('error', reject)
				.on('data', chunk => outputStream.write(chunk))
				.on('end', () => outputStream.end(undefined, undefined, () => {
					resolve(correlationId);
				}));
		});
	}

	async function setState(params) {
		await db.collection('queue-items').updateOne({
			cataloger: params.cataloger,
			correlationId: params.correlationId,
			operation: params.operation
		}, {$set: {
			queueItemState: params.state,
			modificationTime: moment().toDate()
		}});
		return db.collection('queue-items').findOne({
			cataloger: params.cataloger,
			correlationId: params.correlationId,
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
			await getFileMetadata({gridFSBucket, filename: params.correlationId});
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
			await getFileMetadata({gridFSBucket, filename: params.correlationId});
			console.log(result);
			return {
				contentType: result.contentType,
				readStream: gridFSBucket.openDownloadStreamByName(params.correlationId)
			};
		}

		throw new DatabaseError(404);
	}

	async function removeContent(params) {
		const result = await db.collection('queue-items').findOne(params);
		if (result) {
			const gridFSBucket = new GridFSBucket(db, {bucketName: 'queueItems'});
			const {_id: fileId} = await getFileMetadata({gridFSBucket, filename: params.correlationId});
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
}
