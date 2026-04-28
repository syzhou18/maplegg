export function formatMeso(value) {
  if (value >= 100000000) {
    const amount = value / 100000000;
    return `${Number.isInteger(amount) ? amount : amount.toFixed(1)}億`;
  }

  if (value >= 10000) {
    return `${Math.round(value / 10000)}萬`;
  }

  return `${value.toLocaleString("zh-TW")}楓幣`;
}
