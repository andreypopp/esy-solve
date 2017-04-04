/**
 * @flow
 */

import * as os from 'os';

export type CUDFRelOp = '=' | '!=' | '>' | '<' | '>=' | '<=';
export type CUDFEqOp = '=';

export type CUDFPackageConstraint<Op=CUDFRelOp> = {
  name: string,
  op: Op,
  version: number,
};

export type CUDFPackageFormula = {
  and: Array<{
    or: Array<CUDFPackageConstraint<>>,
  }>,
};

export type CUDFPackageList<OP=CUDFRelOp> = {
  and: Array<CUDFPackageConstraint<OP>>,
};

export type CUDFPropertyType =
  | {type: 'enum', values: string[]}
  | {type: 'string'}
  | {type: 'int'}
  | {type: 'posint'}
  | {type: 'bool'};

export type CUDFProperty = {
  name: string,
  type: CUDFPropertyType,
  defaultValue: any,
};

export type CUDFPackage = {
  package: string,
  version: number,
  installed: boolean,
  wasInstalled: boolean,
  depends: ?CUDFPackageFormula,
  conflicts: ?CUDFPackageList<>,
  provides: ?CUDFPackageList<CUDFEqOp>,
  keep: ?('version' | 'package' | 'feature' | 'none'),
};

export type CUDFRequest = {
  install: ?CUDFPackageList<>,
  remove: ?CUDFPackageList<>,
  upgrade: ?CUDFPackageList<>,
};

export type CUDFPreamble = {
  property: CUDFProperty[],
  universeChecksum: ?string,
  statusChecksum: ?string,
  requestChecksum: ?string,
};

export type CUDFUniverse = CUDFPackage[];

export type CUDFDocument = {
  preamble: ?CUDFPreamble,
  universe: CUDFPackage[],
  request: CUDFRequest,
};

const EOL = os.EOL;
const EMPTYLINE = '';

export function renderCUDFDocument({preamble, universe, request}: CUDFDocument): string {
  const lines = [];
  // Preamble
  if (preamble) {
    lines.push('preamble:');
    const propLine = [];
    for (const prop of preamble.property) {
      let defaultValue = '';
      if (prop.defaultValue != null) {
        defaultValue = ` = [ ${String(prop.defaultValue)} ]`;
      }
      propLine.push(`${prop.name} : ${renderCUDFPropertyType(prop.type)}${defaultValue}`);
    }
    if (propLine.length > 0) {
      lines.push(`property: ${propLine.join(', ')}`);
    }
    if (preamble.universeChecksum != null) {
      lines.push(`univ-checksum: ${preamble.universeChecksum}`);
    }
    if (preamble.statusChecksum != null) {
      lines.push(`status-checksum: ${preamble.statusChecksum}`);
    }
    if (preamble.requestChecksum != null) {
      lines.push(`req-checksum: ${preamble.requestChecksum}`);
    }
    lines.push(EMPTYLINE);
  }
  // Universe
  for (const pkg of universe) {
    lines.push(`package: ${pkg.package}`);
    lines.push(`version: ${pkg.version}`);
    lines.push(`installed: ${pkg.installed ? 'true' : 'false'}`);
    if (pkg.wasInstalled != null) {
      lines.push(`was-installed: ${pkg.wasInstalled ? 'true' : 'false'}`);
    }
    if (pkg.depends != null) {
      lines.push(`depends: ${renderCUDFPackageFormula(pkg.depends)}`);
    }
    if (pkg.conflicts != null) {
      lines.push(`depends: ${renderCUDFPackageList(pkg.conflicts)}`);
    }
    if (pkg.provides != null) {
      lines.push(`depends: ${renderCUDFPackageList(pkg.provides)}`);
    }
    if (pkg.keep != null) {
      lines.push(`keep: ${pkg.keep}`);
    }
    lines.push(EMPTYLINE);
  }
  // Request
  lines.push('request:');
  if (request.install != null) {
    lines.push(`install: ${renderCUDFPackageList(request.install)}`);
  }
  if (request.remove != null) {
    lines.push(`remove: ${renderCUDFPackageList(request.remove)}`);
  }
  if (request.upgrade != null) {
    lines.push(`upgrade: ${renderCUDFPackageList(request.upgrade)}`);
  }
  return lines.join(EOL);
}

function renderCUDFPropertyType(propType: CUDFPropertyType): string {
  switch (propType.type) {
    case 'string':
      return 'string';
    case 'posint':
      return 'posint';
    case 'int':
      return 'int';
    case 'bool':
      return 'bool';
    case 'enum':
      return `enum [ ${propType.values.join(', ')} ]`;
    default:
      throw new Error(`Unknown property type: ${propType.type}`);
  }
}

function renderCUDFPackageFormula(formula: CUDFPackageFormula): string {
  return formula.and
    .map(item =>
      item.or.map(item => `${item.name} ${item.op} ${item.version}`).join(' | '))
    .join(', ');
}

function renderCUDFPackageList(formula: CUDFPackageList<any>): string {
  return formula.and.map(item => `${item.name} ${item.op} ${item.version}`).join(', ');
}
