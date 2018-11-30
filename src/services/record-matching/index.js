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

/* eslint-disable require-await */

import fs from 'fs';
import path from 'path';
import {MarcRecord} from '@natlibfi/marc-record';
import createCandidateService from './candidate-service';
import createSimilarityService from './similarity-service';

MarcRecord.setValidationOptions({subfieldValues: false});

const selectBetterPath = path.resolve(__dirname, './config/select-better-model.json');
const duplicateModelPath = path.resolve(__dirname, './config/duplicate-detection-model.json');
const selectBetterModel = JSON.parse(fs.readFileSync(selectBetterPath, 'utf8'));
const duplicateDetectionModel = JSON.parse(fs.readFileSync(duplicateModelPath, 'utf8'));

export default function ({sruURL}) {
	const CandidateService = createCandidateService({sruURL});
	const SimilarityService = createSimilarityService({selectBetterModel, duplicateDetectionModel});

	return {checkBib};

	async function checkBib(record, stopOnFirstMatch = true) {
		return new Promise((resolve, reject) => {
			const idList = [];

			CandidateService.findBib(record)
				.on('error', reject)
				.on('end', () => resolve(idList))
				.on('candidate', async candidate => {
					const results = await SimilarityService.checkSimilarity(record, candidate);

					if (!results.hasNegativeFeatures && results.type !== 'NOT_DUPLICATE') {
						const id = candidate.get(/^001$/).shift().value;

						idList.push(id);

						if (stopOnFirstMatch) {
							resolve(idList);
						}
					}
				});
		});
	}
}
