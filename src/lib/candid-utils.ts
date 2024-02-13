export type List<T> = [] | [[T, List<T>]];
export type Optional<T> = [] | [T];

export function extractVariant<T extends object>(object: T) {
  const key = Object.keys(object)[0] as keyof T;
  const value = object[key];
  return [key, value];
}

export function fromList<T>(list: List<T>): T[] {
  if (list.length == 0) {
    return [];
  } else {
    const tuple = list[0];
    const array = fromList(tuple[1]);
    array.unshift(tuple[0]);
    return array;
  }
}

export function toList<T>(array: T[]): List<T> {
  return array.reduceRight((accum: List<T>, x) => [[x, accum]], []);
}

export function fromOptional<T>(optional: Optional<T>) {
  return optional.length > 0 ? optional[0] : null;
}

export function toOptional<T>(object: T | null | undefined): [] | [T] {
  return object ? [object] : [];
}

export function fromTimestamp(value: bigint): Date {
  return new Date(Number(value) / (1000 * 1000));
}

export function toTimestamp(value: Date | number): bigint {
  return BigInt(
    (value instanceof Date ? value.getTime() : value) * 1000 * 1000,
  );
}

export function fromNullableTimestamp(value?: [] | [bigint]) {
  return !isNaN(parseInt(`${value?.[0]}`))
    ? fromTimestamp(value?.[0]!)
    : undefined;
}

export function toNullableTimestamp(value?: Date): [] | [bigint] {
  const time = value?.getTime();
  return value && !isNaN(time!) ? [toTimestamp(value)] : [];
}

export async function fromBlob<T>(data: Array<number>): Promise<T> {
  const blob: Blob = new Blob([new Uint8Array(data)], {
    type: "application/json; charset=utf-8",
  });
  return JSON.parse(await blob.text());
}

export async function toBlob<T extends string>(
  data: T,
): Promise<Array<number>> {
  const blob: Blob = new Blob([data]);
  return [...new Uint8Array(await blob.arrayBuffer())];
}

export function fromHexString(hexString: string) {
  return Uint8Array.from(
    hexString.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
  );
}
