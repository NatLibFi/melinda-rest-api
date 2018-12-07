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

import {readEnvironmentVariable, getApiVersion} from './utils';

export const HTTP_PORT = readEnvironmentVariable('HTTP_PORT', 8080);

//export const LIBRARY_BIB = readEnvironmentVariable('LIBRARY_BIB');
//export const LIBRARY_AUT_NAMES = readEnvironmentVariable('LIBRARY_AUT_NAMES');
//export const LIBRARY_AUT_SUBJECTS = readEnvironmentVariable('LIBRARY_AUT_SUBJECTS');

//export const ALEPH_OWN_AUTH_API_URL = readEnvironmentVariable('ALEPH_OWN_AUTH_API_URL');
//export const ALEPH_RECORD_LOADER_API_URL = readEnvironmentVariable('ALEPH_RECORD_LOAD_API_URL');

export const ALEPH_X_SERVICE_URL = readEnvironmentVariable('ALEPH_X_SERVICE_URL');
export const ALEPH_USER_LIBRARY = readEnvironmentVariable('ALEPH_USER_LIBRARY');

export const SWAGGER_UI_URL = `https://natlibfi.github.io/melinda-rest-api-doc?version=${getApiVersion()}`;
