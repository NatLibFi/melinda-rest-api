import zoom from 'node-zoom2';
import {readEnvironmentVariable} from './utils';

const DB_HOST = readEnvironmentVariable('DB_HOST');
const DB_NAME = readEnvironmentVariable('DB_NAME');

const connection = zoom.connection(`${DB_HOST}/${DB_NAME}`);

export default connection;
