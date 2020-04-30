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

import HttpStatus from 'http-status';
import {RecordMatching, Datastore, OwnAuthorization} from '@natlibfi/melinda-commons';

import createConversionService, {ConversionError} from './conversion';
import createValidationService, {ValidationError} from './validation';
import ServiceError from './error';
import {Utils} from '@natlibfi/melinda-commons';

export {FORMATS} from './conversion';

const {createLogger} = Utils;

export default async function ({sruURL, recordLoadURL, recordLoadApiKey, recordLoadLibrary}) {
	const {DatastoreError} = Datastore;
	const {OwnAuthorizationError} = OwnAuthorization;
	const Logger = createLogger();
	const ConversionService = createConversionService();
	const ValidationService = await createValidationService();

	const RecordMatchingService = RecordMatching.createBibService({sruURL});

	const DatastoreService = Datastore.createService({sruURL, recordLoadURL, recordLoadApiKey, recordLoadLibrary});

	return {read, create, update};

	async function read({id, format}) {
		try {
			Logger.log('debug', `Reading record ${id} from datastore`);
			const record = await DatastoreService.read(id);

			Logger.log('debug', `Serializing record ${id}`);
			return ConversionService.serialize(record, format);
		} catch (err) {
			if (err instanceof DatastoreError) {
				throw new ServiceError(err.status);
			}

			throw err;
		}
	}

	async function create({data, format, user, noop, unique}) {
		try {
			Logger.log('debug', 'Unserializing record');
			const record = ConversionService.unserialize(data, format);

			Logger.log('debug', 'Checking LOW-tag authorization');
			OwnAuthorization.validateChanges(user.authorization, record);

			if (unique) {
				Logger.log('debug', 'Attempting to find matching records in the datastore');
				const matchingIds = await RecordMatchingService.find(record);

				if (matchingIds.length > 0) {
					throw new ServiceError(HttpStatus.CONFLICT, matchingIds);
				}
			}

			Logger.log('debug', 'Validating the record');
			const validationResults = await ValidationService.validate(record);

			if (noop) {
				return {messages: validationResults};
			}

			Logger.log('debug', 'Creating a new record in datastore');
			const id = await DatastoreService.create({record, cataloger: user.id});

			Logger.log('debug', `Got id: ${id}`);

			return {messages: validationResults, id};
		} catch (err) {
			if (err instanceof ConversionError) {
				throw new ServiceError(HttpStatus.BAD_REQUEST);
			} else if (err instanceof OwnAuthorizationError) {
				throw new ServiceError(HttpStatus.FORBIDDEN);
			} else if (err instanceof DatastoreError) {
				throw new ServiceError(err.status);
			} else if (err instanceof ValidationError) {
				throw new ServiceError(HttpStatus.UNPROCESSABLE_ENTITY, err.messages);
			}

			throw err;
		}
	}

	async function update({id, data, format, user, noop}) {
		try {
			Logger.log('debug', 'Unserializing record');
			const record = ConversionService.unserialize(data, format);

			Logger.log('debug', `Reading record ${id} from datastore`);
			const existingRecord = await DatastoreService.read(id);

			Logger.log('debug', 'Checking LOW-tag authorization');
			OwnAuthorization.validateChanges(user.authorization, record, existingRecord);

			Logger.log('debug', 'Validating the record');
			const validationResults = await ValidationService.validate(record);

			if (noop) {
				return validationResults;
			}

			Logger.log('debug', `Updating record ${id} in datastore`);
			await DatastoreService.update({id, record, cataloger: user.id});

			return validationResults;
		} catch (err) {
			if (err instanceof ConversionError) {
				throw new ServiceError(HttpStatus.BAD_REQUEST);
			} else if (err instanceof OwnAuthorizationError) {
				throw new ServiceError(HttpStatus.FORBIDDEN);
			} else if (err instanceof DatastoreError) {
				throw new ServiceError(err.status);
			} else if (err instanceof ValidationError) {
				throw new ServiceError(HttpStatus.UNPROCESSABLE_ENTITY, err.messages);
			}

			throw err;
		}
	}
}
