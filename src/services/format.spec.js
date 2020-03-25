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
import {formatRecord, BIB_FORMAT_SETTINGS} from './format';


describe('services/format', () => {
  const FIXTURES_PATH = [
    __dirname,
    '..',
    '..',
    'test-fixtures',
    'format'
  ];
  const {getFixture} = fixtureFactory({root: FIXTURES_PATH});

  describe('fiAsteriN0Fin11', () => {
    it('Should succeed', () => {
      const record = new MarcRecord(JSON.parse(getFixture({
        components: [
          'in',
          'fiAsteriN0Fin11.json'
        ]
      })));
      const result = formatRecord(record.toObject(), BIB_FORMAT_SETTINGS);
      const expected = getFixture({
        components: [
          'out',
          'fiAsteriN0Fin11.json'
        ]
      });
      const stringResult = JSON.stringify({...result}, undefined, 2);
      expect(stringResult).to.eql(expected);
    });
  });

  describe('fiAsteriS0Fin10', () => {
    it('Should succeed', () => {
      const record = new MarcRecord(JSON.parse(getFixture({
        components: [
          'in',
          'fiAsteriS0Fin10.json'
        ]
      })));
      const result = formatRecord(record.toObject(), BIB_FORMAT_SETTINGS);
      const expected = getFixture({
        components: [
          'out',
          'fiAsteriS0Fin10.json'
        ]
      });
      const stringResult = JSON.stringify({...result}, undefined, 2);
      expect(stringResult).to.eql(expected);
    });
  });

  describe('fiMelindaWFin01', () => {
    it('Should succeed', () => {
      const record = new MarcRecord(JSON.parse(getFixture({
        components: [
          'in',
          'fiMelindaWFin01.json'
        ]
      })));
      const result = formatRecord(record.toObject(), BIB_FORMAT_SETTINGS);
      const expected = getFixture({
        components: [
          'out',
          'fiMelindaWFin01.json'
        ]
      });
      const stringResult = JSON.stringify({...result}, undefined, 2);
      expect(stringResult).to.eql(expected);
    });
  });
});
