/* eslint-disable no-unused-vars */

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

// import validateFactory from '@natlibfi/marc-record-validate';
// Import {} from '@natlibfi/marc-record-validators-melinda';

export class ValidationError extends Error {
	/* istanbul ignore next: Actual validation is currently not in use */
	constructor(messages, ...params) {
		super(params);
		this.messages = messages;
	}
}

export default async function () {
//	Const validateFunc = await validateFactory([]);

	return {validate};

	async function validate(record) {
		return [];
		/* Const results = await validateFunc(record, {fix: true, validateFixes: true});

		if (results.valid) {
			return results.messages;
		}

		throw new ValidationError(results.messages);
		*/
	}
}
