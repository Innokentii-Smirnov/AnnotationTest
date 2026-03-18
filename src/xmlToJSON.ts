import fs from 'fs';
import os from 'os';
import path from 'path';
import 'global-jsdom/register';
import { XmlElementNode, isXmlElementNode, MyLeft,
  parseNewXml, XmlReadConfig, LetterCorrection, writeNode, XmlWriteConfig }
  from 'simple_xml';

const sep = ' ';
const infile = process.argv[2];
const outfile = process.argv[3];
const progressReportAfter = 1000;

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

function parseXmlWord(wordNodeXmlString: string): XmlElementNode | null {
  const parseResult = parseNewXml(wordNodeXmlString, xmlReadConfig);
  if (parseResult instanceof MyLeft) {
    return null;
  }
  const node = parseResult.value;
  if (isXmlElementNode(node)) {
    return node;
  } else {
    return null;
  }
}

const wordNodes: XmlElementNode[] = [];

for (let i = 0; i < xmlWords.length; i++) {
  const xmlWord = xmlWords[i];
  const wordNodeXmlString = '<w>' + xmlWord + '</w>';
  const wordNode = parseXmlWord(wordNodeXmlString);
  if (wordNode === null) {
    console.log('Ignoring ' + i.toString() + ') ' + xmlWord);
  } else {
    wordNodes.push(wordNode);
  }
  if (i % progressReportAfter === 0) {
    console.log('Processed ' + i.toString() + ' words.');
    console.log(wordNode);
  }
}

const wordNodesString = JSON.stringify(wordNodes, undefined, '\t');
fs.writeFileSync(outfile, wordNodesString);
