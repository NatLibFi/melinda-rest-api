/* eslint-disable no-undef, max-nested-callbacks, no-unused-expressions */

'use strict';

import path from 'path';
import chai, {expect} from 'chai';
import chaiHttp from 'chai-http';
import nock from 'nock';
import app from '../src/app';
import alephAuth from '../src/auth/aleph';

chai.use(chaiHttp);

describe('Authentication', () => {
	it('should respond 200', () => {
		const agent = chai.request.agent(app);

		nock('http://test-url.com')
			.get('/X?op=user-auth&library=test-lib&staff_user=username&staff_pass=password')
			.replyWithFile(200, path.resolve(__dirname, './data/auth_success.xml'));

		return agent.get('/')
			.auth('username', 'password')
			.then(res => {
				expect(res.status).to.equal(200);
			});
	});

	it('should respond 401', () => {
		const agent = chai.request.agent(app);

		nock('http://test-url.com')
			.get('/X?op=user-auth&library=test-lib&staff_user=username&staff_pass=password')
			.replyWithFile(200, path.resolve(__dirname, './data/auth_failure.xml'));

		return agent.get('/')
			.auth('username', 'password')
			.catch(err => {
				expect(err.status).to.equal(401);
			});
	});
});

describe('auth/aleph', () => {
	it('should respond with user details', () => {
		nock('http://test-url.com')
			.get('/X?op=user-auth&library=test-lib&staff_user=username&staff_pass=password')
			.replyWithFile(200, path.resolve(__dirname, './data/auth_success.xml'));

		return alephAuth('username', 'password')
			.then(result => {
				expect(result.userName).to.equal('username');
				expect(result.userLibrary).to.equal('ADMIN');
				expect(result.name).to.equal('test user');
				expect(result.department).to.equal('ALEPH');
				expect(result.email).to.equal('test@user.com');
			});
	});

	it('should respond with false', () => {
		nock('http://test-url.com')
			.get('/X?op=user-auth&library=test-lib&staff_user=username&staff_pass=password')
			.replyWithFile(200, path.resolve(__dirname, './data/auth_failure.xml'));

		return alephAuth('username', 'password')
			.then(result => {
				expect(result).to.false;
			});
	});
});
