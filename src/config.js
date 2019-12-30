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

import {Utils} from '@natlibfi/melinda-commons';

const {readEnvironmentVariable} = Utils;

export const HTTP_PORT = readEnvironmentVariable('HTTP_PORT', {defaultValue: '8080'});
export const ENABLE_PROXY = readEnvironmentVariable('ENABLE_PROXY', '');

// BIB-BULK
export const IP_FILTER_BIB_BULK = readEnvironmentVariable('IP_FILTER_BIB_BULK', '[".*"]');
export const TMP_FILE_LOCATION = readEnvironmentVariable('TMP_FILE_LOCATION', {defaultValue: 'dist/tmp/'});
export const TMP_FILE_MAX_SIZE = readEnvironmentVariable('TMP_FILE_MAX_SIZE', {defaultValue: (50 * 1024 * 1024), format: v => Number(v)}); // X * kb * mb
export const CHUNK_SIZE = readEnvironmentVariable('CHUNK_SIZE', {defaultValue: 50, format: v => Number(v)});

export const AMQP_URL = JSON.parse(readEnvironmentVariable('AMQP_URL'));

export const MONGO_URI = readEnvironmentVariable('MONGO_URI', {defaultValue: 'mongodb://localhost:27017/db'});
export const MONGO_POOLSIZE = readEnvironmentVariable('MONGO_POOLSIZE', {defaultValue: 200, format: v => Number(v)});
export const MONGO_DEBUG = readEnvironmentVariable('MONGO_DEBUG', {defaultValue: true});

// Same as in import -> Move to melinda-record-import-commons constants?
export const NAME_QUEUE_PRIORITY = 'PRIORITY';
export const NAME_QUEUE_BULK = 'BULK';
export const NAME_QUEUE_REPLY_BULK = 'REPLY_BULK';
export const NAME_QUEUE_REPLY_PRIO = 'REPLY_PRIO';

export const ALEPH_X_SVC_URL = readEnvironmentVariable('ALEPH_X_SVC_URL');
export const ALEPH_USER_LIBRARY = readEnvironmentVariable('ALEPH_USER_LIBRARY');

export const ALEPH_LIBRARY_BIB = readEnvironmentVariable('ALEPH_LIBRARY_BIB');

export const OWN_AUTHZ_URL = readEnvironmentVariable('OWN_AUTHZ_URL');
export const OWN_AUTHZ_API_KEY = readEnvironmentVariable('OWN_AUTHZ_API_KEY');

export const SRU_URL_BIB = readEnvironmentVariable('SRU_URL_BIB');

// About same as in import -> Move to melinda-record-import-commons constants?
export const BLOB_STATE = {
	IN_QUEUE: 'IN_QUEUE',
	CREATED: 'CREATED',
	UPDATED: 'UPDATED',
	ACTION_NEEDED: 'ACTION_NEEDED',
	ERROR: 'ERROR'
};

export const OPERATIONS = [
	'update',
	'create'
];
