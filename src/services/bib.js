/* eslint-disable no-unused-vars, valid-jsdoc */

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
import createConversionService from './conversion';
import createOwnAuthorizationService from './own-authorization';
import createRecordMatchingService from './record-matching';
import createValidationService from './validation';
import createDatastoreService from './datastore';

export default function({sruURL, ownAuthorizationURL, recordLoadURL}) {
	const ConversionService = createConversionService();
	const OwnAuthorizationService = createOwnAuthorizationService({apiURL: ownAuthorizationURL});
	const RecordMatchingService = createRecordMatchingService({sruURL});
	const ValidationService = createValidationService();
	const DatastoreService = createDatastoreService({sruURL, recordLoadURL});

	return { read, create, update };
	
	async function read({id, format}) {
		const record = await DatastoreService.read(id);
		return ConversionService.serialize(record, format);
	}
	
	async function create({data, format, credentials, noop, unique}) {
		const record = ConversionService.unserialize(data, format);
		
		await OwnAuthorizationService.check(record, credentials);
		
		if (unique) {
			await RecordMatchingService.check(record);
		}
		
		const validationResults = await ValidationService.validate(record);
		
		if (noop) {
			return [validationResults];
		}
		
		const id = await DatastoreService.create(record, credentials);
		
		return [validationResults, id]
	}
	
	async function update({data, id, format, credentials, noop}) {
		const record = ConversionService.unserialize(data, format);
		
		await OwnAuthorizationService.check(record, credentials);
		
		const validationResults = await ValidationService.validate(record);
		
		if (noop) {
			return validationResults;
		}
		
		const id = await DatastoreService.create(record, credentials);
		
		return validationResults
	}
}