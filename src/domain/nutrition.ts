import type { NutritionFocus, NutritionFoodGroup } from "../types";

export const nutritionFocusOptions: Array<{
  value: NutritionFocus;
  label: string;
  description: string;
}> = [
  {
    value: "family_general",
    label: "Keluarga secara umum",
    description: "Merayakan kebiasaan menyediakan makanan yang beragam untuk keluarga."
  },
  {
    value: "pregnant",
    label: "Ibu hamil",
    description: "Mengaktifkan pengingat umum agar belanja pangan bergizi tidak mudah terlewat."
  },
  {
    value: "breastfeeding",
    label: "Ibu menyusui",
    description: "Membantu memberi perhatian pada pangan keluarga selama masa menyusui."
  },
  {
    value: "child_6_23_months",
    label: "Anak usia 6–23 bulan",
    description: "Merayakan pilihan belanja yang ikut mendukung variasi pangan keluarga."
  },
  {
    value: "child_2_5_years",
    label: "Anak usia 2–5 tahun",
    description: "Membantu menjaga perhatian pada makanan bergizi selama masa tumbuh kembang."
  }
];

export const nutritionFoodOptions: Array<{
  value: NutritionFoodGroup;
  label: string;
}> = [
  { value: "egg", label: "Telur" },
  { value: "fish", label: "Ikan atau seafood" },
  { value: "meat", label: "Ayam atau daging" },
  { value: "dairy", label: "Susu atau olahannya" },
  { value: "plant_protein", label: "Tahu atau tempe" },
  { value: "vegetable", label: "Sayur" },
  { value: "fruit", label: "Buah" }
];

export function nutritionFoodLabelList(values: NutritionFoodGroup[]) {
  return values
    .map((value) => nutritionFoodOptions.find((item) => item.value === value)?.label)
    .filter((value): value is string => Boolean(value))
    .join(", ");
}
