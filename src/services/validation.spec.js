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

import {expect} from 'chai';
import fixtureFactory from '@natlibfi/fixura';
import {MarcRecord} from '@natlibfi/marc-record';
import createValidator from './validation';


describe('services/validate', () => {
  const FIXTURES_PATH = [
    __dirname,
    '..',
    '..',
    'test-fixtures',
    'validation'
  ];
  const {getFixture} = fixtureFactory({root: FIXTURES_PATH});

  describe('f003-fi-melinda', () => {
    it('Should have failed: false', async () => {
      const validator = await createValidator();
      const record = new MarcRecord(JSON.parse(getFixture({
        components: [
          'in',
          'f003-fi-melinda.json'
        ]
      })));
      const result = await validator(record.toObject());
      const expected = getFixture({
        components: [
          'out',
          'f003-fi-melinda.json'
        ]
      });
      const stringResult = JSON.stringify({...result}, undefined, 2);
      expect(stringResult).to.eql(expected);
      expect(result.failed).to.equal(false);
    });
  });

  describe('f003-not-fi-melinda', () => {
    it('Should have failed: true', async () => {
      const validator = await createValidator();
      const record = new MarcRecord(JSON.parse(getFixture({
        components: [
          'in',
          'f003-not-fi-melinda.json'
        ]
      })));
      const result = await validator(record.toObject());
      const expected = getFixture({
        components: [
          'out',
          'f003-not-fi-melinda.json'
        ]
      });
      const stringResult = JSON.stringify({...result}, undefined, 2);
      expect(stringResult).to.eql(expected);
      expect(result.failed).to.equal(true);
    });
  });

  describe('fSTA-DELETED', () => {
    it('Should have failed: true', async () => {
      const validator = await createValidator();
      const record = new MarcRecord(JSON.parse(getFixture({
        components: [
          'in',
          'fSTA-DELETED.json'
        ]
      })));
      const result = await validator(record.toObject());
      const expected = getFixture({
        components: [
          'out',
          'fSTA-DELETED.json'
        ]
      });
      const stringResult = JSON.stringify({...result}, undefined, 2);
      expect(stringResult).to.eql(expected);
      expect(result.failed).to.equal(true);
    });
  });
});
