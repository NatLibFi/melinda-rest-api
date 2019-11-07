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
// Import chai, {expect} from 'chai';
// import sinon from 'sinon';
// import sinonChai from 'sinon-chai';
import {MarcRecord} from '@natlibfi/marc-record';
import * as testContext from './validation';

// Chai.use(sinonChai);

const FIXTURES_PATH = path.join(__dirname, '../../test-fixtures/validation');

const inputRecord1 = fs.readFileSync(path.join(FIXTURES_PATH, 'inputRecord1'), 'utf8');
const outputRecord1 = fs.readFileSync(path.join(FIXTURES_PATH, 'outputRecord1'), 'utf8');

describe('services/validation', () => {
	afterEach(() => {
		// TestContext.default.__ResetDependency__('validateFactory');
	});

	describe('factory', () => {
		it('Should create the expected object', async () => {
			// TestContext.default.__Rewire__('validateFactory', sinon.fake());

			const service = await testContext.default();
			expect(service).to.be.an('object').and.respondTo('validate');
		});

		describe('#validate', () => {
			it('Should validate the record succesfully', async () => {
				/*				TestContext.default.__Rewire__('validateFactory', sinon.fake.returns(
					sinon.fake.resolves({valid: true})
				)); */

				const record = new MarcRecord(JSON.parse(inputRecord1));
				const service = await testContext.default();
				const results = await service.validate(record);

				expect(results).to.have.lengthOf(0);
				expect(record.toObject()).to.eql(JSON.parse(inputRecord1));
			});

			it.skip('Should validate and fix the record succesfully', async () => {
				/* TestContext.default.__Rewire__('validateFactory', sinon.fake.returns(
					sinon.fake(async r => {
						const subfield = r.get(/^245$/)[0].subfields[0];
						subfield.value = subfield.value.replace(/b/, ';b');
						return {valid: true, messages: ['foo']};
					})
				)); */

				const record = new MarcRecord(JSON.parse(inputRecord1));
				const service = await testContext.default();
				const results = await service.validate(record);

				expect(results).to.eql(['foo']);
				expect(record.toObject()).to.eql(JSON.parse(outputRecord1));
			});

			it.skip('Should fail to validate the record', async () => {
				/* TestContext.default.__Rewire__('validateFactory', sinon.fake.returns(
					sinon.fake.rejects(new testContext.ValidationError(['foo']))
				)); */

				const record = new MarcRecord(JSON.parse(inputRecord1));
				const service = await testContext.default();

				try {
					await service.validate(record);
					throw new Error('Should throw');
				} catch (err) {
					if (!(err instanceof testContext.ValidationError)) {
						throw err;
					}
				}
			});
		});
	});
});
