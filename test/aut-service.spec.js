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

/* eslint-disable no-unused-vars, no-undef, max-nested-callbacks, no-unused-expressions */

'use strict';

import {expect} from 'chai';
import * as testContext from '../src/services/aut';

describe.skip('services/aut', () => {
	it('postAutNamesRecords', async () => {
		const result = await testContext.postAutNamesRecords();
	});

	it('postAutNamesRecordsById', async () => {
		const result = await testContext.postAutNamesRecordsById();
	});

	it('getAutNamesRecordsById', async () => {
		const result = await testContext.getAutNamesRecordsById();
	});

	it('postAutNamesRecordsByIdLock', async () => {
		const result = await testContext.postAutNamesRecordsByIdLock();
	});

	it('deleteAutNamesRecordsByIdLock', async () => {
		const result = await testContext.deleteAutNamesRecordsByIdLock();
	});

	it('getAutNamesRecordsByIdLock', async () => {
		const result = await testContext.getAutNamesRecordsByIdLock();
	});

	it('postAutSubjectsRecords', async () => {
		const result = await testContext.postAutSubjectsRecords();
	});

	it('postAutSubjectsRecordsById', async () => {
		const result = await testContext.postAutSubjectsRecordsById();
	});

	it('getAutSubjectsRecordsById', async () => {
		const result = await testContext.getAutSubjectsRecordsById();
	});

	it('postAutSubjectsRecordsByIdLock', async () => {
		const result = await testContext.postAutSubjectsRecordsByIdLock();
	});

	it('deleteAutSubjectsRecordsByIdLock', async () => {
		const result = await testContext.deleteAutSubjectsRecordsByIdLock();
	});

	it('getAutSubjectsRecordsByIdLock', async () => {
		const result = await testContext.getAutSubjectsRecordsByIdLock();
	});
});
