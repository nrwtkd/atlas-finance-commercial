function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function localMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function shiftMonthKey(month: string, offset: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const shifted = new Date(year, monthNumber - 1 + offset, 1, 12, 0, 0, 0);
  return localMonthKey(shifted);
}

export function previousLocalMonthKey(date = new Date()) {
  return shiftMonthKey(localMonthKey(date), -1);
}

export function nextLocalMonthKey(date = new Date()) {
  return shiftMonthKey(localMonthKey(date), 1);
}

export function monthLabelFromKey(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1, 12, 0, 0, 0).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric"
  });
}

export function monthEndDateKey(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return localDateKey(new Date(year, monthNumber, 0, 12, 0, 0, 0));
}
