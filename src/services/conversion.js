/* eslint-disable no-unused-vars, valid-jsdoc, import/default */

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

import {MarcRecord} from '@natlibfi/marc-record';
import {MARCXML, ISO2709, Json} from '@natlibfi/marc-record-serializers';

export const FORMATS = {
	MARCXML: 0,
	ISO2709: 2,
	JSON: 3
};

export class ConversionError extends Error {}

export default function () {
	return {serialize, unserialize};

	function serialize(record, format) {
		switch (format) {
			case FORMATS.MARCXML:
				return MARCXML.to(record);
			case FORMATS.ISO2709:
				return ISO2709.to(record);
			case FORMATS.JSON:
				return Json.to(record);
			default:
				throw new ConversionError();
		}
	}

	function unserialize(data, format) {
		switch (format) {
			case FORMATS.MARCXML:
				return MARCXML.from(data);
			case FORMATS.ISO2709:
				return ISO2709.from(data);
			case FORMATS.JSON:
				return Json.from(data);
			default:
				throw new ConversionError();
		}
	}
}
