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

import {DB_HOST, DB_NAME_AUT_NAMES, DB_NAME_AUT_SUBJECTS, REDIS_PREFIX} from '../config';
import * as recordService from './record';

const connectionNames = zoom.connection(`${DB_HOST}/${DB_NAME_AUT_NAMES}`).set('elementSetName', 'X');
const connectionSubjects = zoom.connection(`${DB_HOST}/${DB_NAME_AUT_SUBJECTS}`).set('elementSetName', 'X');

const redis = new IORedis({
	keyPrefix: REDIS_PREFIX ? REDIS_PREFIX + ':aut:' : 'aut:'
});

/**
 * @param {Object} options
 * @param {Boolean} options.noop Do not create the record but return the messages about the operation
 * @param {Boolean} options.unique Do not create the record if there are duplicates in the datastore
 * @throws {Error}
 * @return {Promise}
 */
export const postAutNamesRecords = async options => recordService.postRecords(connectionNames, options);

/**
 * @param {Object} options
 * @param {String} options.id The identifier of the record that&#x27;s going to be updated
 * @param {Boolean} options.noop Do not actually do the update but return the record in the format it would be uploaded
 * @param {Boolean} options.sync Synchronize changes between the incoming record and the record in the datastore
 * @throws {Error}
 * @return {Promise}
 */
export const postAutNamesRecordsById = async (body, options) => recordService.postRecordsById(connectionNames, redis, body, options);

/**
 * @param {Object} options
 * @throws {Error}
 * @return {Promise}
 */
export const getAutNamesRecordsById = async options => recordService.getRecordById(connectionNames, options);

/**
 * @param {Object} options
 * @throws {Error}
 * @return {Promise}
 */
export const postAutNamesRecordsByIdLock = async options => recordService.postRecordsByIdLock(connectionNames, redis, options);

/**
 * @param {Object} options
 * @throws {Error}
 * @return {Promise}
 */
export const deleteAutNamesRecordsByIdLock = async options => recordService.deleteRecordsByIdLock(connectionNames, redis, options);

/**
 * @param {Object} options
 * @throws {Error}
 * @return {Promise}
 */
export const getAutNamesRecordsByIdLock = async options => recordService.getRecordsByIdLock(connectionNames, redis, options);

/**
 * @param {Object} options
 * @param {Boolean} options.noop Do not create the record but return the messages about the operation
 * @param {Boolean} options.unique Do not create the record if there are duplicates in the datastore
 * @throws {Error}
 * @return {Promise}
 */
export const postAutSubjectsRecords = async options => recordService.postRecords(connectionSubjects, options);

/**
 * @param {Object} options
 * @param {String} options.id The identifier of the record that&#x27;s going to be updated
 * @param {Boolean} options.noop Do not actually do the update but return the record in the format it would be uploaded
 * @param {Boolean} options.sync Synchronize changes between the incoming record and the record in the datastore
 * @throws {Error}
 * @return {Promise}
 */
export const postAutSubjectsRecordsById = async (body, options) => recordService.postRecordsById(connectionSubjects, redis, body, options);

/**
 * @param {Object} options
 * @throws {Error}
 * @return {Promise}
 */
export const getAutSubjectsRecordsById = async options => recordService.getRecordById(connectionSubjects, options);

/**
 * @param {Object} options
 * @throws {Error}
 * @return {Promise}
 */
export const postAutSubjectsRecordsByIdLock = async options => recordService.postRecordsByIdLock(connectionSubjects, redis, options);

/**
 * @param {Object} options
 * @throws {Error}
 * @return {Promise}
 */
export const deleteAutSubjectsRecordsByIdLock = async options => recordService.deleteRecordsByIdLock(connectionSubjects, redis, options);

/**
 * @param {Object} options
 * @throws {Error}
 * @return {Promise}
 */
export const getAutSubjectsRecordsByIdLock = async options => recordService.getRecordsByIdLock(connectionSubjects, redis, options);

