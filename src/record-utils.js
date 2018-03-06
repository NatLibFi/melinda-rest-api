/* eslint-disable import/prefer-default-export */
import _ from 'lodash';
import MarcRecordSerializers from 'marc-record-serializers';
import MarcRecord from 'marc-record-js';
import {parse, isBefore} from 'date-fns';

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

export function selectFirstSubfieldValue(field, code) {
	if (field.subfields) {
		return _.head(field.subfields
			.filter(subfield => subfield.code === code)
			.map(subfield => subfield.value));
	}
	return undefined;
}

export function selectFirstValue(field, code) {
	if (field.subfields) {
		return _.head(field.subfields
			.filter(subfield => subfield.code === code)
			.map(subfield => subfield.value));
	}
	return field.value;
}

export function fieldHasSubfield(code, value) {
	const querySubfield = {code, value};

	return function (field) {
		return field.subfields.some(subfield => _.isEqual(subfield, querySubfield));
	};
}

export function findNewerCATFields(record, recordToCompare) {
	const recordCATFields = record.fields.filter(field => field.tag === 'CAT');
	const recordToCompareCATFields = recordToCompare.fields.filter(field => field.tag === 'CAT');

	return recordCATFields.filter(field => {
		const fieldDate = parseDateFromCATField(field);

		return !recordToCompareCATFields.some(field2 => !isBefore(parseDateFromCATField(field2), fieldDate));
	});
}

export function parseDateFromCATField(field) {
	const valueC = selectFirstValue(field, 'c');
	const valueH = selectFirstValue(field, 'h');

	return parse(`${valueC}T${valueH}`);
}
