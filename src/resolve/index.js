/**
 * @flow
 */

import resolveWithNpmRegistry from './npm';

import type {PackageMetadata} from '../universe';

export type Request = {
  /**
   * Package name
   */
  packageName: string,

  /**
   * This field is interpreted by resolver.
   */
  elaborator: string,
};

export type Manifest = {
  /**
   * Unique and immutable manifest id. Version for packages stored in registry
   * and sha for packages hosted as git repositories.
   */
  id: string,

  /**
   * Related request which this manifest was resolved from.
   */
  request: Request,

  /**
   * Package metadata.
   */
  meta: PackageMetadata,

  /**
   * A pointer on how to fetch the package.
   */
  fetch: string,
};

export type Resolver = (request: Request) => Promise<Manifest[]>;

const resolve: Resolver = resolveWithNpmRegistry;

export default resolve;
