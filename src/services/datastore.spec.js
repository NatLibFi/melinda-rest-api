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

/* eslint-disable camelcase */

import fs from 'fs';
import path from 'path';
import HttpStatus from 'http-status';
import nock from 'nock';
import {expect} from 'chai';
import {MarcRecord} from '@natlibfi/marc-record';
import * as testContext from './datastore';

const FIXTURES_PATH = path.join(__dirname, '../../test-fixtures/datastore');

const sruResponse1 = fs.readFileSync(path.join(FIXTURES_PATH, 'sruResponse1'), 'utf8');
const sruResponse2 = fs.readFileSync(path.join(FIXTURES_PATH, 'sruResponse2'), 'utf8');
const sruResponse3 = fs.readFileSync(path.join(FIXTURES_PATH, 'sruResponse3'), 'utf8');
const sruResponse4 = fs.readFileSync(path.join(FIXTURES_PATH, 'sruResponse4'), 'utf8');
const sruResponse5 = fs.readFileSync(path.join(FIXTURES_PATH, 'sruResponse5'), 'utf8');
const sruResponse6 = fs.readFileSync(path.join(FIXTURES_PATH, 'sruResponse6'), 'utf8');
const expectedRecord1 = fs.readFileSync(path.join(FIXTURES_PATH, 'expectedRecord1'), 'utf8');
const incomingRecord1 = fs.readFileSync(path.join(FIXTURES_PATH, 'incomingRecord1'), 'utf8');
const incomingRecord2 = fs.readFileSync(path.join(FIXTURES_PATH, 'incomingRecord2'), 'utf8');
const incomingRecord3 = fs.readFileSync(path.join(FIXTURES_PATH, 'incomingRecord3'), 'utf8');
const incomingRecord4 = fs.readFileSync(path.join(FIXTURES_PATH, 'incomingRecord4'), 'utf8');

MarcRecord.setValidationOptions({subfieldValues: false});

describe('services/datastore', () => {
	afterEach(() => {
		nock.cleanAll();
	});

	describe('factory', () => {
		it('Should create the expected object', () => {
			const service = testContext.default({});
			expect(service).to.be.an('object')
				.and.respondTo('read')
				.and.respondTo('create')
				.and.respondTo('update');
		});

		describe('#read', () => {
			it('Should fetch a record', async () => {
				nock('https://sru')
					.get(/.*/).reply(200, sruResponse1);

				const service = testContext.default({
					sruURL: 'https://sru',
					apiURL: 'https://api',
					apiKey: 'foobar',
					library: 'foo'
				});

				const record = await service.read('1234');
				expect(record.toObject()).to.eql(JSON.parse(expectedRecord1));
			});

			it('Should fail because the record does not exist', async () => {
				nock('https://sru')
					.get(/.*/).reply(200, sruResponse2);

				const service = testContext.default({
					sruURL: 'https://sru',
					apiURL: 'https://api',
					apiKey: 'foobar',
					library: 'foo'
				});

				try {
					await service.read('foobar');
					throw new Error('Should throw');
				} catch (err) {
					expect(err).to.be.an.instanceof(testContext.DatastoreError);
					expect(err).to.have.property('status', HttpStatus.NOT_FOUND);
				}
			});

			it('Should fail because of an unexpected error', async () => {
				nock('https://sru')
					.get(/.*/).reply(500);

				const service = testContext.default({
					sruURL: 'https://sru',
					apiURL: 'https://api',
					apiKey: 'foobar',
					library: 'foo'
				});

				try {
					await service.read('1234');
					throw new Error('Should throw');
				} catch (err) {
					expect(err).to.be.an('error');
				}
			});
		});

		describe('#create', () => {
			it('Should create a record', async () => {
				nock('https://api')
					.post(/.*/).reply(200, ['1234']);

				const service = testContext.default({
					sruURL: 'https://sru',
					apiURL: 'https://api',
					apiKey: 'foobar',
					library: 'foo'
				});

				const record = new MarcRecord(JSON.parse(incomingRecord1));
				const id = await service.create({record});

				expect(id).to.equal('1234');
			});

			it('Should fail because of an unexpected error', async () => {
				nock('https://api')
					.post(/.*/).reply(500);

				const service = testContext.default({
					sruURL: 'https://sru',
					apiURL: 'https://api',
					apiKey: 'foobar',
					library: 'foo'
				});

				try {
					const record = new MarcRecord(JSON.parse(incomingRecord1));
					await service.create({record});
					throw new Error('Should throw');
				} catch (err) {
					expect(err).to.be.an('error');
				}
			});
		});

		describe('#update', () => {
			it('Should update a record', async () => {
				nock('https://sru')
					.get(/.*/).reply(200, sruResponse3);
				nock('https://api')
					.post(/.*/).reply(200, ['1234']);

				const service = testContext.default({
					sruURL: 'https://sru',
					apiURL: 'https://api',
					apiKey: 'foobar',
					library: 'foo'
				});

				const record = new MarcRecord(JSON.parse(incomingRecord2));
				await service.update({record, id: '1234'});
			});

			it('Should fail because the record does not exist', async () => {
				nock('https://sru')
					.get(/.*/).reply(200, sruResponse4);

				const service = testContext.default({
					sruURL: 'https://sru',
					apiURL: 'https://api',
					apiKey: 'foobar',
					library: 'foo'
				});

				try {
					const record = new MarcRecord(JSON.parse(incomingRecord2));
					await service.update({record, id: '1234'});
					throw new Error('Should throw');
				} catch (err) {
					expect(err).to.be.an.instanceof(testContext.DatastoreError);
					expect(err).to.have.property('status', HttpStatus.NOT_FOUND);
				}
			});

			it('Should fail because target record has changed in datastore', async () => {
				nock('https://sru')
					.get(/.*/).reply(200, sruResponse5);

				const service = testContext.default({
					sruURL: 'https://sru',
					apiURL: 'https://api',
					apiKey: 'foobar',
					library: 'foo'
				});

				try {
					const record = new MarcRecord(JSON.parse(incomingRecord3));
					await service.update({record, id: '1234'});
					throw new Error('Should throw');
				} catch (err) {
					expect(err).to.be.an.instanceof(testContext.DatastoreError);
					expect(err).to.have.property('status', HttpStatus.CONFLICT);
				}
			});

			it('Should update the record (CAT-field has props in different order)', async () => {
				nock('https://sru')
					.get(/.*/).reply(200, sruResponse6);
				nock('https://api')
					.post(/.*/).reply(200, ['1234']);

				const service = testContext.default({
					sruURL: 'https://sru',
					apiURL: 'https://api',
					apiKey: 'foobar',
					library: 'foo'
				});

				const record = new MarcRecord(JSON.parse(incomingRecord4));
				await service.update({record, id: '1234'});
			});

			it('Should fail because of an unexpected error', async () => {
				nock('https://sru')
					.get(/.*/).reply(500);

				const service = testContext.default({
					sruURL: 'https://sru',
					apiURL: 'https://api',
					apiKey: 'foobar',
					library: 'foo'
				});

				try {
					const record = new MarcRecord(JSON.parse(incomingRecord3));
					await service.update({record, id: '1234'});
				} catch (err) {
					expect(err).to.be.an('error');
				}
			});
		});
	});
});
