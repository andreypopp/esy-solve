#!/usr/bin/env node
// @flow

import loudRejection from 'loud-rejection';
loudRejection();

import * as Univ from '../universe';
import * as CUDF from '../cudf';

async function main() {
  const seed = process.argv.slice(2);
  const univ = await Univ.create(seed);
  const packages = Univ.encodeAsCUDFUniverse(univ);
  const doc = {
    preamble: null,
    universe: packages,
    request: {install: null, upgrade: null, remove: null},
  };
  console.log(CUDF.renderCUDFDocument(doc));
}

main().catch(err => {
  throw err;
});
