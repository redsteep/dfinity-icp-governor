export const toTimestamp = (value: Date): bigint =>
  BigInt(value.getTime() * 1000 * 1000);

export const fromTimestamp = (value: bigint): Date =>
  new Date(Number(value) / (1000 * 1000));

export const toNullableTimestamp = (value?: Date): [] | [bigint] => {
  const time = value?.getTime();
  return value && !isNaN(time!) ? [toTimestamp(value)] : [];
};

export const fromNullableTimestamp = (value?: [] | [bigint]) =>
  !isNaN(parseInt(`${value?.[0]}`)) ? fromTimestamp(value?.[0]!) : undefined;
