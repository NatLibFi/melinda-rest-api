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

import {URL} from 'url';
import HttpStatus from 'http-status';
import fetch from 'node-fetch';
import createSruClient from '@natlibfi/sru-client';
import {MARCXML, AlephSequential} from '@natlibfi/marc-record-serializers';
import {createAuthorizationHeader} from '../utils';

const FIX_ROUTINE = 'GEN01';
const UPDATE_ACTION = 'REP';
const SRU_VERSION = '2.0';
const DEFAULT_CATALOGER_ID = 'API';

export class DatastoreError extends Error {
	constructor(status, ...params) {
		super(params);
		this.status = status;
	}
}

export default function ({sruURL, apiURL, apiKey, library}) {
	const sruClient = createSruClient({serverUrl: sruURL, version: SRU_VERSION, maximumRecords: 1});
	const requestOptions = {
		headers: {
			Accept: 'application/json',
			Authorization: createAuthorizationHeader(apiKey)
		}
	};

	return {create, read, update};

	async function read(id) {
		return fetchRecord(id);
	}

	async function create({record, cataloger = DEFAULT_CATALOGER_ID}) {
		return loadRecord({record, cataloger});
	}

	async function update({record, id, cataloger = DEFAULT_CATALOGER_ID}) {
		const existingRecord = await fetchRecord(id);

		await validateRecordState(record, existingRecord);

		const f001 = record.get(/^001$/).shift();

		/* Replace the id in case the record has 001 with a different value than the id parameter */
		if (f001) {
			f001.value = id;
		}

		await loadRecord({record, cataloger, update: true});
	}

	async function fetchRecord(id) {
		return new Promise((resolve, reject) => {
			try {
				sruClient.searchRetrieve(`rec.id=${id}`)
					.on('record', record => {
						try {
							resolve(MARCXML.from(record));
						} catch (err) {
							reject(err);
						}
					})
					.on('end', () => {
						reject(new DatastoreError(HttpStatus.NOT_FOUND));
					})
					.on('error', err => {
						reject(err);
					});
			} catch (err) {
				reject(err);
			}
		});
	}

	async function loadRecord({record, cataloger, update = false}) {
		const url = new URL(apiURL);
		const formattedRecord = AlephSequential.to(record);

		url.searchParams.set('library', library);
		url.searchParams.set('method', update ? 'OLD' : 'NEW');
		url.searchParams.set('fixRoutine', FIX_ROUTINE);
		url.searchParams.set('updateAction', UPDATE_ACTION);
		url.searchParams.set('cataloger', cataloger);

		const response = await fetch(url, Object.assign({
			method: 'POST',
			body: formattedRecord
		}, requestOptions));

		if (response.status === HttpStatus.OK) {
			const idList = await response.json();
			return formatRecordId(idList.shift());
		}

		if (response.status === HttpStatus.INTERNAL_SERVER_ERROR) {
			const payload = await response.text();
			const errors = parseErrors(payload);
			throw new Error(`Unexpected response: ${errors.join()}`);
		}

		throw new Error(`Unexpected response: ${response.status}: ${await response.text()}`);

		function parseErrors(log) {
			let result;
			const errors = [];
			const re = /^\[error\] (.*)$/mg;

			while (result = re.exec(log)) { /* eslint-disable-line no-cond-assign */
				errors.push(result[1]);
			}

			return errors;
		}
	}

	function formatRecordId(id) {
		const pattern = new RegExp(`${library.toUpperCase()}$`);
		return id.replace(pattern, '');
	}

	// Checks that the modification history is identical
	function validateRecordState(incomingRecord, existingRecord) {
		const incomingModificationHistory = incomingRecord.get(/^CAT$/);
		const existingModificationHistory = existingRecord.get(/^CAT$/);

		if (JSON.stringify(incomingModificationHistory) !== JSON.stringify(existingModificationHistory)) {
			throw new DatastoreError(HttpStatus.CONFLICT);
		}
	}
}
