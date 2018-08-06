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

import _ from 'lodash';
import {selectFirstValue, fieldHasSubfield} from './record-utils';

const sorterFunctions = [sortByTag, sortByLOW, sortBySID, sortByIndexterms, sortBy264, sortAlphabetically];

export default function fieldOrderComparator(fieldA, fieldB) {
	for (const sortFn of sorterFunctions) {
		const result = sortFn(fieldA, fieldB);

		if (result !== 0) {
			return result;
		}
	}

	return 0;
}

const sortIndex = {
	LDR: '000',
	STA: '0091',
	LOW: '9991',
	SID: '9992',
	CAT: '9993',
	HLI: '9994'
};

const anySelector = {
	equals: () => true
};

function getSortIndex(tag) {
	if (isNaN(tag)) {
		return _.get(sortIndex, tag, '9999');
	}
	return tag;
}

function sortByTag(fieldA, fieldB) {
	const orderA = getSortIndex(fieldA.tag);
	const orderB = getSortIndex(fieldB.tag);

	if (orderA > orderB) {
		return 1;
	}
	if (orderA < orderB) {
		return -1;
	}

	return 0;
}

function sortByLOW(fieldA, fieldB) {
	if (fieldA.tag === 'LOW' && fieldB.tag === 'LOW') {
		const lowA = _.lowerCase(selectFirstValue(fieldA, 'a'));
		const lowB = _.lowerCase(selectFirstValue(fieldB, 'a'));
		if (lowA > lowB) {
			return 1;
		}
		if (lowA < lowB) {
			return -1;
		}
	}
	return 0;
}

function sortBySID(fieldA, fieldB) {
	if (fieldA.tag === 'SID' && fieldB.tag === 'SID') {
		const sidA = _.lowerCase(selectFirstValue(fieldA, 'b'));
		const sidB = _.lowerCase(selectFirstValue(fieldB, 'b'));
		if (sidA > sidB) {
			return 1;
		}
		if (sidA < sidB) {
			return -1;
		}
	}
	return 0;
}

const dictionarySortIndex = {
	ysa: '0',
	allars: '1',
	musa: '2',
	cilla: '3',
	kaunokki: '4',
	bella: '5'
};

function sortByIndexterms(fieldA, fieldB) { // eslint-disable-line complexity
	const indexTermFields = [
		'600',
		'610',
		'611',
		'630',
		'648',
		'650',
		'651',
		'652',
		'653',
		'654',
		'655',
		'656',
		'657',
		'658',
		'659',
		'662'
	];

	if (fieldA.tag === fieldB.tag && _.includes(indexTermFields, fieldA.tag)) {
		if (fieldA.ind2 > fieldB.ind2) {
			return 1;
		}
		if (fieldA.ind2 < fieldB.ind2) {
			return -1;
		}

		const dictionaryA = selectFirstValue(fieldA, '2');
		const dictionaryB = selectFirstValue(fieldB, '2');

		const orderByDictionaryA = _.get(dictionarySortIndex, dictionaryA, dictionaryA);
		const orderByDictionaryB = _.get(dictionarySortIndex, dictionaryB, dictionaryB);

		if (orderByDictionaryA > orderByDictionaryB) {
			return 1;
		}
		if (orderByDictionaryA < orderByDictionaryB) {
			return -1;
		}

		const fenniKeepSelector = fieldHasSubfield('9', 'FENNI<KEEP>');
		const fenniDropSelector = fieldHasSubfield('9', 'FENNI<DROP>');
		const hasFENNI9A = fenniKeepSelector(fieldA) || fenniDropSelector(fieldA);
		const hasFENNI9B = fenniKeepSelector(fieldB) || fenniDropSelector(fieldA);

		if (hasFENNI9A && !hasFENNI9B) {
			return -1;
		}
		if (!hasFENNI9A && hasFENNI9B) {
			return 1;
		}

		const valueA = _.lowerCase(selectFirstValue(fieldA, 'a'));
		const valueB = _.lowerCase(selectFirstValue(fieldB, 'a'));

		if (valueA > valueB) {
			return 1;
		}
		if (valueA < valueB) {
			return -1;
		}

		const valueAX = _.lowerCase(selectFirstValue(fieldA, 'x'));
		const valueBX = _.lowerCase(selectFirstValue(fieldB, 'x'));

		if (valueBX === undefined || valueAX > valueBX) {
			return 1;
		}
		if (valueAX < valueBX) {
			return -1;
		}

		const valueAZ = _.lowerCase(selectFirstValue(fieldA, 'z'));
		const valueBZ = _.lowerCase(selectFirstValue(fieldB, 'z'));

		if (valueBZ === undefined || valueAZ > valueBZ) {
			return 1;
		}
		if (valueAZ < valueBZ) {
			return -1;
		}

		const valueAY = _.lowerCase(selectFirstValue(fieldA, 'y'));
		const valueBY = _.lowerCase(selectFirstValue(fieldB, 'y'));

		if (valueBY === undefined || valueAY > valueBY) {
			return 1;
		}
		if (valueAY < valueBY) {
			return -1;
		}
	}
	return 0;
}

function sortBy264(fieldA, fieldB) { // eslint-disable-line complexity
	if (fieldA.tag === '264' && fieldB.tag === '264') {
		if (fieldA.ind2 > fieldB.ind2) {
			return 1;
		}
		if (fieldA.ind2 < fieldB.ind2) {
			return -1;
		}

		if (fieldA.ind1 > fieldB.ind1) {
			return 1;
		}
		if (fieldA.ind1 < fieldB.ind1) {
			return -1;
		}

		const value3A = _.lowerCase(selectFirstValue(fieldA, '3'));
		const value3B = _.lowerCase(selectFirstValue(fieldB, '3'));

		if (value3A === undefined || value3A < value3B) {
			return -1;
		}
		if (value3B === undefined || value3A > value3B) {
			return 1;
		}

		const valueCA = _.lowerCase(selectFirstValue(fieldA, 'c'));
		const valueCB = _.lowerCase(selectFirstValue(fieldB, 'c'));

		if (valueCA === undefined || valueCA < valueCB) {
			return -1;
		}
		if (valueCB === undefined || valueCA > valueCB) {
			return 1;
		}

		const valueAA = _.lowerCase(selectFirstValue(fieldA, 'a'));
		const valueAB = _.lowerCase(selectFirstValue(fieldB, 'a'));

		if (valueAA === undefined || valueAA < valueAB) {
			return -1;
		}
		if (valueAB === undefined || valueAA > valueAB) {
			return 1;
		}

		const valueBA = _.lowerCase(selectFirstValue(fieldA, 'b'));
		const valueBB = _.lowerCase(selectFirstValue(fieldB, 'b'));

		if (valueBA === undefined || valueBA < valueBB) {
			return -1;
		}
		if (valueBB === undefined || valueBA > valueBB) {
			return 1;
		}
	}
	return 0;
}

function sortAlphabetically(fieldA, fieldB) {
	if (fieldA.tag === fieldB.tag) {
		const valueA = _.lowerCase(selectFirstValue(fieldA, anySelector));
		const valueB = _.lowerCase(selectFirstValue(fieldB, anySelector));

		if (valueA > valueB) {
			return 1;
		}
		if (valueA < valueB) {
			return -1;
		}
	}
	return 0;
}
