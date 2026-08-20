export function slugify(text) {
  if (!text) return "";
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9]+/g, "-") // Substitui caracteres especiais e espaços por hífen
    .replace(/^-+|-+$/g, ""); // Remove hífens no início e fim
}

export function getCarSlug(car) {
  if (!car) return "";
  if (car.slug) return car.slug;

  const nameParts = [
    car.title || `${car.brand || ""} ${car.model || ""}`.trim(),
    car.subtitle || car.description || "",
  ].filter(Boolean).join(" ");

  const cleanSlug = slugify(nameParts);
  return cleanSlug || String(car.id || "");
}

export function findCarBySlugOrId(cars, identifier) {
  if (!identifier || !cars || !Array.isArray(cars) || cars.length === 0) return null;
  const decoded = decodeURIComponent(String(identifier)).toLowerCase().trim();

  // 1. Busca direta por ID exato (compatibilidade total com links antigos com UUID)
  const byId = cars.find(c => String(c.id).toLowerCase() === decoded);
  if (byId) return byId;

  // 2. Busca por slug exato gerado
  const bySlug = cars.find(c => getCarSlug(c).toLowerCase() === decoded);
  if (bySlug) return bySlug;

  // 3. Busca caso o slug contenha o identificador ou vice-versa
  const bySlugContains = cars.find(c => {
    const s = getCarSlug(c).toLowerCase();
    return s && (s.includes(decoded) || decoded.includes(s));
  });
  if (bySlugContains) return bySlugContains;

  // 4. Busca por slug apenas do título (marca + modelo)
  const byTitleSlug = cars.find(c => {
    const titleSlug = slugify(c.title || `${c.brand || ""} ${c.model || ""}`);
    return titleSlug && (decoded.startsWith(titleSlug) || titleSlug.startsWith(decoded));
  });
  if (byTitleSlug) return byTitleSlug;

  // 5. Busca caso o identificador contenha o UUID do carro
  const byPartialId = cars.find(c => c.id && (decoded.includes(String(c.id).toLowerCase()) || String(c.id).toLowerCase().includes(decoded)));
  if (byPartialId) return byPartialId;

  return null;
}
