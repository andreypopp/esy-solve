/**
 * @flow
 */

import type {Resolver} from './index';

import RegistryClient from 'npm-registry-client';

import {noop} from '../lib/util';
import * as Map from '../lib/Map';

const resolveWithNpmRegistry: Resolver = async request => {
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
  const versions = await fetchPackageMeta(client, request.packageName);
  return versions.map(meta => ({
    id: meta.version,
    request,
    meta,
    fetch: 'npm',
  }));
};

export default resolveWithNpmRegistry;

async function fetchPackageMeta(client, packageName) {
  return new Promise((resolve, reject) => {
    client.get(
      `https://registry.npmjs.org/${escapePackageName(packageName)}`,
      {fullMetadata: true},
      (err, result) => {
        if (err) {
          if (err.statusCode === 404) {
            resolve([]);
          } else {
            reject(err);
          }
        } else {
          const versions = [];
          for (const k in result.versions) {
            const version = result.versions[k];
            const meta = {
              name: version.name,
              version: version.version,
              dependencies: Map.fromObject(version.dependencies),
            };
            versions.push(meta);
          }
          resolve(versions);
        }
      },
    );
  });
}

function escapePackageName(name: string): string {
  return name.replace('/', '%2f');
}
