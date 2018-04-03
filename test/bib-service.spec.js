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
import dateFormat from 'date-fns/format';
import IORedisMock from 'ioredis-mock';
import {recordTo} from '../src/record-utils';
import {postBibRecordsById, getBibRecordById, postBibRecordsByIdLock, deleteBibRecordsByIdLock, getBibRecordsByIdLock, __RewireAPI__ as RewireAPI, getRecordLock} from '../src/services/bib';

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
let mockGetRecordLock;
let mockRedis;

const lockInputData = {
	recordId: 1,
	user: {
		userName: 'test'
	}
};

const dateExample = new Date('2018-01-01T00:00:00+02:00');
const dateExample2 = new Date('2018-01-01T01:00:00+02:00');

beforeEach(() => {
	mockFetchRecordById = sinon.stub();
	RewireAPI.__Rewire__('fetchRecordById', mockFetchRecordById);
	mockGetRecordLock = sinon.stub();
	RewireAPI.__Rewire__('getRecordLock', mockGetRecordLock);
	mockRedis = new IORedisMock();
	RewireAPI.__Rewire__('redis', mockRedis);
});

afterEach(() => {
	RewireAPI.__ResetDependency__('fetchRecordById');
	RewireAPI.__ResetDependency__('getRecordLock');
	RewireAPI.__ResetDependency__('redis');
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

	describe('postBibRecordsByIdLock', async () => {
		it('should return 201', async () => {
			const clock = sinon.useFakeTimers(dateExample.getTime());

			mockFetchRecordById.resolves(true);
			mockGetRecordLock.resolves(false);

			const result = await postBibRecordsByIdLock(lockInputData);
			const lock = await mockRedis.hgetall('lock:1');

			expect(result).to.deep.equal({
				status: 201,
				data: 'The lock was succesfully created'
			});

			expect(lock).to.deep.equal({
				user: 'test',
				expiresAt: '2018-01-01T01:00:00.000+02:00'
			});

			clock.restore();
		});

		it('should return 204', async () => {
			const clock = sinon.useFakeTimers(dateExample.getTime());

			mockFetchRecordById.resolves(true);
			mockGetRecordLock.resolves({
				user: 'test',
				expiresAt: dateFormat(Date.now())
			});

			const result = await postBibRecordsByIdLock(lockInputData);
			const lock = await mockRedis.hgetall('lock:1');

			expect(result).to.deep.equal({
				status: 204,
				data: 'The lock was succesfully renewed'
			});

			expect(lock).to.deep.equal({
				user: 'test',
				expiresAt: '2018-01-01T01:00:00.000+02:00'
			});

			clock.restore();
		});

		it('should return 404', async () => {
			mockFetchRecordById.resolves(false);

			const result = await postBibRecordsByIdLock(lockInputData);

			expect(result).to.deep.equal({
				status: 404,
				data: 'Not Found'
			});
		});

		it('should return 409', async () => {
			mockFetchRecordById.resolves(true);
			mockGetRecordLock.resolves({
				user: 'wrong_user',
				expiresAt: dateFormat(Date.now())
			});

			const result = await postBibRecordsByIdLock(lockInputData);

			expect(result).to.deep.equal({
				status: 409,
				data: 'Creating or updating a lock failed because the lock is held by another user'
			});
		});
	});

	describe('deleteBibRecordsByIdLock', async () => {
		it('should return 204', async () => {
			mockGetRecordLock.resolves({
				user: 'test',
				expiresAt: dateFormat(Date.now())
			});

			const result = await deleteBibRecordsByIdLock(lockInputData);
			const lock = await mockRedis.hgetall('lock:1');

			expect(result).to.deep.equal({
				status: 204,
				data: 'The lock was succesfully deleted'
			});

			expect(lock).to.be.empty;
		});

		it('should return 404', async () => {
			mockFetchRecordById.resolves(false);

			const result = await deleteBibRecordsByIdLock(lockInputData);

			expect(result).to.deep.equal({
				status: 404,
				data: 'Not Found'
			});
		});
	});

	describe('getBibRecordsByIdLock', async () => {
		it('should return 204', async () => {
			mockGetRecordLock.resolves({
				user: 'test',
				expiresAt: dateFormat(dateExample)
			});

			const result = await getBibRecordsByIdLock(lockInputData);

			expect(result).to.deep.equal({
				status: 200,
				data: {
					user: 'test',
					expiresAt: '2018-01-01T00:00:00.000+02:00'
				}
			});
		});

		it('should return 404', async () => {
			mockFetchRecordById.resolves(false);

			const result = await getBibRecordsByIdLock(lockInputData);

			expect(result).to.deep.equal({
				status: 404,
				data: 'Not Found'
			});
		});
	});

	describe('getRecordLock', () => {
		it('should return lock', async () => {
			const clock = sinon.useFakeTimers(dateExample.getTime());

			mockRedis.hmset('lock:1', {
				user: 'test',
				expiresAt: dateFormat(dateExample2)
			});

			const result = await getRecordLock(1);

			expect(result).to.deep.equal({
				user: 'test',
				expiresAt: '2018-01-01T01:00:00.000+02:00'
			});

			clock.restore();
		});

		it('should return false as lock has expired', async () => {
			const clock = sinon.useFakeTimers(dateExample2.getTime());

			mockRedis.hmset('lock:1', {
				user: 'test',
				expiresAt: dateFormat(dateExample)
			});

			const result = await getRecordLock(1);

			expect(result).to.be.false;

			clock.restore();
		});

		it('should return false as lock does not exist', async () => {
			const result = await getRecordLock(1);

			expect(result).to.be.false;
		});
	});
});
