import axios from 'axios';
import {promisify} from 'es6-promisify';
import xml2js from 'xml2js';
import get from 'lodash/get';
import {ALEPH_URL, ALEPH_USER_LIBRARY} from '../config';

const parseXMLStringToJSON = promisify(xml2js.parseString);

export default (username, password) => {
	const requestUrl = `${ALEPH_URL}/X?op=user-auth&library=${ALEPH_USER_LIBRARY}&staff_user=${username}&staff_pass=${password}`;

	return axios(requestUrl)
		.then(response => response.data)
		.then(parseXMLStringToJSON)
		.then(json => {
			const credentialsValid = get(json, 'user-auth.reply[0]', false);

			if (credentialsValid) {
				const userLibrary = json['user-auth'].z66[0]['z66-user-library'][0];
				const name = json['user-auth'].z66[0]['z66-name'][0];
				const department = json['user-auth'].z66[0]['z66-department'][0];
				const email = json['user-auth'].z66[0]['z66-email'][0];
				return {userName: username, userLibrary, name, department, email, password};
			}
			return false;
		});
};
