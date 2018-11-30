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

/* eslint-disable max-nested-callbacks */

'use strict';

import {expect} from 'chai';
import nock from 'nock';
import * as testContext from './candidate-service';
import {emptyResponse, recordResponse1, inputRecord1, expectedRecord1} from './test-fixtures';

describe('services/record-matching/candidate-service', () => {
	afterEach(() => {
		nock.cleanAll();
	});

	describe('factory', () => {
		it('Should create the expected object', () => {
			const service = testContext.default({});
			expect(service).to.be.an('object').and.respondTo('findBib');
		});

		describe('#findBib', () => {
			it('Should not find candidates', done => {
				nock('https://foo.bar')
					.get(/^\/bib.*/).reply(200, emptyResponse)
					.get(/^\/bib.*/).reply(200, emptyResponse);

				const service = testContext.default({sruURL: 'https://foo.bar'});

				service.findBib(inputRecord1)
					.on('end', done)
					.on('error', done)
					.on('candidate', () => {
						done(new Error('Should not emit candidate'));
					});
			});

			it('Should find candidates', done => {
				nock('https://foo.bar')
					.get(/^\/bib.*/).reply(200, recordResponse1)
					.get(/^\/bib.*/).reply(200, recordResponse1);

				let found = false;
				const service = testContext.default({sruURL: 'https://foo.bar'});

				service.findBib(inputRecord1)
					.on('candidate', candidate => {
						expect(candidate.equalsTo(expectedRecord1)).to.equal(true);
						found = true;
					})
					.on('end', () => {
						expect(found).to.equal(true);
						done();
					})
					.on('error', done);
			});
		});
	});
});
