export const numberFormat = Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export const dateFormat = Intl.DateTimeFormat("en-US", {
  dateStyle: "long",
  timeStyle: "short",
});
