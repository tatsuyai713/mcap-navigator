import type { TreeNode } from "./types";

export async function fetchTree(): Promise<TreeNode> {
  const res = await fetch("/api/tree");
  if (!res.ok) {
    throw new Error("Failed to load tree");
  }
  return res.json();
}

export function buildFileUrl(relPath: string) {
  const url = new URL("/api/file", window.location.origin);
  url.searchParams.set("path", relPath);
  return url.toString();
}
