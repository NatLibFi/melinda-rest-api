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

import fs from 'fs';
import path from 'path';
import {expect} from 'chai';
import nock from 'nock';
import {MarcRecord} from '@natlibfi/marc-record';
import * as testContext from './own-authorization';

const FIXTURES_PATH = path.join(__dirname, '../../test-fixtures/authorization');

const sruResponse1 = fs.readFileSync(path.join(FIXTURES_PATH, 'sruResponse1'), 'utf8');
const incomingRecord1 = fs.readFileSync(path.join(FIXTURES_PATH, 'incomingRecord1'), 'utf8');
const incomingRecord2 = fs.readFileSync(path.join(FIXTURES_PATH, 'incomingRecord2'), 'utf8');
const incomingRecord3 = fs.readFileSync(path.join(FIXTURES_PATH, 'incomingRecord3'), 'utf8');

MarcRecord.setValidationOptions({subfieldValues: false});

describe('services/authorization', () => {
	afterEach(() => {
		nock.cleanAll();
	});

	describe('factory', () => {
		it('Should create the expected object', () => {
			const service = testContext.default({});
			expect(service).to.be.an('object').and.respondTo('check');
		});

		describe('#check', () => {
			it('Should succeed', async () => {
				nock('https://own.auth')
					.get(/.*/).reply(200, ['FOO']);

				const service = testContext.default({
					sruURL: 'https://sru',
					apiURL: 'https://own.auth'
				});

				const record = new MarcRecord(JSON.parse(incomingRecord1));
				await service.check({record, username: 'foo', password: 'bar'});
			});

			it('Should fail because of insufficient permissions', async () => {
				nock('https://own.auth')
					.get(/.*/).reply(200, ['FOO']);

				const service = testContext.default({
					sruURL: 'https://sru',
					apiURL: 'https://own.auth'
				});

				try {
					const record = new MarcRecord(JSON.parse(incomingRecord2));

					await service.check({record, username: 'foo', password: 'bar'});
					throw new Error('Should throw');
				} catch (err) {
					expect(err).to.be.an.instanceof(testContext.AuthorizationError);
				}
			});

			it('Should fail because of insufficient permissions (Updating record)', async () => {
				nock('https://own.auth')
					.get(/.*/).reply(200, ['FOO']);
				nock('https://sru')
					.get(/.*/).reply(200, sruResponse1);

				const service = testContext.default({
					sruURL: 'https://sru',
					apiURL: 'https://own.auth'
				});

				try {
					const record = new MarcRecord(JSON.parse(incomingRecord3));

					await service.check({record, id: '1234', username: 'foo', password: 'bar'});
					throw new Error('Should throw');
				} catch (err) {
					expect(err).to.be.an.instanceof(testContext.AuthorizationError);
				}
			});

			it('Should fail because of an unexpected error', async () => {
				nock('https://own.auth')
					.get(/.*/).reply(500);

				const service = testContext.default({
					sruURL: 'https://sru',
					apiURL: 'https://own.auth'
				});

				try {
					await service.check({username: 'foo', password: 'bar'});
					throw new Error('Should throw');
				} catch (err) {
					expect(err).to.be.an('error');
				}
			});
		});
	});
});
