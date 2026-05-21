// React hooks that wrap the generated VulnerabilityCm SDK and apply the
// FE adapters. Components should only import from here, not from
// `./generated/*` directly.

"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

import type { Vulnerability } from "@/lib/types";

import { fromApiRow, toApiFilter, toBulkUpdateItems } from "./adapters";
import type { UiVulnerabilityFilters } from "./adapters";
import { VulnerabilityCm } from "./generated";
import type {
  ApiVulnerabilityRow,
  GetVulnerabilityCmResponse,
  VulnerabilityFilterOptionsResponse,
} from "./responses";

const QUERY_KEYS = {
  filterOptions: ["filter-options"] as const,
  vulnerabilities: (
    filters: UiVulnerabilityFilters,
    pageNumber: number,
    pageSize: number,
  ) => ["vulnerabilities", { filters, pageNumber, pageSize }] as const,
};

export interface VulnerabilitiesResult {
  rows: Vulnerability[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
}

export interface UseVulnerabilitiesParams {
  filters: UiVulnerabilityFilters;
  pageNumber?: number;
  pageSize?: number;
  enabled?: boolean;
}

// Fetches a page of vulnerabilities and adapts each row to the FE
// `Vulnerability` shape. Cache key is the full filter+pagination tuple.
export function useVulnerabilities({
  filters,
  pageNumber = 1,
  pageSize = 5000,
  enabled = true,
}: UseVulnerabilitiesParams) {
  return useQuery<VulnerabilitiesResult>({
    queryKey: QUERY_KEYS.vulnerabilities(filters, pageNumber, pageSize),
    enabled,
    queryFn: async ({ signal }) => {
      const body = toApiFilter(filters, { pageNumber, pageSize });
      const { data } = await VulnerabilityCm.postApiV2VulnerabilityCmGetVulnerabilityCm({
        body,
        signal,
        throwOnError: true,
      });
      // 200 response is `unknown` in the generated types — assert to the
      // hand-rolled contract in responses.ts.
      const resp = data as unknown as GetVulnerabilityCmResponse;
      return {
        rows: (resp.records ?? []).map((r: ApiVulnerabilityRow) => fromApiRow(r)),
        totalRecords: resp.totalRecords ?? 0,
        pageNumber: resp.pageNumber ?? pageNumber,
        pageSize: resp.pageSize ?? pageSize,
      };
    },
  });
}

// Filter dropdown options. Cached aggressively — they only change with
// reference-data deploys.
export function useFilterOptions(
  options?: Pick<UseQueryOptions<VulnerabilityFilterOptionsResponse>, "enabled">,
) {
  return useQuery<VulnerabilityFilterOptionsResponse>({
    queryKey: QUERY_KEYS.filterOptions,
    enabled: options?.enabled ?? true,
    staleTime: 30 * 60 * 1000, // 30 min
    queryFn: async ({ signal }) => {
      const { data } = await VulnerabilityCm.getApiV2VulnerabilityCmVulnerabilityFilterOption({
        signal,
        throwOnError: true,
      });
      return data as unknown as VulnerabilityFilterOptionsResponse;
    },
  });
}

export interface BulkUpdateVariables {
  rows: Pick<Vulnerability, "id">[];
  patch: Partial<Vulnerability>;
}

// Bulk-update mutation. On success, invalidates the vulnerabilities cache so
// the grid refetches with the freshly-saved values.
//
// TODO(nx-monorepo): when integrated, pull `updatedUserId` from `useAuth()`
// and pass it as `body.id` on the request.
export function useBulkUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ rows, patch }: BulkUpdateVariables) => {
      const items = toBulkUpdateItems(rows, patch);
      await VulnerabilityCm.postApiV2VulnerabilityCmBulkUpdateVcmExtra({
        body: { items },
        throwOnError: true,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["vulnerabilities"] });
    },
  });
}
