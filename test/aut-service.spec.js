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
import {
	postAutNamesRecords,
	postAutNamesRecordsById,
	getAutNamesRecordsById,
	postAutNamesRecordsByIdLock,
	deleteAutNamesRecordsByIdLock,
	getAutNamesRecordsByIdLock,
	postAutSubjectsRecords,
	postAutSubjectsRecordsById,
	getAutSubjectsRecordsById,
	postAutSubjectsRecordsByIdLock,
	deleteAutSubjectsRecordsByIdLock,
	getAutSubjectsRecordsByIdLock,
	__RewireAPI__ as RewireAPI
} from '../src/services/aut';

chai.use(sinonChai);

const recordService = {
	postRecords: sinon.stub().returns('postRecords'),
	postRecordsById: sinon.stub().returns('postRecordsById'),
	getRecordById: sinon.stub().returns('getRecordById'),
	postRecordsByIdLock: sinon.stub().returns('postRecordsByIdLock'),
	deleteRecordsByIdLock: sinon.stub().returns('deleteRecordsByIdLock'),
	getRecordsByIdLock: sinon.stub().returns('getRecordsByIdLock')
};

const options = 'options';
const connectionNames = 'connectionNames';
const connectionSubjects = 'connectionSubjects';
const redis = 'redis';
const body = 'body';

beforeEach(() => {
	RewireAPI.__Rewire__('recordService', recordService);
	RewireAPI.__Rewire__('connectionNames', connectionNames);
	RewireAPI.__Rewire__('connectionSubjects', connectionSubjects);
	RewireAPI.__Rewire__('redis', redis);
});

afterEach(() => {
	RewireAPI.__ResetDependency__('recordService');
	RewireAPI.__ResetDependency__('connection');
	RewireAPI.__ResetDependency__('redis');
});

describe('services/aut', () => {
	it('postAutNamesRecords', async () => {
		const result = await postAutNamesRecords(options);

		expect(recordService.postRecords).to.have.been.calledWith(connectionNames, options);
		expect(result).to.equal('postRecords');
	});

	it('postAutNamesRecordsById', async () => {
		const result = await postAutNamesRecordsById(body, options);

		expect(recordService.postRecordsById).to.have.been.calledWith(connectionNames, redis, body, options);
		expect(result).to.equal('postRecordsById');
	});

	it('getAutNamesRecordsById', async () => {
		const result = await getAutNamesRecordsById(options);

		expect(recordService.getRecordById).to.have.been.calledWith(connectionNames, options);
		expect(result).to.equal('getRecordById');
	});

	it('postAutNamesRecordsByIdLock', async () => {
		const result = await postAutNamesRecordsByIdLock(options);

		expect(recordService.postRecordsByIdLock).to.have.been.calledWith(connectionNames, redis, options);
		expect(result).to.equal('postRecordsByIdLock');
	});

	it('deleteAutNamesRecordsByIdLock', async () => {
		const result = await deleteAutNamesRecordsByIdLock(options);

		expect(recordService.deleteRecordsByIdLock).to.have.been.calledWith(connectionNames, redis, options);
		expect(result).to.equal('deleteRecordsByIdLock');
	});

	it('getAutNamesRecordsByIdLock', async () => {
		const result = await getAutNamesRecordsByIdLock(options);

		expect(recordService.getRecordsByIdLock).to.have.been.calledWith(connectionNames, redis, options);
		expect(result).to.equal('getRecordsByIdLock');
	});

	it('postAutSubjectsRecords', async () => {
		const result = await postAutSubjectsRecords(options);

		expect(recordService.postRecords).to.have.been.calledWith(connectionSubjects, options);
		expect(result).to.equal('postRecords');
	});

	it('postAutSubjectsRecordsById', async () => {
		const result = await postAutSubjectsRecordsById(body, options);

		expect(recordService.postRecordsById).to.have.been.calledWith(connectionSubjects, redis, body, options);
		expect(result).to.equal('postRecordsById');
	});

	it('getAutSubjectsRecordsById', async () => {
		const result = await getAutSubjectsRecordsById(options);

		expect(recordService.getRecordById).to.have.been.calledWith(connectionSubjects, options);
		expect(result).to.equal('getRecordById');
	});

	it('postAutSubjectsRecordsByIdLock', async () => {
		const result = await postAutSubjectsRecordsByIdLock(options);

		expect(recordService.postRecordsByIdLock).to.have.been.calledWith(connectionSubjects, redis, options);
		expect(result).to.equal('postRecordsByIdLock');
	});

	it('deleteAutSubjectsRecordsByIdLock', async () => {
		const result = await deleteAutSubjectsRecordsByIdLock(options);

		expect(recordService.deleteRecordsByIdLock).to.have.been.calledWith(connectionSubjects, redis, options);
		expect(result).to.equal('deleteRecordsByIdLock');
	});

	it('getAutSubjectsRecordsByIdLock', async () => {
		const result = await getAutSubjectsRecordsByIdLock(options);

		expect(recordService.getRecordsByIdLock).to.have.been.calledWith(connectionSubjects, redis, options);
		expect(result).to.equal('getRecordsByIdLock');
	});
});
