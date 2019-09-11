/**
 *
 * @param {*} key
 */

export function sortBy(key: string) {
  return (a: any, b: any) => (a[key] > b[key]) ? 1 : ((b[key] > a[key]) ? -1 : 0);
}
