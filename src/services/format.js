import {MarcRecord} from '@natlibfi/marc-record';

export function formatRecord(record, settings) {
  const newRecord = MarcRecord.clone(record);

  settings.forEach(options => {
    replacePrefixes(options);
  });

  return newRecord;

  // Replace prefix in all specified subfields
  function replacePrefixes(options) {
    const {oldPrefix, newPrefix, prefixReplaceCodes} = options;
    newRecord.getDatafields()
      .forEach(field => {
        field.subfields
          .filter(({code}) => prefixReplaceCodes.includes(code))
          .forEach(subfield => {
            const pattern = `(${oldPrefix})`;
            const replacement = `(${newPrefix})`;
            subfield.value = subfield.value.replace(pattern, replacement); // eslint-disable-line functional/immutable-data
          });
      });
  }
}

// If placed in config.js testing needs envs
export const BIB_FORMAT_SETTINGS = [
  {
    oldPrefix: 'FI-MELINDA',
    newPrefix: 'FIN01',
    prefixReplaceCodes: ['w']
  },
  {
    oldPrefix: 'FI-ASTERI-S',
    newPrefix: 'FIN10',
    prefixReplaceCodes: ['0']
  },
  {
    oldPrefix: 'FI-ASTERI-N',
    newPrefix: 'FIN11',
    prefixReplaceCodes: ['0']
  }
];
