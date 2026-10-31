import { useQuery, useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { categoryService, productService, reviewService } from "@/services";
import { normalizeProduct } from "@/utils/format";

const FIVE_MINUTES = 5 * 60 * 1000;

export const useProducts = (params = {}, options = {}) =>
  useQuery({
    queryKey: ["products", params],
    queryFn: async () => {
      const { items, pagination } = await productService.list(params);
      return { products: items.map(normalizeProduct), pagination };
    },
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
    ...options,
  });

export const useProduct = (idOrSlug) =>
  useQuery({
    queryKey: ["product", idOrSlug],
    queryFn: async () => {
      const product = await productService.get(idOrSlug);
      return {
        ...normalizeProduct(product),
        relatedProducts: (product.relatedProducts ?? []).map(normalizeProduct),
      };
    },
    enabled: Boolean(idOrSlug),
  });

export const useCategories = () =>
  useQuery({
    queryKey: ["categories"],
    queryFn: categoryService.list,
    staleTime: FIVE_MINUTES,
  });

export const useProductFilters = () =>
  useQuery({
    queryKey: ["product-filters"],
    queryFn: productService.filters,
    staleTime: FIVE_MINUTES,
  });

export const useRecentReviews = (limit = 4) =>
  useQuery({
    queryKey: ["reviews", "recent", limit],
    queryFn: () => reviewService.recent(limit),
    staleTime: FIVE_MINUTES,
  });

export const useInfiniteProducts = (params = {}) =>
  useInfiniteQuery({
    queryKey: ["products", "infinite", params],
    queryFn: async ({ pageParam }) => {
      const { items, pagination } = await productService.list({ ...params, page: pageParam });
      return { products: items.map(normalizeProduct), pagination };
    },
    initialPageParam: 1,
    getNextPageParam: ({ pagination }) =>
      pagination.page < pagination.pages ? pagination.page + 1 : undefined,
    placeholderData: keepPreviousData,
  });
