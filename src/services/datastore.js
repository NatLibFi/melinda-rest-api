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

import HttpStatus from 'http-status';
import fetch from 'node-fetch';
import {URLSearchParams} from 'url';
import createSruClient from '@natlibfi/sru-client';
import {MARCXML, AlephSequential} from '@natlibfi/marc-record-serializers';
import {createLogger, createAuthorizationHeader} from '../utils';

const FIX_ROUTINE = 'GEN01';
const UPDATE_ACTION = 'REP';
const SRU_VERSION = '2.0';
const DEFAULT_CATALOGER_ID = 'API';

export class DatastoreError extends Error {
	constructor(error, ...params) {
		super(params);
		this.error = error || HttpStatus.INTERNAL_SERVER_ERROR;
	}
}

export default function ({sruURL, apiURL, apiKey, library}) {
	const Logger = createLogger();
	const sruClient = createSruClient({serverUrl: sruURL, version: SRU_VERSION, maximumRecords: 1});

	return {create, read, update};

	async function read(id) {
		try {
			return await fetchRecord(id);
		} catch (err) {
			handleError(err);
		}
	}

	async function create({record, cataloger = DEFAULT_CATALOGER_ID}) {
		try {
			return await loadRecord({record, cataloger});
		} catch (err) {
			handleError(err);
		}
	}

	async function update({record, id, cataloger = DEFAULT_CATALOGER_ID}) {
		try {
			const existingRecord = await fetchRecord(id);

			await validateRecordState(record, existingRecord);
			await loadRecord({record, id, cataloger});
		} catch (err) {
			handleError(err);
		}
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

	async function loadRecord({record, id, cataloger}) {
		let formattedRecord;

		try {
			formattedRecord = AlephSequential.to(record);
		} catch (err) {
			throw new DatastoreError(HttpStatus.BAD_REQUEST);
		}

		const parameters = new URLSearchParams({
			library: library,
			method: id === undefined ? 'NEW' : 'OLD',
			fixRoutine: FIX_ROUTINE,
			updateAction: UPDATE_ACTION,
			cataloger
		});

		const response = await fetch(`${apiURL}?${parameters.toString()}`, {
			method: 'POST',
			body: formattedRecord,
			headers: {
				Accept: 'application/json',
				Authorization: createAuthorizationHeader({username: apiKey, password: ''})
			}
		});

		if (response.status === HttpStatus.OK) {
			const idList = await response.json();
			return idList.shift();
		}

		throw new Error(`Unexpected response: ${response.status} ${response.statusText}`);
	}

	// Checks that the modification history is identical
	function validateRecordState(incomingRecord, existingRecord) {
		const incomingModificationHistory = incomingRecord.get(/^CAT$/);
		const existingModificationHistory = existingRecord.get(/^CAT$/);

		if (JSON.stringify(incomingModificationHistory) !== JSON.stringify(existingModificationHistory)) {
			throw new DatastoreError(HttpStatus.CONFLICT);
		}
	}

	function handleError(err) {
		if (err instanceof DatastoreError) {
			throw err;
		}

		Logger.log('error', err.stack);
		throw new DatastoreError(HttpStatus.INTERNAL_SERVER_ERROR);
	}
}
