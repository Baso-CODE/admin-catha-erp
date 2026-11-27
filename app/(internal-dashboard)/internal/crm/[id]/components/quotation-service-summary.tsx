import { FolderTree } from "lucide-react";

import type { QuotationServiceLine } from "@/app/services/crm/quotation.service";

type ServiceSnapshot = Pick<
  QuotationServiceLine,
  | "id"
  | "masterServiceId"
  | "serviceCodeSnapshot"
  | "serviceNameSnapshot"
  | "serviceDescriptionSnapshot"
  | "categoryIdSnapshot"
  | "categoryCodeSnapshot"
  | "categoryNameSnapshot"
  | "categorySortOrderSnapshot"
>;

interface Props {
  items: ServiceSnapshot[];
}
export function QuotationServiceSummary({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
        Belum ada daftar layanan pada dokumen ini.
      </div>
    );
  }

  const groups = new Map<
    string,
    {
      name: string;
      sortOrder: number;
      items: ServiceSnapshot[];
    }
  >();

  for (const item of items) {
    const key = JSON.stringify([
      item.categoryIdSnapshot,
      item.categoryNameSnapshot,
    ]);

    let group = groups.get(key);

    if (!group) {
      group = {
        name: item.categoryNameSnapshot ?? "Uncategorized",
        sortOrder: item.categorySortOrderSnapshot ?? Number.MAX_SAFE_INTEGER,
        items: [],
      };

      groups.set(key, group);
    }

    group.items.push(item);
  }

  const sortedGroups = [...groups.entries()].sort(
    ([, a], [, b]) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
  );

  return (
    <div className="space-y-3">
      {sortedGroups.map(([key, group]) => (
        <div key={key} className="overflow-hidden rounded-lg border">
          <div className="flex items-center gap-2 bg-muted/50 px-3 py-2">
            <FolderTree className="size-4 text-muted-foreground" />

            <p className="text-sm font-medium">{group.name}</p>
          </div>

          <div className="divide-y">
            {group.items.map((item) => (
              <div key={item.id} className="p-3">
                <p className="text-sm font-medium">
                  {item.serviceNameSnapshot}
                </p>

                <p className="font-mono text-xs text-muted-foreground">
                  {item.serviceCodeSnapshot}
                </p>

                {item.serviceDescriptionSnapshot && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.serviceDescriptionSnapshot}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
