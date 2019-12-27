import {Schema} from 'mongoose';
import {BLOB_STATE} from './config';

// Add info about queued records to DB. (id: QUEUEID, user: catalogger_id, operation, queue, queuedBlobs: [blobnumber, failedRecords:[], numberOfRecords])
/*
    id: '69e48940-255e-11ea-bc71-c7315e8119b9', // QUEUEID
    user: 'KVP3032', // Catalogger_id
    operation: 'update', // Update / create
    queue: 'BULK',
    creationTime: 2019-10-23T04:17:18.000+03:00,
    modificationTime: 2019-10-23T04:17:18.000+03:00,
    queuedBlobs: [{
		blobNumber: 1,
		failedRecords: [],
		numberOfRecords: 50,
        }]
	}
};
*/

export const QueueBlobModel = new Schema({
	id: {type: String, required: true, unique: true},
	user: {type: String, required: true},
	operation: {type: String, required: true},
	queue: {type: String, required: true},
	creationTime: {type: Date, default: Date.now},
	modificationTime: {type: Date, default: Date.now},
	queuedBlobs: [new Schema({
		type: Object,
		blobNumber: {type: Number},
		failedRecords: [],
		numberOfRecords: {type: Number},
		blobState: {
			type: String,
			required: true,
			enum: Object.values(BLOB_STATE),
			default: BLOB_STATE.IN_QUEUE
		}
	}, {_id: false})]
}, {strict: 'throw'});
