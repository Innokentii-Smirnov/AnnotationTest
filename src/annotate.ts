import fs from 'fs';
import os from 'os';
import path from 'path';
import 'global-jsdom/register';
import { XmlElementNode, writeNode, XmlWriteConfig }
  from 'simple_xml';
import { LexicalData, setLexicalData } from '../tlh/ui/src/xmlEditor/hur/lexicalData/lexicalData';
import { annotateHurrianWord, getLookupConfig }
  from '../tlh/ui/src/xmlEditor/hur/dict/dictionary';

const sep = ' ';
const dictionaryFilePath = process.argv[2];
const infile = process.argv[3];
const outfile = process.argv[4];
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

const lookupConfig = getLookupConfig();

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

try {
  for (let i = 0; i < wordNodes.length; i++) {
    const wordNode = wordNodes[i];
    const annotatedXmlWord = annotateWordNode(wordNode);
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
