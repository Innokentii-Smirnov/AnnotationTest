import fs from 'fs';
import os from 'os';
import path from 'path';
import 'global-jsdom/register';
import { XmlElementNode, isXmlElementNode, MyLeft,
  parseNewXml, XmlReadConfig, LetterCorrection, writeNode, XmlWriteConfig }
  from 'simple_xml';
import { LexicalData, setLexicalData } from '../tlh/ui/src/xmlEditor/hur/lexicalData/lexicalData';
import { annotateHurrianWord, getLookupConfig }
  from '../tlh/ui/src/xmlEditor/hur/dict/dictionary';

const sep = ' ';
const dictionaryFilePath = process.argv[2];
const infile = process.argv[3];
const outfile = process.argv[4];
const emptyStringMarker = '[EMPTY]';
const nullMarker = '[NULL]';
const progressReportAfter = 1000;

console.log(dictionaryFilePath);
if (!fs.existsSync(dictionaryFilePath)) {
  throw Error('The dictionary file does not exist.')
}

console.log(infile);
if (!fs.existsSync(infile)) {
  throw Error('The input file does not exist.')
}

const xmlWords = fs.readFileSync(infile, 'utf8').split('\n').filter(line => line !== '');

const letterCorrections: LetterCorrection = [
  // Corrections
  ['š', 'š' /* kombi zu 161 */], ['Š', 'Š' /* kombi zu 160 */],
  ['ḫ̮', 'ḫ'], ['Ḫ̮', 'Ḫ'], ['ḫ', 'ḫ'], ['Ḫ', 'Ḫ'], ['h', 'ḫ'], ['H', 'Ḫ'],
  ['̮', '' /* Achtung, überzähliger Bogen unter Het! schlecht sichtbar */],
  ['〈', '〈' /* U+3008 aus CJK zu  U+2329 */], ['〉', '〉'],
  // Harmonizations
  ['á', 'á'], ['à', 'à'], ['â', 'â'], ['ā', 'ā'],
  ['é', 'é'], ['è', 'è'], ['ê', 'ê'], ['ē', 'ē'],
  ['í', 'í'], ['ì', 'ì'], ['î', 'î'], ['ī', 'ī'],
  ['ú', 'ú'], ['ù', 'ù'], ['û', 'û'], ['ū', 'ū'],
];

const xmlReadConfig: XmlReadConfig = {
  w: {
    letterCorrections,
    keepSpaces: true
  }
}

const xmlWriteConfig: XmlWriteConfig = {
  w: {
    inlineChildren: true
  }
};

const lookupConfig = getLookupConfig();

function annotateXmlWord(wordNodeXmlString: string): string | null {
  const parseResult = parseNewXml(wordNodeXmlString, xmlReadConfig);
  if (parseResult instanceof MyLeft) {
    return null;
  }
  const node = parseResult.value;
  if (isXmlElementNode(node)) {
    annotateHurrianWord(node, lookupConfig);
    return writeNode(node, xmlWriteConfig)[0];
  } else {
    return null;
  }
}

function postprocessXmlWord(transcription: string | null): string {
  switch(transcription) {
    case null:
      return nullMarker;
    case '':
      return emptyStringMarker;
    default:
      return transcription;
  }
}

const lexicalDataString = fs.readFileSync(dictionaryFilePath, 'utf-8');
const lexicalData: LexicalData = JSON.parse(lexicalDataString);
setLexicalData(lexicalData);

const stream = fs.createWriteStream(outfile, 'utf8');

try {
  for (let i = 0; i < xmlWords.length; i++) {
    const xmlWord = xmlWords[i];
    const wordNodeXmlString = '<w>' + xmlWord + '</w>';
    const annotatedXmlWord = annotateXmlWord(wordNodeXmlString);
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
