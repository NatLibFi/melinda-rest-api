/* eslint-disable import/prefer-default-export */

export function readEnvironmentVariable(name, defaultValue, opts) {
	if (process.env[name] === undefined) {
		if (defaultValue === undefined) {
			const message = `Mandatory environment variable missing: ${name}`;
			console.log('error', message);
			throw new Error(message);
		}
		const loggedDefaultValue = opts.hideDefaultValue ? '[hidden]' : defaultValue;
		console.log('info', `No environment variable set for ${name}, using default value: ${loggedDefaultValue}`);
	}

	return process.env[name] || defaultValue;
}
