import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../services/api";
import type { HelloResponse } from "../types/api";

export function useHello() {
  return useQuery({
    queryKey: ["hello"],
    queryFn: () => apiFetch<HelloResponse>("/hello"),
  });
}