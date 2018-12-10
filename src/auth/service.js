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
import fetch from 'node-fetch';
import {URL} from 'url';
import {DOMParser} from 'xmldom';

export class AuthenticationError extends Error {}

export default ({url, library}) => {
	const baseURL = new URL(url);

	baseURL.searchParams.set('op', 'user-auth');
	baseURL.searchParams.set('library', library);

	return {authenticate};

	async function authenticate({username, password}) {
		const requestURL = new URL(baseURL);

		requestURL.searchParams.set('staff_user', username);
		requestURL.searchParams.set('staff_pass', password);

		const response = await fetch(requestURL);
		const body = await response.text();

		if (response.status === HttpStatus.OK) {
			const doc = new DOMParser().parseFromString(body);
			checkForErrors(doc);
			return parseUserInfo(doc);
		}

		throw new Error(body);

		function checkForErrors(doc) {
			if (invalidReply() || hasErrors()) {
				throw new AuthenticationError(body);
			}

			function invalidReply() {
				const nodeList = doc.getElementsByTagName('reply');
				return nodeList.length === 0 || (nodeList.length > 0 && nodeList.item(0).textContent !== 'ok');
			}

			function hasErrors() {
				return doc.getElementsByTagName('error').length > 0;
			}
		}

		/* Returns contact schema compliant profile: https://tools.ietf.org/html/draft-smarr-vcarddav-portable-contacts-00 */
		function parseUserInfo(doc) {
			const data = {id: username};
			const nodeList = doc.getElementsByTagName('z66').item(0).childNodes;

			for (let i = 0; i < nodeList.length; i++) {
				const node = nodeList.item(i);

				switch (node.nodeName) {
					case 'z66-email':
						data.emails = [{value: node.textContent, type: 'work'}];
						break;
					case 'z66-name':
						data.displayName = node.textContent;
						data.name = parseName(node.textContent);
						break;
					case 'z66-department':
						data.organization = [{name: node.textContent}];
						break;
					default:
						break;
				}
			}

			return data;

			function parseName(value) {
				const parts = value.split(/ /);
				const obj = {
					givenName: parts.shift(),
					familyName: parts.pop()
				};

				if (parts.length > 0) {
					obj.middleName = parts.join(' ');
				}

				return obj;
			}
		}
	}
};
