/* eslint-disable import/prefer-default-export */
import MarcRecordSerializers from 'marc-record-serializers';
import MarcRecord from 'marc-record-js';

export function convertRecord(input, to, from) {
	const record = recordFrom(input, from);

	return recordTo(record, to);
}

export function recordFrom(record, from) {
	switch (from) {
		case 'marcxml':
			return MarcRecordSerializers.MARCXML.fromMARCXML(record);

		case 'oai_marcmxl':
			return MarcRecordSerializers.OAI_MARCXML.fromOAI_MARCXML(record);

		case 'alephsequential':
			return MarcRecordSerializers.AlephSequential.fromAlephSequential(record);

		case 'iso2709':
			return MarcRecordSerializers.ISO2709.fromISO2709(record);

		case 'json':
			return new MarcRecord(record);

		default:
			throw new Error('Unknown record format');
	}
}

export function recordTo(record, to) {
	switch (to) {
		case 'marcxml':
			return MarcRecordSerializers.MARCXML.toMARCXML(record);

		case 'oai_marcmxl':
			return MarcRecordSerializers.OAI_MARCXML.toOAI_MARCXML(record);

		case 'alephsequential':
			return MarcRecordSerializers.AlephSequential.toAlephSequential(record);

		case 'iso2709':
			return MarcRecordSerializers.ISO2709.toISO2709(record);

		case 'json':
			return record.toJsonObject();

		default:
			throw new Error('Unknown record format');
	}
}
