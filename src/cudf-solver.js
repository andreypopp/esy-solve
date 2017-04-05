/**
 * @flow
 */

import type {CUDFDocument} from './cudf';

import * as child from 'mz/child_process';
import * as fs from 'mz/fs';
import tempfile from 'tempfile';

import * as CUDF from './cudf';

export async function solve(doc: CUDFDocument): Promise<any> {
  const inputFilename = 'input.cudf'; //tempfile('.cudf');
  const outputFilename = tempfile('.cudf');
  await fs.writeFile(inputFilename, CUDF.renderCUDFDocument(doc));
  await child.exec(`aspcud ${inputFilename} ${outputFilename} trendy`);
  const output = await fs.readFile(outputFilename, 'utf8');
  return output;
}
