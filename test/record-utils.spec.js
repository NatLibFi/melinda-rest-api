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
import MarcRecord from 'marc-record-js';
import * as recordUtils from '../src/record-utils';
import exampleRecord from './data/example-record';

chai.use(sinonChai);

const field = {tag: '700', ind1: '1', ind2: ' ', subfields: [{code: 'a', value: 'Dickens, Charles.'}, {code: 't', value: 'Kaksi kaupunkia.'}, {code: '0', value: '(FIN11)000041686'}]};
const fieldControl = {tag: '005', value: '20181213114331.0'};
const fieldCAT = {tag: 'CAT', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'CARETAKER'}, {code: 'b', value: '20'}, {code: 'c', value: '20181213'}, {code: 'l', value: 'FIN01'}, {code: 'h', value: '1143'}]};

describe('RecordUtils', () => {
	describe('selectFirstSubfieldValue', () => {
		it('should return subfield value', () => {
			expect(recordUtils.selectFirstSubfieldValue(field, 'a')).to.equal('Dickens, Charles.');
		});

		it('should return undefined when subfield does not exist', () => {
			expect(recordUtils.selectFirstSubfieldValue(field, 'b')).to.equal(undefined);
		});

		it('should return undefined when subfields does not exist', () => {
			expect(recordUtils.selectFirstSubfieldValue(fieldControl, 'b')).to.equal(undefined);
		});
	});

	describe('parseDateFromCATField', () => {
		it('should parse date from cat field', () => {
			expect(recordUtils.parseDateFromCATField(fieldCAT)).to.deep.equal(new Date('2018-12-13T11:43:00'));
		});
	});

	describe('findNewerCATFields', () => {
		it('should find newer CAT fields', () => {
			const record = new MarcRecord(exampleRecord);
			const recordToCompare = new MarcRecord(exampleRecord);

			record.appendField(fieldCAT);

			const result = recordUtils.findNewerCATFields(record, recordToCompare);

			expect(result).to.deep.equal([fieldCAT]);
		});

		it('should not find newer CAT fields (1)', () => {
			const record = new MarcRecord(exampleRecord);
			const recordToCompare = new MarcRecord(exampleRecord);

			const result = recordUtils.findNewerCATFields(record, recordToCompare);

			expect(result).to.deep.equal([]);
		});

		it('should not find newer CAT fields (2)', () => {
			const record = new MarcRecord(exampleRecord);
			const recordToCompare = new MarcRecord(exampleRecord);

			recordToCompare.appendField(fieldCAT);

			const result = recordUtils.findNewerCATFields(record, recordToCompare);

			expect(result).to.deep.equal([]);
		});
	});
});
