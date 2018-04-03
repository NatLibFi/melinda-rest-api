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

import zoom from 'node-zoom2';
import IORedis from 'ioredis';
import {DB_HOST, DB_NAME_BIB, REDIS_PREFIX} from '../config';
import * as recordService from './record';

const connection = zoom.connection(`${DB_HOST}/${DB_NAME_BIB}`).set('elementSetName', 'X');

const redis = new IORedis({
	keyPrefix: REDIS_PREFIX ? REDIS_PREFIX + ':bib:' : 'bib:'
});

/**
 * @param {Object} options
 * @param {Boolean} options.noop Do not create the record but return the messages about the operation
 * @param {Boolean} options.unique Do not create the record if there are duplicates in the datastore
 * @param {Boolean} options.ownerAuthorization Require the credentials to have authority to change owner metadata
 * @throws {Error}
 * @return {Promise}
 */
export const postBibRecords = async options => recordService.postRecords(connection, options);

/**
 * @param {String} body The body of record to be updated
 * @param {Object} options
 * @param {String} options.recordId The identifier of the record that's going to be updated
 * @param {String} options.format Format used to serialize and unserialize record
 * @param {Boolean} options.noop Do not actually do the update but return the record in the format it would be uploaded
 * @param {Boolean} options.sync Synchronize changes between the incoming record and the record in the datastore
 * @param {Boolean} options.ownerAuthorization Require the credentials to have authority to change owner metadata
 * @throws {Error}
 * @return {Promise}
 */
export const postBibRecordsById = async (body, options) => recordService.postRecordsById(connection, redis, body, options);

/**
 * @param {Object} options
 * @throws {Error}
 * @return {Promise}
 */
export const getBibRecordById = async options => recordService.getRecordById(connection, options);

/**
 * @param {Object} options
 * @throws {Error}
 * @return {Promise}
 */
export const postBibRecordsByIdLock = async options => recordService.postRecordsByIdLock(connection, redis, options);

/**
 * @param {Object} options
 * @throws {Error}
 * @return {Promise}
 */
export const deleteBibRecordsByIdLock = async options => recordService.deleteRecordsByIdLock(connection, redis, options);

/**
 * @param {Object} options
 * @throws {Error}
 * @return {Promise}
 */
export const getBibRecordsByIdLock = async options => recordService.getRecordsByIdLock(connection, redis, options);
