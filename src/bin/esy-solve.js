#!/usr/bin/env node
// @flow

import loudRejection from 'loud-rejection';
loudRejection();

import * as Univ from '../universe';
import * as UnivToCUDF from '../universe-to-cudf';
import * as CUDF from '../cudf';
import * as Solver from '../cudf-solver';

function createDoc({universe, install}) {
  return {
    preamble: null,
    universe,
    request: {
      install: {and: install},
      upgrade: null,
      remove: null,
    },
  };
}

async function main() {
  const seed = process.argv.slice(2);
  const univ = await Univ.create(seed);
  const packages = UnivToCUDF.encodeAsCUDFUniverse(univ);
  const doc = createDoc({
    universe: packages,
    install: [{name: 'graceful-fs', op: '>', version: 1002004}],
  });
  const output = await Solver.solve(doc);
  console.log(output);
}

main().catch(err => {
  throw err;
});
