import {Schema} from 'mongoose';
import {CHUNK_STATE} from '@natlibfi/melinda-record-import-commons';

/* Example:
{
    id: '69e48940-255e-11ea-bc71-c7315e8119b9', // QUEUEID
    creationTime: 2019-10-23T04:17:18.000+03:00,
    modificationTime: 2019-10-23T04:17:18.000+03:00,
    operation: 'update', // Update || create
    queue: 'BULK',
    cataloger: 'XXX0000', // Catalogger_id
    queuedChunks: [{
		chunkNumber: 1,
		chunkState: 'IN_QUEUE'
		failedRecords: [],
		numberOfRecords: 50
        }]
	}
};
*/

export const QueueBlobModel = new Schema({
	id: {type: String, required: true},
	creationTime: {type: Date, default: Date.now},
	modificationTime: {type: Date, default: Date.now},
	operation: {type: String, required: true},
	queue: {type: String, required: true},
	cataloger: {type: String, required: true},
	queuedChunks: [new Schema({
		type: Object,
		chunkNumber: {type: Number},
		chunkState: {
			type: String,
			required: true,
			enum: Object.values(CHUNK_STATE),
			default: CHUNK_STATE.IN_QUEUE
		},
		failedRecords: [],
		numberOfRecords: {type: Number}
	}, {_id: false})]
}, {strict: 'throw'});
