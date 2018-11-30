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

export const emptyResponse = `<?xml version="1.0"?>
<zs:searchRetrieveResponse xmlns:zs="http://www.loc.gov/zing/srw/">
<zs:version>1.1</zs:version>
<zs:numberOfRecords>0</zs:numberOfRecords>
</zs:searchRetrieveResponse>`;

export const recordResponse1 = `
<?xml version="1.0"?>
<zs:searchRetrieveResponse xmlns:zs="http://www.loc.gov/zing/srw/">
<zs:version>1.1</zs:version>
<zs:numberOfRecords>1</zs:numberOfRecords>
<zs:records>
<zs:record>
<zs:recordSchema>info:srw/schema/1/marcxml-v1.1</zs:recordSchema>
<zs:recordPacking>xml</zs:recordPacking>
<zs:recordData>
<record xmlns="http://www.loc.gov/MARC21/slim">
<leader>00995cam a22003017i 4500</leader>
<controlfield tag="001">000000627</controlfield>          
<controlfield tag="005">20150306135636.0</controlfield>
<controlfield tag="008">870423s1978    sw ||||||d   |||||||swe||</controlfield>
<datafield tag="020" ind1=" " ind2=" ">
<subfield code="a">951-35-1137-5</subfield>
</datafield>
<datafield tag="245" ind1=" " ind2=" ">
<subfield code="a">foobar</subfield>
</datafield>
</record>
</zs:recordData>
<zs:recordPosition>1</zs:recordPosition>
</zs:record>
</zs:records>
</zs:searchRetrieveResponse>`;

export const recordResponse2 = `
<?xml version="1.0"?>
<zs:searchRetrieveResponse xmlns:zs="http://www.loc.gov/zing/srw/">
<zs:version>1.1</zs:version>
<zs:numberOfRecords>1</zs:numberOfRecords>
<zs:records>
<zs:record>
<zs:recordSchema>info:srw/schema/1/marcxml-v1.1</zs:recordSchema>
<zs:recordPacking>xml</zs:recordPacking>
<zs:recordData>
<record xmlns="http://www.loc.gov/MARC21/slim">
<leader>00995cam a22003017i 4500</leader>
<controlfield tag="001">000000628</controlfield>          
<controlfield tag="005">20150306135636.0</controlfield>
<controlfield tag="008">870423s1978    sw ||||||d   |||||||swe||</controlfield>
<datafield tag="020" ind1=" " ind2=" ">
<subfield code="a">951-35-1137-5</subfield>
</datafield>
<datafield tag="245" ind1=" " ind2=" ">
<subfield code="a">foobar</subfield>
</datafield>
</record>
</zs:recordData>
<zs:recordPosition>1</zs:recordPosition>
</zs:record>
</zs:records>
</zs:searchRetrieveResponse>`;

export const inputRecord1 = new MarcRecord({
	leader: '00995cam a22003017i 4500',
	fields: [
		{tag: '008', value: '870423s1978    sw ||||||d   |||||||swe||'},
		{tag: '020', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: '951-35-1137-5'}]},
		{tag: '245', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'foobar'}]}
	]
});

export const expectedRecord1 = new MarcRecord({
	leader: '00995cam a22003017i 4500',
	fields: [
		{tag: '001', value: '000000627'},
		{tag: '005', value: '20150306135636.0'},
		{tag: '008', value: '870423s1978    sw ||||||d   |||||||swe||'},
		{tag: '020', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: '951-35-1137-5'}]},
		{tag: '245', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'foobar'}]}
	]
});

export const recordPair1 = [
	new MarcRecord({
		leader: '00995cam a22003017i 4500',
		fields: [
			{tag: '001', value: '000000627'},
			{tag: '005', value: '20150306135636.0'},
			{tag: '008', value: '870423s1978    sw ||||||d   |||||||swe||'},
			{tag: '020', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: '951-35-1137-5'}]},
			{tag: '245', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'foobar'}]}
		]
	}),
	new MarcRecord({
		leader: '00995cam a22003017i 4500',
		fields: [
			{tag: '001', value: '000000628'},
			{tag: '005', value: '20150306135636.0'},
			{tag: '008', value: '870423s1978    sw ||||||d   |||||||swe||'},
			{tag: '020', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: '951-35-1137-5'}]},
			{tag: '245', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'foobar'}]}
		]
	})
];
