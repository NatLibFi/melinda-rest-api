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

import {BasicStrategy} from 'passport-http';
import createAuthenticationService from './service';

export default class extends BasicStrategy {
	constructor({url, library}) {
		const AuthenticationService = createAuthenticationService({url, library});

		super(async (username, password, done) => {
			console.log('test');
			try {
				const user = await AuthenticationService.authenticate({username, password});
				done(user);
			} catch (err) {
				done(err);
			}
		});

		this.name = 'melinda';
	}
}
