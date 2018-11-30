import {Network} from 'synaptic';
import {Similarity, Utils as UtilsIndex} from '@natlibfi/melinda-deduplication-common';

const IS_DUPLICATE_THRESHOLD = 0.9;
const {PreferredRecordService} = UtilsIndex;
const {Utils: SimilarityUtils} = Similarity;

export default function ({selectBetterModel, duplicateDetectionModel}) {
	const preferredRecordService = PreferredRecordService.createPreferredRecordService(selectBetterModel);

	return {checkSimilarity};

	function checkSimilarity(firstRecord, secondRecord) {
		const {preferredRecord, otherRecord} = preferredRecordService.selectPreferredRecord(firstRecord, secondRecord);
		const importedNetwork = Network.fromJSON(duplicateDetectionModel);
		const recordPair = {record1: preferredRecord, record2: otherRecord};
		const inputVector = SimilarityUtils.pairToInputVector(recordPair);
		const numericProbability = importedNetwork.activate(inputVector)[0];
		const hasNegativeFeatures = inputVector.some(val => val < 0);

		return {
			type: classifyResult(numericProbability),
			numeric: numericProbability,
			inputVector,
			hasNegativeFeatures
		};

		function classifyResult(validationResult) {
			if (validationResult < 0.65) {
				return 'NOT_DUPLICATE';
			}
			if (validationResult > IS_DUPLICATE_THRESHOLD) {
				return 'IS_DUPLICATE';
			}
			return 'MAYBE_DUPLICATE';
		}
	}
}
