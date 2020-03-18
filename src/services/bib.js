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
import {RecordMatching, Datastore, OwnAuthorization, Utils, Error as ApiError} from '@natlibfi/melinda-commons';
import createConversionService from './conversion';
import createValidationService from './validation';
import {formatRecord, BIB_FORMAT_SETTINGS} from './format';

export {FORMATS} from './conversion';

const {createLogger} = Utils;

export default async function ({sruURL, recordLoadURL, recordLoadApiKey, recordLoadLibrary}) {
  const {DatastoreError} = Datastore;
  const logger = createLogger();
  const conversionService = createConversionService();
  const validationService = await createValidationService();

  const RecordMatchingService = RecordMatching.createBibService({sruURL});

  const DatastoreService = Datastore.createService({sruURL, recordLoadURL, recordLoadApiKey, recordLoadLibrary});

  return {read, create, update};

  async function read({id, format}) {
    logger.log('debug', `Reading record ${id} from datastore`);
    const record = await DatastoreService.read(id);

    logger.log('debug', `Serializing record ${id}`);
    return conversionService.serialize(record, format);
  }

  async function create({data, format, user, noop, unique}) {
    try {
      logger.log('debug', 'Unserializing record');
      const record = formatRecord(conversionService.unserialize(data, format), BIB_FORMAT_SETTINGS);

      logger.log('debug', 'Checking LOW-tag authorization');
      OwnAuthorization.validateChanges(user.authorization, record);

      if (unique) {
        logger.log('debug', 'Attempting to find matching records in the datastore');
        const matchingIds = await RecordMatchingService.find(record);

        if (matchingIds.length > 0) { // eslint-disable-line functional/no-conditional-statement
          throw new ApiError(HttpStatus.CONFLICT, matchingIds);
        }
      }

      logger.log('debug', 'Validating the record');
      const validationResults = await validationService(record);

      if (noop) {
        return validationResults;
      }

      if (validationResults.valid) {
        logger.log('debug', 'Creating a new record in datastore');
        const id = await DatastoreService.create({record: validationResults.record, cataloger: user.id});

        return {messages: validationResults.messages, id};
      }

      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, validationResults.messages);
    } catch (err) {
      if (err instanceof ApiError || err instanceof DatastoreError) { // eslint-disable-line functional/no-conditional-statement
        if (err.status === 403) { // eslint-disable-line functional/no-conditional-statement
          throw new ApiError(HttpStatus.FORBIDDEN); // Own auth forbidden
        }

        throw new ApiError(err.status);
      }

      throw err;
    }
  }

  async function update({id, data, format, user, noop}) {
    try {
      logger.log('debug', 'Unserializing record');
      const record = formatRecord(conversionService.unserialize(data, format), BIB_FORMAT_SETTINGS);

      logger.log('debug', `Reading record ${id} from datastore`);
      const existingRecord = await DatastoreService.read(id);

      logger.log('debug', 'Checking LOW-tag authorization');
      OwnAuthorization.validateChanges(user.authorization, record, existingRecord);

      logger.log('debug', 'Validating the record');
      const validationResults = await validationService(record);

      if (noop) {
        return validationResults;
      }

      if (validationResults.failed) {
        return validationResults;
      }

      logger.log('debug', `Updating record ${id} in datastore`);
      await DatastoreService.update({id, record: validationResults.record, cataloger: user.id});

      return validationResults;
    } catch (err) {
      if (err instanceof ApiError || err instanceof DatastoreError) { // eslint-disable-line functional/no-conditional-statement
        if (err.status === 403) { // eslint-disable-line functional/no-conditional-statement
          throw new ApiError(HttpStatus.FORBIDDEN); // Own auth forbidden
        }

        throw new ApiError(err.status);
      }

      throw err;
    }
  }
}
