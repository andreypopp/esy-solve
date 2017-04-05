/**
 * @flow
 */

import type {
  CUDFRelOp,
  CUDFPackage,
  CUDFPackageFormula,
  CUDFPackageConstraint,
  CUDFUniverse,
} from './cudf';
import type {PackageUniverse, PackageMetadata} from './universe';

import * as semver from 'semver';

export function encodeAsCUDFUniverse(universe: PackageUniverse): CUDFUniverse {
  const packages = [];
  for (const versions of universe.values()) {
    for (const {meta} of versions.values()) {
      packages.push(encodeAsCUDFPackage(meta));
    }
  }
  return packages;
}

export function encodeAsCUDFPackage(meta: PackageMetadata): CUDFPackage {
  const and = [];
  for (const [name, constraint] of meta.dependencies.entries()) {
    const parsedConstraint = new semver.Range(constraint);
    and.push(...encodeAsCUDFPackageFormula(name, parsedConstraint.set).and);
  }

  const version = semver.parse(meta.version) || {major: 0, minor: 0, patch: 0};

  const pkg = {
    depends: {and},
    package: meta.name,
    version: encodeAsCUDFVersion(version),

    installed: null,
    wasInstalled: null,
    keep: null,

    depends: {and},
    conflicts: null,
    provides: null,
  };
  return pkg;
}

export function encodeAsCUDFPackageFormula(
  name: string,
  items: Array<Array<{operator: semver.Comparator, semver: semver.SemVer}>>,
  result: CUDFPackageFormula = {and: []},
): CUDFPackageFormula {
  if (items.length === 0) {
    return result;
  }
  const [first, ...rest] = items;
  if (result.and.length === 0) {
    const and = first.map(item => ({
      or: [encodeAsCUDFPackageConstraint(name, item)],
    }));
    return encodeAsCUDFPackageFormula(name, rest, {and});
  } else {
    const and = [];
    for (const b of result.and) {
      for (const n of first) {
        const or = {or: b.or.concat(encodeAsCUDFPackageConstraint(name, n))};
        and.push(or);
      }
    }
    return encodeAsCUDFPackageFormula(name, rest, {and});
  }
}

function encodeAsCUDFPackageConstraint(name: string, constraint) {
  const atom: CUDFPackageConstraint<> = {
    name,
    op: encodeAsCUDFRelOp(constraint.operator),
    version: encodeAsCUDFVersion(constraint.semver),
  };
  return atom;
}

function encodeAsCUDFVersion(version): number {
  return (version.major || 0) * 1000000 +
    (version.minor || 0) * 1000 +
    (version.patch || 0) +
    1;
}

export function encodeAsCUDFRelOp(comp: semver.Comparator): CUDFRelOp {
  switch (comp) {
    case '':
      return '=';
    case '===':
      return '=';
    case '!==':
      return '!=';
    case '==':
      return '=';
    case '=':
      return '=';
    case '!=':
      return '!=';
    case '>':
      return '>';
    case '>=':
      return '>=';
    case '<':
      return '<';
    case '<=':
      return '<=';
    default:
      return '=';
  }
}
