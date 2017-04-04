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

import * as semver from 'semver';
import PromiseQueue from 'p-queue';
import RegistryClient from 'npm-registry-client';

type PackageMetadata = {
  name: string,
  version: string,
  dependencies: Map<string, string>,
};

type PackageVersionCollection = Map<string, {
  meta: PackageMetadata,
  cudf: CUDFPackage,
}>;

type PackageUniverse = Map<string, PackageVersionCollection>;

export async function create(seed: string[]): Promise<PackageUniverse> {
  const queue = new PromiseQueue({concurrency: 10});
  const seen = new Set();
  const client = new RegistryClient({
    log: {
      error: noop,
      warn: noop,
      info: noop,
      verbose: noop,
      silly: noop,
      http: noop,
      pause: noop,
      resume: noop,
    },
  });
  const univ: PackageUniverse = new Map();

  function addToQueue(pkgName) {
    seen.add(pkgName);
    return queue.add(() => fetchPackageMeta(client, pkgName)).then(versions => {
      if (versions == null) {
        return;
      }
      univ.set(pkgName, versions);
      const tasks = [];
      for (const {meta} of versions.values()) {
        for (const [depName, constraint] of meta.dependencies.entries()) {
          if (!seen.has(depName) && semver.validRange(constraint)) {
            tasks.push(addToQueue(depName));
          }
        }
      }
      return Promise.all(tasks);
    });
  }

  await Promise.all(seed.map(addToQueue));

  return univ;
}

async function fetchPackageMeta(client, pkgName): Promise<?PackageVersionCollection> {
  return new Promise((resolve, reject) => {
    client.get(
      `https://registry.npmjs.org/${escapeName(pkgName)}`,
      {fullMetadata: true},
      (err, result) => {
        if (err) {
          if (err.statusCode === 404) {
            resolve(null);
          } else {
            reject(err);
          }
        } else {
          const coll = new Map();
          for (const k in result.versions) {
            const version = result.versions[k];
            const meta = {
              name: version.name,
              version: version.version,
              dependencies: mapFromObject(version.dependencies),
            };
            coll.set(meta.version, {meta, cudf: encodeAsCUDFPackage(meta)});
          }
          resolve(coll);
        }
      },
    );
  });
}

export function encodeAsCUDFUniverse(universe: PackageUniverse): CUDFUniverse {
  const packages = [];
  for (const versions of universe.values()) {
    for (const {cudf} of versions.values()) {
      packages.push(cudf);
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

    installed: false,
    wasInstalled: false,
    keep: null,

    depends: {and},
    conflicts: null,
    provides: null,
  };
  return pkg;
}

function encodeAsCUDFPackageFormula(
  name,
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

function encodeAsCUDFPackageConstraint(name, constraint) {
  const atom: CUDFPackageConstraint<> = {
    name,
    op: encodeAsCUDFRelOp(constraint.operator),
    version: encodeAsCUDFVersion(constraint.semver),
  };
  return atom;
}

function encodeAsCUDFVersion(version) {
  return (version.major || 0) * 1000000 +
    (version.minor || 0) * 1000 +
    (version.patch || 0);
}

function encodeAsCUDFRelOp(comp: semver.Comparator): CUDFRelOp {
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

function noop() {}

function escapeName(name: string): string {
  return name.replace('/', '%2f');
}

function mapFromObject(obj) {
  const res = new Map();
  for (const k in obj) {
    res.set(k, obj[k]);
  }
  return res;
}
