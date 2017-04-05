/**
 * @flow
 */

export type {Map};

export function create<K, V>(): Map<K, V> {
  return new Map();
}

export function fromObject<V>(obj: {[name: string]: V}): Map<string, V> {
  const res = new Map();
  for (const k in obj) {
    res.set(k, obj[k]);
  }
  return res;
}
