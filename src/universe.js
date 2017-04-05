/**
 * @flow
 */

import * as semver from 'semver';
import PromiseQueue from 'p-queue';
import * as Map from './lib/Map';
import resolve from './resolve';

export type PackageMetadata = {
  name: string,
  version: string,
  dependencies: Map.Map<string, string>,
};

export type PackageVersionCollection = Map.Map<string, {
  meta: PackageMetadata,
}>;

export type PackageUniverse = Map.Map<string, PackageVersionCollection>;

export async function create(seed: string[]): Promise<PackageUniverse> {
  const queue = new PromiseQueue({concurrency: 10});
  const seen = new Set();
  const univ: PackageUniverse = Map.create();

  function addToQueue(packageName, elaborator = '') {
    seen.add(packageName);
    return queue.add(() => resolve({packageName, elaborator})).then(manifests => {
      const tasks = [];
      const collection = Map.create();
      for (const {meta} of manifests) {
        for (const [depName, constraint] of meta.dependencies.entries()) {
          if (!seen.has(depName) && semver.validRange(constraint)) {
            tasks.push(addToQueue(depName));
          }
        }
        collection.set(meta.version, {meta});
      }
      univ.set(packageName, collection);
      return Promise.all(tasks);
    });
  }

  await Promise.all(seed.map(packageName => addToQueue(packageName)));

  return univ;
}
