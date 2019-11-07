/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* RESTful API for Melinda
*
* Copyright (C) 2018-2019 University Of Helsinki (The National Library Of Finland)
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

/* eslint-disable camelcase, max-nested-callbacks */

import fs from 'fs';
import path from 'path';
import {expect} from 'chai';
import {MarcRecord} from '@natlibfi/marc-record';
import * as testContext from './conversion';

const FIXTURES_PATH = path.join(__dirname, '../../test-fixtures/conversion');

const marcxml1 = fs.readFileSync(path.join(FIXTURES_PATH, 'marcxml1'), 'utf8');
const iso2709_1 = fs.readFileSync(path.join(FIXTURES_PATH, 'iso2709_1'), 'utf8');
const json1 = fs.readFileSync(path.join(FIXTURES_PATH, 'json1'), 'utf8');

const record1 = new MarcRecord(JSON.parse(json1));

describe('services/conversion', () => {
	afterEach(() => {
		testContext.default.__ResetDependency__('MARCXML');
		testContext.default.__ResetDependency__('AlephSequential');
		testContext.default.__ResetDependency__('ISO2709');
		testContext.default.__ResetDependency__('Json');
	});

	describe('factory', () => {
		it('Should create the expected object', () => {
			const service = testContext.default({});
			expect(service).to.be.an('object').and
				.respondTo('serialize')
				.respondTo('unserialize');
		});

		describe('#serialize', () => {
			it('Should throw because of unsupported format', () => {
				const service = testContext.default();
				expect(service.serialize).to.throw();
			});

			it('Should serialize to MARCXML', () => {
				const service = testContext.default();
				const data = service.serialize(record1, testContext.FORMATS.MARCXML);

				expect(data).to.equal(marcxml1);
			});

			it('Should serialize to ISO2709', () => {
				const service = testContext.default();
				const data = service.serialize(record1, testContext.FORMATS.ISO2709);

				expect(data).to.equal(iso2709_1);
			});

			it('Should serialize to JSON', () => {
				const service = testContext.default();
				const data = service.serialize(record1, testContext.FORMATS.JSON);

				expect(data).to.equal(json1);
			});
		});

		describe('#unserialize', () => {
			it('Should throw because of unsupported format', () => {
				const service = testContext.default();
				expect(service.unserialize).to.throw();
			});

			it('Should unserialize from MARCXML', () => {
				const service = testContext.default();
				const record = service.unserialize(marcxml1, testContext.FORMATS.MARCXML);

				expect(record.equalsTo(record1)).to.equal(true);
			});

			it('Should unserialize from ISO2709', () => {
				const service = testContext.default();
				const record = service.unserialize(iso2709_1, testContext.FORMATS.ISO2709);

				expect(record.equalsTo(record1)).to.equal(true);
			});

			it('Should unserialize from JSON', () => {
				const service = testContext.default();
				const record = service.unserialize(json1, testContext.FORMATS.JSON);

				expect(record.equalsTo(record1)).to.equal(true);
			});

			it('Should throw because the record could not be unserialized', () => {
				const service = testContext.default();

				expect(() => {
					service.unserialize('', testContext.FORMATS.JSON);
				}).to.throw(testContext.ConversionError);
			});
		});
	});
});
