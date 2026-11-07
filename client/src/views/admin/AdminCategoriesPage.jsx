import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { categoryService } from "@/services";
import { getErrorMessage } from "@/services/api";
import ImageUploader from "@/components/admin/ImageUploader";
import {
  ConfirmDialog,
  Drawer,
  Field,
  PageHeader,
  Panel,
  QueryState,
  TableScroll,
  Td,
  Th,
  ghostButtonClass,
  inputClass,
  primaryButtonClass,
  rowClass,
} from "@/components/admin/AdminUi";

const EMPTY_FORM = { name: "", description: "", image: "" };

const CategoryForm = ({ category, onDone }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(
    category
      ? {
          name: category.name,
          description: category.description ?? "",
          image: category.image ?? "",
        }
      : EMPTY_FORM,
  );

  const save = useMutation({
    mutationFn: () => {
      const body = { ...form, name: form.name.trim() };
      return category ? categoryService.update(category._id, body) : categoryService.create(body);
    },
    onSuccess: () => {
      toast.success(category ? "Category updated" : "Category created");
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      onDone();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      toast.error("Category name must be at least 2 characters");
      return;
    }
    save.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <Field label="Name">
        <input
          value={form.name}
          onChange={setField("name")}
          className={inputClass}
          placeholder="e.g. Shakers"
        />
      </Field>
      <Field label="Description">
        <textarea
          value={form.description}
          onChange={setField("description")}
          rows={3}
          maxLength={600}
          className={inputClass}
        />
      </Field>
      <Field label="Image">
        <ImageUploader
          images={form.image ? [form.image] : []}
          max={1}
          onChange={(urls) => setForm((prev) => ({ ...prev, image: urls[urls.length - 1] ?? "" }))}
        />
      </Field>
      <div className="flex justify-start gap-3 pt-2">
        <button type="button" onClick={onDone} className={ghostButtonClass}>
          Cancel
        </button>
        <button type="submit" disabled={save.isPending} className={primaryButtonClass}>
          {save.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {category ? "Save changes" : "Create category"}
        </button>
      </div>
    </form>
  );
};

const AdminCategoriesPage = () => {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "categories"], queryFn: categoryService.list });
  const categories = query.data ?? [];

  const [editing, setEditing] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const openForm = (category = null) => {
    setEditing(category);
    setIsFormOpen(true);
  };

  const remove = useMutation({
    mutationFn: (category) => categoryService.remove(category._id),
    onSuccess: () => {
      toast.success("Category deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
    onSettled: () => setPendingDelete(null),
  });

  return (
    <>
      <PageHeader
        title="MANAGE"
        accent="CATEGORIES"
        subtitle={`${categories.length} categories`}
        action={
          <button onClick={() => openForm()} className={primaryButtonClass}>
            <Plus className="w-4 h-4" /> Add category
          </button>
        }
      />

      <Panel>
        <QueryState
          query={query}
          isEmpty={!categories.length}
          emptyMessage="No categories yet. Add your first one."
        >
          <TableScroll>
            <thead>
              <tr>
                <Th>Image</Th>
                <Th>Name</Th>
                <Th>Slug</Th>
                <Th className="text-right">Products</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category._id} className={rowClass}>
                  <Td>
                    {category.image ? (
                      <img
                        src={category.image}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover bg-secondary"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-secondary" />
                    )}
                  </Td>
                  <Td>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                      {category.description}
                    </p>
                  </Td>
                  <Td className="text-muted-foreground">{category.slug}</Td>
                  <Td className="text-right">{category.productCount ?? 0}</Td>
                  <Td className="text-right whitespace-nowrap">
                    <button
                      aria-label={`Edit ${category.name}`}
                      onClick={() => openForm(category)}
                      className="p-2 text-muted-foreground hover:text-primary"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      aria-label={`Delete ${category.name}`}
                      onClick={() => setPendingDelete(category)}
                      className="p-2 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableScroll>
        </QueryState>
      </Panel>

      <Drawer
        open={isFormOpen}
        title={editing ? "EDIT CATEGORY" : "NEW CATEGORY"}
        onClose={() => setIsFormOpen(false)}
      >
        {isFormOpen && (
          <CategoryForm
            key={editing?._id ?? "new"}
            category={editing}
            onDone={() => setIsFormOpen(false)}
          />
        )}
      </Drawer>

      <ConfirmDialog
        open={!!pendingDelete}
        title="DELETE CATEGORY?"
        message={`"${pendingDelete?.name}" will be removed. Categories that still contain products cannot be deleted.`}
        isBusy={remove.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => remove.mutate(pendingDelete)}
      />
    </>
  );
};

export default AdminCategoriesPage;
