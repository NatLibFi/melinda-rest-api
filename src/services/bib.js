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

import HttpStatus from 'http-status';
import ServiceError from './error';
import createConversionService, {ConversionError} from './conversion';
import createRecordMatchingService from './record-matching';
import createAuthorizationService, {AuthorizationError} from './own-authorization';
import createValidationService, {ValidationError} from './validation';
import createDatastoreService, {DatastoreError} from './datastore';

export {FORMATS} from './conversion';

export default async function ({sruURL, authorizationURL, authorizationApiKey, recordLoadURL, recordLoadLibrary, recordLoadApiKey}) {
	const sruUrlBib = `${sruURL}/bibprv`;
	const ConversionService 	= createConversionService();
	const RecordMatchingService = createRecordMatchingService({sruURL});
	const AuthorizationService = createAuthorizationService({sruURL, apiKey: authorizationApiKey, apiURL: authorizationURL});
	const ValidationService = await createValidationService();
	const DatastoreService = createDatastoreService({
		sruURL: sruUrlBib,
		apiURL: recordLoadURL,
		library: recordLoadLibrary,
		apiKey: recordLoadApiKey
	});

	return {read, create};
	// Return {read, create, update};

	async function read({id, format}) {
		try {
			const record = await DatastoreService.read(id);
			return ConversionService.serialize(record, format);
		} catch (err) {
			if (err instanceof DatastoreError) {
				throw new ServiceError(err.status);
			}

			throw err;
		}
	}

	async function create({data, format, cataloger, noop, unique}) {
		try {
			const record = ConversionService.unserialize(data, format);

			await AuthorizationService.check({cataloger, record});

			if (unique) {
				const idList = await RecordMatchingService.checkBib(record);

				if (idList.length > 0) {
					throw new ServiceError(HttpStatus.CONFLICT, idList);
				}
			}

			const validationResults = await ValidationService.validate(record);

			if (noop) {
				return {messages: validationResults};
			}

			const id = await DatastoreService.create({record, cataloger});

			return {messages: validationResults, id};
		} catch (err) {
			if (err instanceof ConversionError) {
				throw new ServiceError(err.status);
			} else if (err instanceof DatastoreError) {
				throw new ServiceError(err.status);
			} else if (err instanceof AuthorizationError) {
				throw new ServiceError(HttpStatus.FORBIDDEN);
			} else if (err instanceof ValidationError) {
				throw new ServiceError(HttpStatus.UNPROCESSABLE_ENTITY, err.messages);
			}

			throw err;
		}
	}

	/* Async function update({data, id, format, cataloger, noop}) {
		const record = ConversionService.unserialize(data, format);

		await OwnAuthorizationService.check({record, id, cataloger});

		const validationResults = await ValidationService.validate(record);

		if (noop) {
			return validationResults;
		}

		await DatastoreService.create(record, cataloger);

		return validationResults;
	} */
}
