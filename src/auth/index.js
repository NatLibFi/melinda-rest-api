import passport from 'passport';
import {BasicStrategy} from 'passport-http';
import axios from 'axios';
import {promisify} from 'es6-promisify';
import xml2js from 'xml2js';
import {readEnvironmentVariable} from '../utils';

const parseXMLStringToJSON = promisify(xml2js.parseString);

const alephUrl = readEnvironmentVariable('ALEPH_URL');
const alephUserLibrary = readEnvironmentVariable('ALEPH_USER_LIBRARY');

export default () => {
	passport.serializeUser((user, done) => {
		done(null, user);
	});

	passport.deserializeUser((user, done) => {
		done(null, user);
	});

	passport.use(new BasicStrategy(async (username, password, done) => {
		const requestUrl = `${alephUrl}/X?op=user-auth&library=${alephUserLibrary}&staff_user=${username}&staff_pass=${password}`;

		axios(requestUrl)
			.then(response => response.data)
			.then(parseXMLStringToJSON)
			.then(json => {
				const credentialsValid = json['user-auth'].reply[0];

				if (credentialsValid) {
					const userLibrary = json['user-auth'].z66[0]['z66-user-library'][0];
					const name = json['user-auth'].z66[0]['z66-name'][0];
					const department = json['user-auth'].z66[0]['z66-department'][0];
					const email = json['user-auth'].z66[0]['z66-email'][0];
					done(null, {username, userLibrary, name, department, email});
				} else {
					done(null, false);
				}
			})
			.catch(err => done(err));
	}));
};

