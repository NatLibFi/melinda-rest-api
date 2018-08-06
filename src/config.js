import {readEnvironmentVariable} from './utils';

export const LOCK_DURATION = readEnvironmentVariable('LOCK_DURATION', 3600, false);

export const DB_HOST = readEnvironmentVariable('DB_HOST');
export const DB_NAME_BIB = readEnvironmentVariable('DB_NAME_BIB');
export const DB_NAME_AUT_NAMES = readEnvironmentVariable('DB_NAME_AUT_NAMES');
export const DB_NAME_AUT_SUBJECTS = readEnvironmentVariable('DB_NAME_AUT_SUBJECTS');

export const REDIS_PREFIX = readEnvironmentVariable('REDIS_PREFIX', 'melinda-rest-api', false);

export const ALEPH_URL = readEnvironmentVariable('ALEPH_URL');
export const ALEPH_USER_LIBRARY = readEnvironmentVariable('ALEPH_USER_LIBRARY');
