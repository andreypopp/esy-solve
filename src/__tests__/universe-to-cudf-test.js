/**
 * @flow
 */

import * as UnivToCUDF from '../universe-to-cudf';

test('encodeAsCUDFPackage()', function() {
  expect(
    UnivToCUDF.encodeAsCUDFPackage({
      name: 'app',
      version: '1.0.0',
      dependencies: mapFromObject({
        dep: '^2.0.0',
        react: '^0.14.0 || ^15.0.0',
      }),
    }),
  ).toMatchSnapshot();
});

function mapFromObject(obj) {
  const res = new Map();
  for (const k in obj) {
    res.set(k, obj[k]);
  }
  return res;
}
