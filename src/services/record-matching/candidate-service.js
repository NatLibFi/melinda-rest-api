/* eslint-disable require-await */

import {EventEmitter} from 'events';
import {MARCXML} from '@natlibfi/marc-record-serializers';
import createSruClient from '@natlibfi/sru-client';

export default function ({sruURL}) {
	const SruClientBib = createSruClient({serverUrl: `${sruURL}/bib`});

	return {
		findBib
	};

	function findBib(record) {
		const identifierQueries = generateIdentifierQueries();
		const titleQueries = generateTitleQueries();
		const queryList = identifierQueries.concat(titleQueries);

		return new ProxyEmitter(SruClientBib, queryList);

		function generateIdentifierQueries() {
			const {tag, identifiers} = getStandardIdentifiers();
			return identifiers.map(identifier => {
				return tag === '020' ? `bath.isbn=${identifier}` : `bath.issn=${identifier}`;
			});

			function getStandardIdentifiers() {
				return record.get(/^020|022$/)
					.reduce((acc, field) => {
						if (acc.tag) {
							if (acc.tag === field.tag) {
								acc.identifiers.push(field.subfields.find(sf => sf.code === 'a').value);
								return acc;
							}

							return acc;
						}

						return {
							tag: field.tag,
							identifiers: [field.subfields.find(sf => sf.code === 'a').value]
						};
					}, {tag: undefined, identifiers: []});
			}
		}

		function generateTitleQueries() {
			const title = getTitle();

			return [`dc.title=${title}`];

			function getTitle() {
				const field = record.get(/^245$/).shift();

				// Normalize
				if (field) {
					return field.subfields.find(sf => sf.code === 'a').value
						.replace(/[\][":;,.-?'=+/]/g, ' ')
						.substr(0, 20)
						.trim();
				}
			}
		}
	}
}

class ProxyEmitter extends EventEmitter {
	constructor(SruClient, queryList) {
		super();

		this.sruClient = SruClient;
		this.queryList = queryList;
		this.idList = [];

		const self = this;

		executeQueries();

		function executeQueries() {
			const query = self.queryList.shift();

			if (query) {
				self.sruClient.searchRetrieve(query)
					.on('record', handleRecord)
					.on('end', executeQueries)
					.on('error', err => self.emit('error', err));
			} else {
				self.emit('end');
			}

			function handleRecord(xml) {
				const record = MARCXML.from(xml);

				if (record.get(/^001$/).length > 0) {
					const id = record.get(/^001$/).shift().value;

					if (!isDeleted() && !self.idList.includes(id)) {
						self.emit('candidate', record);
						self.idList.push(id);
					}
				}

				function isDeleted() {
					return record
						.get(/^STA$/)
						.some(f => f.subfields.some(
							sf => sf.code === 'a' && sf.value === 'DELETED'
						));
				}
			}
		}
	}
}
