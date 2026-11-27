interface CategorizedService {
  id: string;
  name: string;
  category?: {
    id: string;
    name: string;
    isActive: boolean;
    sortOrder: number;
  } | null;
}

export interface ServiceCategoryGroup<T extends CategorizedService> {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  services: T[];
}

export function groupServicesByCategory<T extends CategorizedService>(
  services: T[],
): ServiceCategoryGroup<T>[] {
  const groups = new Map<string, ServiceCategoryGroup<T>>();

  for (const service of services) {
    const category = service.category;
    const groupId = category?.id ?? "uncategorized";

    let group = groups.get(groupId);

    if (!group) {
      group = {
        id: groupId,
        name: category?.name ?? "Uncategorized",
        sortOrder: category?.sortOrder ?? Number.MAX_SAFE_INTEGER,
        isActive: category?.isActive ?? true,
        services: [],
      };

      groups.set(groupId, group);
    }

    group.services.push(service);
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      services: [...group.services].sort(
        (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
      ),
    }))
    .sort(
      (a, b) =>
        a.sortOrder - b.sortOrder ||
        a.name.localeCompare(b.name) ||
        a.id.localeCompare(b.id),
    );
}
