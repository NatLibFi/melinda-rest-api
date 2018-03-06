/* eslint-disable import/prefer-default-export */

export const MIMETYPES_JSON = {
	'application/json': 'json',
	'application/vnd.marc-record-js': 'json'
};

export const MIMETYPES_TEXT = {
	'application/marc+xml': 'marcxml',
	'application/vnd.oai.marcxml': 'oai_marcmxl',
	'application/vnd.exlibris.alephsequential': 'alephsequential',
	'application/marc': 'iso2709'
};

export const MIMETYPES = Object.assign({}, MIMETYPES_JSON, MIMETYPES_TEXT);
