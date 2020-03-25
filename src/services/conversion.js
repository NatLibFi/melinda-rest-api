/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* RESTful API for Melinda
*
* Copyright (C) 2018-2019 University Of Helsinki (The National Library Of Finland)
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

import {MARCXML, ISO2709, Json} from '@natlibfi/marc-record-serializers';
import {Error as ConversionError} from '@natlibfi/melinda-commons';
import HttpStatus from 'http-status';

export const FORMATS = {
  MARCXML: 1,
  ISO2709: 2,
  JSON: 3
};

export default function () {
  return {serialize, unserialize};

  function serialize(record, format) {
    if (format === FORMATS.MARCXML) {
      return MARCXML.to(record);
    }

    if (format === FORMATS.ISO2709) {
      return ISO2709.to(record);
    }

    if (format === FORMATS.JSON) {
      return Json.to(record);
    }

    throw new ConversionError(HttpStatus.UNSUPPORTED_MEDIA_TYPE);
  }

  function unserialize(data, format) {
    try {

      if (format === FORMATS.MARCXML) {
        return MARCXML.from(data);
      }

      if (format === FORMATS.ISO2709) {
        return ISO2709.from(data);
      }

      if (format === FORMATS.JSON) {
        return Json.from(data);
      }

      throw new ConversionError(HttpStatus.UNSUPPORTED_MEDIA_TYPE);
    } catch (err) {
      throw new ConversionError(HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }
}
