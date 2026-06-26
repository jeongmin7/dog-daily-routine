export type DogContext = {
  name: string;
  ageText?: string;
  weight: number | null;
  diseases: string[];
};

// 만 나이(년). birthdate는 ISO "YYYY-MM-DD" 또는 null.
export function ageFromBirthdate(
  birthdate: string | null,
  today: Date,
): number | null {
  if (!birthdate) return null;
  const b = new Date(birthdate);
  if (Number.isNaN(b.getTime())) return null;
  let age = today.getFullYear() - b.getFullYear();
  const beforeBirthday =
    today.getMonth() < b.getMonth() ||
    (today.getMonth() === b.getMonth() && today.getDate() < b.getDate());
  if (beforeBirthday) age -= 1;
  return age < 0 ? 0 : age;
}

export function buildDogContext(
  dog: { name: string; birthdate: string | null; weight: number | null },
  diseaseNames: string[],
): DogContext {
  const age = ageFromBirthdate(dog.birthdate, new Date());
  return {
    name: dog.name,
    ...(age !== null ? { ageText: `${age}살` } : {}),
    weight: dog.weight,
    diseases: diseaseNames,
  };
}
