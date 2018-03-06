/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* RESTful API for Melinda
*
* Copyright (C) 2018 University Of Helsinki (The National Library Of Finland)
*
* This file is part of melinda-rest-api
*
* melinda-rest-api program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* melinda-rest-api is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
* @licend  The above is the entire license notice
* for the JavaScript code in this file.
*
*/

/* eslint-disable no-unused-vars, no-undef, max-nested-callbacks, no-unused-expressions, import/named */

'use strict';
import chai, {expect} from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import MarcRecord from 'marc-record-js';
import {recordTo} from '../src/record-utils';
import {postBibRecordsById, getBibRecordById, __RewireAPI__ as RewireAPI} from '../src/services/bib';
import exampleRecord from './data/example-record';

chai.use(sinonChai);

function replaceField(record, replacedField) {
	const tag = replacedField.tag;

	const index = record.fields.findIndex(field => field.tag === tag);

	record.fields.splice(index, 1, replacedField);
}

function modifyRecord(record, modifications) {
	modifications.forEach(([type, field]) => {
		if (type === 'append') {
			record.appendField(field);
		} else if (type === 'replace') {
			replaceField(record, field);
		} else {
			throw new Error('Unknown modification type');
		}
	});
}
let mockFetchRecordById;

beforeEach(() => {
	mockFetchRecordById = sinon.stub();
	RewireAPI.__Rewire__('fetchRecordById', mockFetchRecordById);
});

afterEach(() => {
	RewireAPI.__ResetDependency__('fetchRecordById');
});

describe('services/bib', () => {
	it.skip('postBibRecords', async () => {
		const result = await postBibRecords();
	});

	describe('postBibRecordsById', async () => {
		it('should sync record with changes made by caretaker', async () => {
			const originalRecord = new MarcRecord(exampleRecord);

			modifyRecord(originalRecord, [
				['replace', {tag: '005', value: '20181213114331.0'}],
				['append', {tag: 'CAT', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'CARETAKER'}, {code: 'b', value: '20'}, {code: 'c', value: '20181213'}, {code: 'l', value: 'FIN01'}, {code: 'h', value: '1143'}]}]
			]);

			const inputRecord = new MarcRecord(exampleRecord);

			modifyRecord(inputRecord, [
				['replace', {tag: '700', ind1: '1', ind2: ' ', subfields: [{code: 'a', value: 'Charles Dickens.'}, {code: 't', value: 'Kaksi kaupunkia.'}, {code: '0', value: '(FIN11)000041686'}]}]
			]);

			const expectedRecord = new MarcRecord(exampleRecord);

			modifyRecord(expectedRecord, [
				['replace', {tag: '005', value: '20181213114331.0'}],
				['replace', {tag: '700', ind1: '1', ind2: ' ', subfields: [{code: 'a', value: 'Dickens, Charles.'}, {code: 't', value: 'Kaksi kaupunkia.'}, {code: '0', value: '(FIN11)000041686'}]}],
				['append', {tag: 'CAT', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'CARETAKER'}, {code: 'b', value: '20'}, {code: 'c', value: '20181213'}, {code: 'l', value: 'FIN01'}, {code: 'h', value: '1143'}]}]
			]);

			mockFetchRecordById.resolves(originalRecord);

			const result = await postBibRecordsById(inputRecord.toJsonObject(), {recordId: '12345', sync: true, noop: true, format: 'json'});

			const resultedRecord = result.data;

			expect(resultedRecord).to.deep.equal(expectedRecord.toJsonObject());
		});
	});

	describe('getBibRecordsById', async () => {
		it('should return record in json format', async () => {
			mockFetchRecordById.resolves(new MarcRecord(exampleRecord));

			const result = await getBibRecordById({record: '12345', format: 'json'});

			const resultedRecord = result.data;

			expect(resultedRecord).to.deep.equal(exampleRecord);
		});

		it('should return record in marcxml format', async () => {
			const inputRecord = new MarcRecord(exampleRecord);
			mockFetchRecordById.resolves(inputRecord);

			const result = await getBibRecordById({record: '12345', format: 'marcxml'});

			const resultedRecord = result.data;

			expect(resultedRecord).to.deep.equal(recordTo(inputRecord, 'marcxml'));
		});
	});

	it.skip('postBibRecordsByIdLock', async () => {
		const result = await postBibRecordsByIdLock();
	});

	it.skip('deleteBibRecordsByIdLock', async () => {
		const result = await deleteBibRecordsByIdLock();
	});

	it.skip('getBibRecordsByIdLock', async () => {
		const result = await getBibRecordsByIdLock();
	});
});
