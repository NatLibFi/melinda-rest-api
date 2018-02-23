import passport from 'passport';
import {BasicStrategy} from 'passport-http';
import alephAuth from './aleph';

export default () => {
	passport.serializeUser((user, done) => {
		done(null, user);
	});

	passport.deserializeUser((user, done) => {
		done(null, user);
	});

	passport.use(new BasicStrategy((username, password, done) => {
		alephAuth(username, password)
			.then(response => done(null, response))
			.catch(err => {
				console.error(err);
				done(err);
			});
	}));
};

