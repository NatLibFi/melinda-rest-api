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

'use strict';

import fs from 'fs';
import path from 'path';
import {expect} from 'chai';
import * as testContext from './similarity-service';
import {recordPair1} from './test-fixtures';

describe('services/record-matching/similarity-service', () => {
	const selectBetterPath = path.resolve(__dirname, './config/select-better-model.json');
	const duplicateModelPath = path.resolve(__dirname, './config/duplicate-detection-model.json');
	const selectBetterModel = JSON.parse(fs.readFileSync(selectBetterPath, 'utf8'));
	const duplicateDetectionModel = JSON.parse(fs.readFileSync(duplicateModelPath, 'utf8'));

	describe('factory', () => {
		it('Should create the expected object', () => {
			const service = testContext.default({selectBetterModel, duplicateDetectionModel});
			expect(service).to.be.an('object').and.respondTo('checkSimilarity');
		});

		describe('#checkSimilarity', () => {
			it('Should consider the records similar', () => {
				const service = testContext.default({selectBetterModel, duplicateDetectionModel});
				const results = service.checkSimilarity(recordPair1[0], recordPair1[1]);

				expect(results).to.eql({
					type: 'IS_DUPLICATE',
					numeric: 1,
					inputVector: [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
					hasNegativeFeatures: false
				});
			});
		});
	});
});
