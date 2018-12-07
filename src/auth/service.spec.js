
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
import {expect} from 'chai';
import HttpStatus from 'http-status';
import nock from 'nock';
import * as testContext from './service';

const FIXTURES_PATH = path.join(__dirname, '../../test-fixtures/authentication');
const response1 = fs.readFileSync(path.resolve(FIXTURES_PATH, 'response1'), 'utf8');
const response2 = fs.readFileSync(path.resolve(FIXTURES_PATH, 'response2'), 'utf8');
const response3 = fs.readFileSync(path.resolve(FIXTURES_PATH, 'response3'), 'utf8');
const userData1 = fs.readFileSync(path.resolve(FIXTURES_PATH, 'userData1'), 'utf8');

describe('auth/service', () => {
	describe('factory', () => {
		it('Should create the expected object', () => {
			const service = testContext.default({url: 'https://auth', library: 'foo'});
			expect(service).to.be.an('object').and.respondTo('authenticate');
		});

		describe('#authenticate', () => {
			afterEach(() => {
				nock.cleanAll();
			});

			it('Should authenticate the user succesfully', async () => {
				const library = 'foo';
				const username = 'foo';
				const password = 'bar';

				nock('https://auth')
					.get(/.*/)
					.query({
						op: 'user-auth', library,
						staff_user: username, staff_pass: password
					})
					.reply(HttpStatus.OK, response1);

				const service = testContext.default({url: 'https://auth', library});
				const user = await service.authenticate({username, password});

				console.log(JSON.stringify(JSON.parse(userData1), undefined, 2));
				console.log(JSON.stringify(user, undefined, 2));

				expect(user).to.eql(JSON.parse(userData1));
			});

			it('Should fail to authenticate the user (Invalid credentials)', async () => {
				const library = 'foo';
				const username = 'foo';
				const password = 'bar';

				nock('https://auth')
					.get(/.*/)
					.query({
						op: 'user-auth', library,
						staff_user: username, staff_pass: password
					})
					.reply(HttpStatus.OK, response2);

				const service = testContext.default({url: 'https://auth', library});

				try {
					await service.authenticate({username, password});
					throw new Error('Should throw');
				} catch (err) {
					expect(err).to.be.an.instanceof(testContext.AuthenticationError);
					expect(err.status).to.eql(HttpStatus.UNAUTHORIZED);
				}
			});

			it('Should fail to authenticate the user (Reply not ok)', async () => {
				const library = 'foo';
				const username = 'foo';
				const password = 'bar';

				nock('https://auth')
					.get(/.*/)
					.query({
						op: 'user-auth', library,
						staff_user: username, staff_pass: password
					})
					.reply(HttpStatus.OK, response3);

				const service = testContext.default({url: 'https://auth', library});

				try {
					await service.authenticate({username, password});
					throw new Error('Should throw');
				} catch (err) {
					expect(err).to.be.an.instanceof(testContext.AuthenticationError);
					expect(err.status).to.eql(HttpStatus.UNAUTHORIZED);
				}
			});

			it('Should fail to authenticate the user (Unexpected error)', async () => {
				const library = 'foo';
				const username = 'foo';
				const password = 'bar';

				nock('https://auth')
					.get(/.*/)
					.query({
						op: 'user-auth', library,
						staff_user: username, staff_pass: password
					})
					.reply(HttpStatus.INTERNAL_SERVER_ERROR);

				const service = testContext.default({url: 'https://auth', library});

				try {
					await service.authenticate({username, password});
					throw new Error('Should throw');
				} catch (err) {
					expect(err).to.be.an.instanceof(testContext.AuthenticationError);
					expect(err.status).to.eql(HttpStatus.INTERNAL_SERVER_ERROR);
				}
			});
		});
	});
});
