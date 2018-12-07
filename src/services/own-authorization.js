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
import createSruClient from '@natlibfi/sru-client';
import {MARCXML} from '@natlibfi/marc-record-serializers';
import {createAuthorizationHeader} from '../utils';

export const SRU_VERSION = '2.0';

export class AuthorizationError extends Error {
	constructor(error, ...params) {
		super(params);
		this.error = error || HttpStatus.INTERNAL_SERVER_ERROR;
	}
}

export default function ({sruURL, apiURL, apiKey}) {
	const sruClient = createSruClient({serverUrl: sruURL, version: SRU_VERSION, maximumRecords: 1});
	const requestOptions = {
		headers: {
			Accept: 'application/json',
			Authorization: createAuthorizationHeader(apiKey)
		}
	};

	return {check};

	async function check({record, id, cataloger}) {
		const permissions = await getPermissions(cataloger);

		if (record) {
			if (id) {
				const existingRecord = await fetchRecord(id);
				await validateOwnModifications(permissions, record, existingRecord);
			} else {
				await validateOwnModifications(permissions, record);
			}
		}
	}

	async function getPermissions(cataloger) {
		const url = new URL(apiURL);
		url.searchParams.set('username', cataloger);

		const response = await fetch(url, requestOptions);

		if (response.status === HttpStatus.OK) {
			return response.json();
		}

		throw new Error(`Unexpected response: ${response.status} ${response.statusText}`);
	}

	function validateOwnModifications(ownTags, incomingRecord, existingRecord) {
		const lowTags = getLowTags();

		if (lowTags.some(t => !ownTags.includes(t))) {
			throw new AuthorizationError(HttpStatus.FORBIDDEN);
		}

		function getLowTags() {
			if (existingRecord) {
				// Add tags which are not present in the new (Removal requires permission too)
				return get(existingRecord).reduce((acc, v) => {
					return acc.includes(v) ? acc : acc.concat(v);
				}, get(incomingRecord));
			}

			return get(incomingRecord);

			// Get unique tags
			function get(record) {
				return record.get(/^LOW$/)
					.map(f => f.subfields.find(sf => sf.code === 'a').value)
					.reduce((acc, v) => {
						return acc.includes(v) ? acc : acc.concat(v);
					}, []);
			}
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
						reject(new AuthorizationError(HttpStatus.NOT_FOUND));
					})
					.on('error', err => {
						reject(err);
					});
			} catch (err) {
				reject(err);
			}
		});
	}
}
