import { Suspense, useEffect, useState } from "react";
import { useRouter } from "@/lib/router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminService, productService } from "@/services";
import { getErrorMessage } from "@/services/api";
import InlineNumberInput from "@/components/admin/InlineNumberInput";
import { LOW_STOCK_LIMIT } from "@/components/admin/productFormModel";
import {
  ConfirmDialog,
  PageHeader,
  Pagination,
  Panel,
  QueryState,
  TableScroll,
  Td,
  Th,
  Toggle,
  inputClass,
  primaryButtonClass,
  rowClass,
} from "@/components/admin/AdminUi";

const PAGE_SIZE = 10;

const useDebouncedValue = (value, delay = 350) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

const ProductRow = ({ product, onEdit, onDelete, onPatch, isPatching }) => {
  const isLowStock = product.stock <= LOW_STOCK_LIMIT;
  return (
    <tr className={rowClass}>
      <Td>
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt=""
            className="w-12 h-12 rounded-lg object-cover bg-secondary"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-secondary" />
        )}
      </Td>
      <Td className="max-w-[16rem]">
        <p className="font-medium line-clamp-2">{product.name}</p>
        <p className="text-xs text-muted-foreground">{product.sku}</p>
      </Td>
      <Td className="whitespace-nowrap">{product.category?.name ?? "—"}</Td>
      <Td>
        <InlineNumberInput
          prefix="₹"
          label={`Price for ${product.name}`}
          value={product.price}
          disabled={isPatching}
          onCommit={(price) => onPatch(product, { price })}
        />
      </Td>
      <Td>{product.discountPercent ? `${product.discountPercent}%` : "—"}</Td>
      <Td>
        <div className="flex items-center gap-2">
          <InlineNumberInput
            integer
            label={`Stock for ${product.name}`}
            value={product.stock}
            disabled={isPatching}
            onCommit={(stock) => onPatch(product, { stock })}
            className={isLowStock ? "border-destructive text-destructive" : ""}
          />
          {isLowStock && (
            <span title="Low stock" className="text-destructive">
              <AlertTriangle className="w-4 h-4" />
            </span>
          )}
        </div>
      </Td>
      <Td>
        <Toggle
          label={`Featured: ${product.name}`}
          checked={!!product.featured}
          disabled={isPatching}
          onChange={(featured) => onPatch(product, { featured })}
        />
      </Td>
      <Td>
        <Toggle
          label={`Active: ${product.name}`}
          checked={!!product.isActive}
          disabled={isPatching}
          onChange={(isActive) => onPatch(product, { isActive })}
        />
      </Td>
      <Td className="text-right whitespace-nowrap">
        <button
          aria-label={`Edit ${product.name}`}
          onClick={() => onEdit(product)}
          className="p-2 text-muted-foreground hover:text-primary"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          aria-label={`Delete ${product.name}`}
          onClick={() => onDelete(product)}
          className="p-2 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </Td>
    </tr>
  );
};

const AdminProductsContent = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState(null);
  const debouncedSearch = useDebouncedValue(search.trim());

  const query = useQuery({
    queryKey: ["admin", "products", debouncedSearch, page],
    queryFn: () =>
      adminService.products({ search: debouncedSearch || undefined, page, limit: PAGE_SIZE }),
    placeholderData: (previous) => previous,
  });
  const products = query.data?.items ?? [];

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const patch = useMutation({
    mutationFn: ({ product, changes }) => productService.update(product._id, changes),
    onSuccess: () => {
      toast.success("Product updated");
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const remove = useMutation({
    mutationFn: (product) => productService.remove(product._id),
    onSuccess: () => {
      toast.success("Product deleted");
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
    onSettled: () => setPendingDelete(null),
  });

  const openForm = (product = null) => {
    router.push(product ? `/admin/products/${product._id}/edit` : "/admin/products/new");
  };

  return (
    <>
      <PageHeader
        title="MANAGE"
        accent="PRODUCTS"
        subtitle={query.data ? `${query.data.pagination.total} products` : undefined}
        action={
          <button onClick={() => openForm()} className={primaryButtonClass}>
            <Plus className="w-4 h-4" /> Add product
          </button>
        }
      />

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name, SKU, category..."
          className={`${inputClass} pl-11 rounded-full`}
        />
      </div>

      <Panel>
        <QueryState
          query={query}
          isEmpty={!products.length}
          emptyMessage={
            debouncedSearch
              ? "No products match your search."
              : "No products yet. Add your first one."
          }
        >
          <TableScroll>
            <thead>
              <tr>
                <Th>Image</Th>
                <Th>Name</Th>
                <Th>Category</Th>
                <Th>Price</Th>
                <Th>Disc.</Th>
                <Th>Stock</Th>
                <Th>Featured</Th>
                <Th>Active</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <ProductRow
                  key={product._id}
                  product={product}
                  onEdit={openForm}
                  onDelete={setPendingDelete}
                  onPatch={(target, changes) => patch.mutate({ product: target, changes })}
                  isPatching={patch.isPending && patch.variables?.product._id === product._id}
                />
              ))}
            </tbody>
          </TableScroll>
          <Pagination pagination={query.data?.pagination} onPage={setPage} />
        </QueryState>
      </Panel>

      <ConfirmDialog
        open={!!pendingDelete}
        title="DELETE PRODUCT?"
        message={`"${pendingDelete?.name}" and its reviews will be permanently deleted.`}
        isBusy={remove.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => remove.mutate(pendingDelete)}
      />
    </>
  );
};

const AdminProductsPage = () => (
  <Suspense>
    <AdminProductsContent />
  </Suspense>
);

export default AdminProductsPage;
