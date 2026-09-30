"use client";

import { MoreHorizontal, Pencil, Star, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  ContactPersonItem,
  contactPersonService,
} from "@/app/services/contactPerson.service";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ConfirmDeleteDialog } from "../../../crm/[id]/components/confirm-delete-dialog";
import { CreateContactPersonModal } from "./create-contact-person-modal";
import { EditContactPersonModal } from "./edit-contact-person-modal";

interface ContactPersonTableProps {
  clientId: string;
  permissions: string[];
  onRefreshClient?: () => void | Promise<void>;
}

export function ContactPersonTable({
  clientId,
  permissions,
  onRefreshClient,
}: ContactPersonTableProps) {
  const [contacts, setContacts] = useState<ContactPersonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);

    return () => clearTimeout(timeout);
  }, [search]);

  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);

      const response = await contactPersonService.getContactPersons({
        clientId,
        search: debouncedSearch || undefined,
        page,
        limit: 10,
      });

      if (response.success) {
        setContacts(response.data);
        setMeta(response.meta);
      }
    } catch (error) {
      toast.error("Gagal memuat contact person", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      });
    } finally {
      setLoading(false);
    }
  }, [clientId, debouncedSearch, page]);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  const handleDelete = async (contact: ContactPersonItem) => {
    const response = await contactPersonService.deleteContactPerson(contact.id);

    if (response.success) {
      toast.success("Contact person berhasil dihapus", {
        description: `"${contact.fullName}" berhasil dihapus.`,
      });

      await loadContacts();
      await onRefreshClient?.();
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Cari contact person..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="sm:max-w-sm"
        />
        <PermissionGuard
          permissions={permissions}
          required="client.contact.create">
          <CreateContactPersonModal
            clientId={clientId}
            onSuccess={async () => {
              await loadContacts();
              await onRefreshClient?.();
            }}
          />
        </PermissionGuard>
      </div>

      <div className="overflow-hidden rounded-xl border">
        {loading ? (
          <div className="flex min-h-52 items-center justify-center text-sm text-muted-foreground">
            Memuat contact person...
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex min-h-52 items-center justify-center text-sm text-muted-foreground">
            Belum ada contact person.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Nama</th>
                  <th className="px-4 py-3 text-left font-medium">Jabatan</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Telepon</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="w-16 px-4 py-3 text-right font-medium">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {contacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="border-b last:border-b-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium">{contact.fullName}</p>

                          {contact.department && (
                            <p className="text-xs text-muted-foreground">
                              {contact.department}
                            </p>
                          )}
                        </div>

                        {contact.isPrimary && (
                          <Star className="size-4 fill-current text-amber-500" />
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">{contact.position}</td>

                    <td className="px-4 py-3">{contact.email}</td>

                    <td className="px-4 py-3">
                      {contact.mobile ?? contact.phone ?? "-"}
                    </td>

                    <td className="px-4 py-3">
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                        {contact.status === "ACTIVE" ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="min-w-44">
                          <PermissionGuard
                            permissions={permissions}
                            required="client.contact.update">
                            <EditContactPersonModal
                              contact={contact}
                              onSuccess={async () => {
                                await loadContacts();
                                await onRefreshClient?.();
                              }}
                              trigger={
                                <DropdownMenuItem
                                  onSelect={(event) => event.preventDefault()}>
                                  <Pencil className="mr-2 size-4" />
                                  Edit Contact
                                </DropdownMenuItem>
                              }
                            />
                          </PermissionGuard>

                          <PermissionGuard
                            permissions={permissions}
                            required="client.contact.delete">
                            <DropdownMenuSeparator />

                            <ConfirmDeleteDialog
                              title="Hapus contact person?"
                              description={`Contact "${contact.fullName}" akan dihapus permanen.`}
                              triggerLabel="Hapus Contact"
                              loadingLabel="Menghapus Contact..."
                              onConfirm={() => handleDelete(contact)}
                              trigger={
                                <DropdownMenuItem
                                  onSelect={(event) => event.preventDefault()}
                                  className="text-destructive focus:text-destructive">
                                  <Trash2 className="mr-2 size-4" />
                                  Hapus Contact
                                </DropdownMenuItem>
                              }
                            />
                          </PermissionGuard>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Total {meta.total} contact
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
            Previous
          </Button>

          <span className="text-sm">
            {meta.page} / {Math.max(meta.totalPages, 1)}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={
              page >= meta.totalPages || loading || meta.totalPages === 0
            }
            onClick={() => setPage((prev) => prev + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
