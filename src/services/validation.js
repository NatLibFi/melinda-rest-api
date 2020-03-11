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

/* eslint-disable new-cap */
import validateFactory from '@natlibfi/marc-record-validate';
import {
	FieldExclusion
} from '@natlibfi/marc-record-validators-melinda';

export class ValidationError extends Error {
	constructor(messages, ...params) {
		super(params);
		this.messages = messages;
	}
}

export default async () => {
	const validate = validateFactory([
		await FieldExclusion([
			{tag: /^003$/, value: /^(.(?<!FI-MELINDA))*?$/}
		])
	]);

	return async record => {
		const results = await validate(record, {fix: true, validateFixes: true});

		if (results.valid) {
			return {
				record: results.record,
				failed: results.valid === false,
				messages: results.report
			};
		}

		throw new ValidationError(results.report);
	};
};
