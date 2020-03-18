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

import {Router} from 'express';
import passport from 'passport';
import HttpStatus from 'http-status';
import {Error as ApiError, Utils} from '@natlibfi/melinda-commons';
import createService, {FORMATS} from '../services/bib';

import {
  SRU_URL_BIB, ALEPH_LIBRARY_BIB,
  RECORD_LOAD_URL, RECORD_LOAD_API_KEY
} from '../config';

export default async () => {
  const {parseBoolean} = Utils;
  const CONTENT_TYPES = {
    'application/json': FORMATS.JSON,
    'application/marc': FORMATS.ISO2709,
    'application/xml': FORMATS.MARCXML
  };

  const Service = await createService({
    sruURL: SRU_URL_BIB,
    recordLoadURL: RECORD_LOAD_URL,
    recordLoadApiKey: RECORD_LOAD_API_KEY,
    recordLoadLibrary: ALEPH_LIBRARY_BIB
  });

  return new Router()
    .use(passport.authenticate('melinda', {session: false}))
    .post('/', createResource)
    .get('/:id', readResource)
    .post('/:id', updateResource)
    .use((err, req, res, next) => {
      if (err instanceof ApiError) {
        res.status(err.status).send(err.payload);
        return;
      }

      return next(err);
    });

  // Read resource
  async function readResource(req, res, next) {
    try {
      const type = req.accepts(Object.keys(CONTENT_TYPES));

      if (type) {
        const format = CONTENT_TYPES[type];
        const record = await Service.read({id: req.params.id, format});
        res.type(type).status(HttpStatus.OK)
          .send(record);
        return;
      }

      res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
    } catch (err) {
      return next(err);
    }
  }

  // Create resource
  async function createResource(req, res, next) {
    try {
      const type = req.headers['content-type'];
      const format = CONTENT_TYPES[type];

      if (!format) {
        return res.sendStatus(HttpStatus.UNSUPPORTED_MEDIA_TYPE);
      }

      const unique = req.query.unique === undefined ? true : parseBoolean(req.query.unique);
      const noop = parseBoolean(req.query.noop);
      const {messages, id} = await Service.create({
        format, unique, noop,
        data: req.body,
        user: req.user
      });

      if (!noop) {
        res.status(HttpStatus.CREATED).set('Record-ID', id);
        return;
      }

      res.type('application/json').send(messages);
    } catch (err) {
      return next(err);
    }
  }

  // Update resource
  async function updateResource(req, res, next) {
    try {
      const type = req.headers['content-type'];
      const format = CONTENT_TYPES[type];

      if (!format) {
        return res.sendStatus(HttpStatus.UNSUPPORTED_MEDIA_TYPE);
      }

      const noop = parseBoolean(req.query.noop);
      const {failed, messages} = await Service.update({
        format, noop,
        data: req.body,
        id: req.params.id,
        user: req.user
      });

      if (failed) {
        return res.status(HttpStatus.UNPROCESSABLE_ENTITY)
          .type('application/json')
          .send(messages);
      }

      return res.sendStatus(HttpStatus.OK);
    } catch (err) {
      return next(err);
    }
  }
};
