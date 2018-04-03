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
import {readEnvironmentVariable} from '../utils';
import * as recordService from './record';

const DB_HOST = readEnvironmentVariable('DB_HOST');
const DB_NAME = readEnvironmentVariable('DB_NAME_BIB');

const connection = zoom.connection(`${DB_HOST}/${DB_NAME}`).set('elementSetName', 'X');

const redisPrefix = readEnvironmentVariable('REDIS_PREFIX', 'melinda-rest-api', false);

const redis = new IORedis({
	keyPrefix: redisPrefix ? redisPrefix + ':bib:' : 'bib:'
});

export const postBibRecords = async options => recordService.postRecords(connection, options);
export const postBibRecordsById = async (body, options) => recordService.postRecordsById(connection, redis, body, options);
export const getBibRecordById = async options => recordService.getRecordById(connection, options);
export const postBibRecordsByIdLock = async options => recordService.postRecordsByIdLock(connection, redis, options);
export const deleteBibRecordsByIdLock = async options => recordService.deleteRecordsByIdLock(connection, redis, options);
export const getBibRecordsByIdLock = async options => recordService.getRecordsByIdLock(connection, redis, options);
