import fs from 'fs';
import os from 'os';
import path from 'path';
import 'global-jsdom/register';
import { XmlElementNode, writeNode, XmlWriteConfig, Attributes }
  from 'simple_xml';
import { LexicalData, setLexicalData } from '../tlh/ui/src/xmlEditor/hur/lexicalData/lexicalData';
import { annotateHurrianWord, getLookupConfig, getStems, getSuffixChains }
  from '../tlh/ui/src/xmlEditor/hur/dict/dictionary';
import { LookupConfig, lookupConfigKey } from '../tlh/ui/src/xmlEditor/lookupConfig';
import { stringify } from 'csv-stringify';
import { StemInventories } from '../tlh/ui/src/xmlEditor/hur/segmentation/stemInventories';
import { SuffixChainInventories } from '../tlh/ui/src/xmlEditor/hur/segmentation/suffixChainInventories';

const sep = ' ';
const [
  dictionaryFilePath,
  infile,
  outfile,
  annotationsFileName,
  stemsFileName,
  suffixChainsFileName,
  stemTableFileName,
  suffixChainTableFileName
] = process.argv.slice(2);
const emptyStringMarker = '[EMPTY]';
const progressReportAfter = 1000;

console.log(dictionaryFilePath);
if (!fs.existsSync(dictionaryFilePath)) {
  throw Error('The dictionary file does not exist.')
}

console.log(infile);
if (!fs.existsSync(infile)) {
  throw Error('The input file does not exist.')
}

const wordNodesString = fs.readFileSync(infile, 'utf8');
const wordNodes = JSON.parse(wordNodesString);

const xmlWriteConfig: XmlWriteConfig = {
  w: {
    inlineChildren: true
  }
};

const lookupConfig: LookupConfig = {
  ignorePlene: false,
  mergeLabials: false,
  mergeMidAndHighVowels: false,
  ignoreVoice: false,
}

const lookupConfigString = JSON.stringify(lookupConfig);
localStorage.setItem(lookupConfigKey, lookupConfigString);

function annotateWordNode(wordNode: XmlElementNode): string {
  annotateHurrianWord(wordNode, lookupConfig);
  return writeNode(wordNode, xmlWriteConfig)[0];
}

function postprocessXmlWord(xmlWordString: string): string {
  switch(xmlWordString) {
    case '':
      return emptyStringMarker;
    default:
      return xmlWordString;
  }
}

const lexicalDataString = fs.readFileSync(dictionaryFilePath, 'utf-8');
const lexicalData: LexicalData = JSON.parse(lexicalDataString);
setLexicalData(lexicalData);

const stream = fs.createWriteStream(outfile, 'utf8');
const annotations: Attributes[] = [];

try {
  for (let i = 0; i < wordNodes.length; i++) {
    const wordNode = wordNodes[i];
    const annotatedXmlWord = annotateWordNode(wordNode);
    const { attributes } = wordNode;
    annotations.push(attributes);
    const line = postprocessXmlWord(annotatedXmlWord) + os.EOL;
    stream.write(line);
    if (i % progressReportAfter === 0) {
      console.log('Processed ' + i.toString() + ' words.');
      console.log(line);
    }
  }
} catch(err) {
  throw err;
} finally {
  stream.close();
}

const annotationsString = JSON.stringify(annotations, undefined, '\t');
fs.writeFileSync(annotationsFileName, annotationsString);

const stems: StemInventories = getStems();
const stemsString = JSON.stringify(stems, undefined, '\t');
fs.writeFileSync(stemsFileName, stemsString);

const suffixChains: SuffixChainInventories = getSuffixChains();
const suffixChainsString = JSON.stringify(suffixChains, undefined, '\t');
fs.writeFileSync(suffixChainsFileName, suffixChainsString);

const stemStringifier = stringify({
  delimiter: '\t',
});
const stemTableStream = fs.createWriteStream(stemTableFileName, 'utf8');
try {
  for (const [pos, stemInventory] of Object.entries(stems)) {
    for (const [surfaceForm, stemObjects] of Object.entries(stemInventory)) {
      for (const stemObject of stemObjects) {
        const { form, translation } = stemObject;
        stemStringifier.write([pos, surfaceForm, form, translation]);
      }
    }
  }
  stemStringifier.pipe(stemTableStream);
} catch(err) {
  throw err;
} finally {
  stemStringifier.end();
}

const suffixChainStringifier = stringify({
  delimiter: '\t',
});
const suffixChainTableStream = fs.createWriteStream(suffixChainTableFileName, 'utf8');
try {
  for (const [pos, suffixChainInventory] of Object.entries(suffixChains)) {
    for (const [surfaceForm, suffixChainOjects] of Object.entries(suffixChainInventory)) {
      for (const suffixChainObject of suffixChainOjects) {
        const { segmentation, morphTag } = suffixChainObject;
        suffixChainStringifier.write([pos, surfaceForm, segmentation, morphTag]);
      }
    }
  }
  suffixChainStringifier.pipe(suffixChainTableStream);
} catch(err) {
  throw err;
} finally {
  suffixChainStringifier.end();
}
