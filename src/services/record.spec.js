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

/* eslint-disable no-unused-vars, no-undef, max-nested-callbacks, no-unused-expressions, import/named, require-await */

'use strict';

import chai, {expect} from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {MarcRecord} from '@natlibfi/marc-record';
import dateFormat from 'date-fns/format';
import {recordTo} from '../record-utils';
import * as testContext from './record';
import exampleRecord from '../../test-fixtures/example-record';

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

const dateExample = new Date('2018-01-01T00:00:00+02:00');
const dateExample2 = new Date('2018-01-01T01:00:00+02:00');

afterEach(() => {
	sinon.restore();
});

describe('services/record', () => {
	describe('factory', () => {
        afterEach(() => {
		  testContext.default.__ResetDependency__('createSruClient');
		})

		it('Should create the expected object', () => {
		  const service = testContext.default({});

		  expect(service).to.be.an('object')
		  .and.respondTo('get')
		  .and.respondTo('create')
		  .and.respondTo('update');
		});

		describe('get', () => {
          it('Should return a record', async () => {
			testContext.default.__Rewire__('createSruClient', sinon.fake.returns({
              searchRetrieve: async () => '<records><foo /></records>'
			}));

			const service = testContext.default({});
			const record = await service.get({});
			

		  });
		});
	})/*
	describe('getRecordById', async () => {
		it('Should return record in json format', async () => {*/
			/*RewireAPI.__Rewire__('getRecordById', sinon.fake.resolves(new MarcRecord({

			})));*/
/*
			const result = await getRecordById({sruClient, id});
			const resultedRecord = result.data;

			expect(resultedRecord).to.deep.equal(exampleRecord);
		});

		it('should return record in marcxml format', async () => {
			const inputRecord = new MarcRecord(exampleRecord);
			mockFetchRecordById.resolves(inputRecord);

			const result = await getRecordById(connection, {record: '12345', format: 'marcxml'});

			const resultedRecord = result.data;

			expect(resultedRecord).to.deep.equal(recordTo(inputRecord, 'marcxml'));
		});
	});*/


	it.skip('postRecords', async () => {
		const result = await postRecords();
	});

	describe.skip('postRecordsById', async () => {
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

			const result = await postRecordsById(connection, redis, process.env.ALEPH_OWN_AUTH_API_URL, inputRecord.toJsonObject(), {recordId: '12345', sync: true, noop: true, format: 'json'});

			const resultedRecord = result.data;

			expect(resultedRecord).to.deep.equal(expectedRecord.toJsonObject());
		});
	});

	describe.skip('postRecordsByIdLock', async () => {
		it('should return 201', async () => {
			const clock = sinon.useFakeTimers(dateExample.getTime());

			mockFetchRecordById.resolves(true);
			mockGetRecordLock.resolves(false);

			const result = await postRecordsByIdLock(connection, redis, lockInputData);
			const lock = await redis.hgetall('lock:1');

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

			const result = await postRecordsByIdLock(connection, redis, lockInputData);
			const lock = await redis.hgetall('lock:1');

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

			const result = await postRecordsByIdLock(connection, redis, lockInputData);

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

			const result = await postRecordsByIdLock(connection, redis, lockInputData);

			expect(result).to.deep.equal({
				status: 409,
				data: 'Creating or updating a lock failed because the lock is held by another user'
			});
		});
	});

	describe.skip('deleteRecordsByIdLock', async () => {
		it('should return 204', async () => {
			mockGetRecordLock.resolves({
				user: 'test',
				expiresAt: dateFormat(Date.now())
			});

			const result = await deleteRecordsByIdLock(connection, redis, lockInputData);
			const lock = await redis.hgetall('lock:1');

			expect(result).to.deep.equal({
				status: 204,
				data: 'The lock was succesfully deleted'
			});

			expect(lock).to.be.empty;
		});

		it('should return 404', async () => {
			mockFetchRecordById.resolves(false);

			const result = await deleteRecordsByIdLock(connection, redis, lockInputData);

			expect(result).to.deep.equal({
				status: 404,
				data: 'Not Found'
			});
		});
	});

	describe.skip('getRecordsByIdLock', async () => {
		it('should return 204', async () => {
			mockGetRecordLock.resolves({
				user: 'test',
				expiresAt: dateFormat(dateExample)
			});

			const result = await getRecordsByIdLock(connection, redis, lockInputData);

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

			const result = await getRecordsByIdLock(connection, redis, lockInputData);

			expect(result).to.deep.equal({
				status: 404,
				data: 'Not Found'
			});
		});
	});

	describe.skip('getRecordLock', () => {
		it('should return lock', async () => {
			const clock = sinon.useFakeTimers(dateExample.getTime());

			redis.hmset('lock:1', {
				user: 'test',
				expiresAt: dateFormat(dateExample2)
			});

			const result = await getRecordLock(redis, 1);

			expect(result).to.deep.equal({
				user: 'test',
				expiresAt: '2018-01-01T01:00:00.000+02:00'
			});

			clock.restore();
		});

		it('should return false as lock has expired', async () => {
			const clock = sinon.useFakeTimers(dateExample2.getTime());

			redis.hmset('lock:1', {
				user: 'test',
				expiresAt: dateFormat(dateExample)
			});

			const result = await getRecordLock(redis, 1);

			expect(result).to.be.false;

			clock.restore();
		});

		it('should return false as lock does not exist', async () => {
			const result = await getRecordLock(redis, 1);

			expect(result).to.be.false;
		});
	});
});
