import cors from "cors";
import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(__dirname, "..", "..", "..", "mcap-data");
const rootDir = path.resolve(process.env.MCAP_ROOT ?? defaultRoot);
const port = Number(process.env.PORT ?? 3100);

function toPosixPath(inputPath: string) {
  return inputPath.split(path.sep).join("/");
}

function resolveWithinRoot(relPath: string) {
  const cleaned = relPath.replace(/^\/+/, "");
  const resolved = path.resolve(rootDir, cleaned);
  const relative = path.relative(rootDir, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Path escape detected");
  }
  return resolved;
}

type TreeNode = {
  name: string;
  path: string;
  type: "folder" | "file";
  children?: TreeNode[];
};

async function buildTree(dir: string, relBase: string): Promise<TreeNode[]> {
  let entries: fs.Dirent[] = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const folders: TreeNode[] = [];
  const files: TreeNode[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;

    const entryRel = relBase ? path.posix.join(relBase, entry.name) : entry.name;
    const entryAbs = path.resolve(dir, entry.name);

    if (entry.isDirectory()) {
      const children = await buildTree(entryAbs, entryRel);
      if (children.length > 0) {
        folders.push({
          name: entry.name,
          path: entryRel,
          type: "folder",
          children,
        });
      }
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".mcap")) {
      files.push({
        name: entry.name,
        path: entryRel,
        type: "file",
      });
    }
  }

  folders.sort((a, b) => a.name.localeCompare(b.name));
  files.sort((a, b) => a.name.localeCompare(b.name));

  return [...folders, ...files];
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/config", (_req, res) => {
  res.json({
    rootDir,
  });
});

app.get("/api/tree", async (_req, res) => {
  const children = await buildTree(rootDir, "");
  const tree: TreeNode = {
    name: path.basename(rootDir),
    path: "",
    type: "folder",
    children,
  };
  res.json(tree);
});

app.get("/api/file", async (req, res) => {
  const relPath = typeof req.query.path === "string" ? req.query.path : "";
  if (!relPath) {
    res.status(400).json({ error: "path is required" });
    return;
  }

  let filePath = "";
  try {
    filePath = resolveWithinRoot(relPath);
  } catch {
    res.status(400).json({ error: "invalid path" });
    return;
  }

  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      res.status(404).json({ error: "not a file" });
      return;
    }
  } catch {
    res.status(404).json({ error: "not found" });
    return;
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.type("application/octet-stream");
  res.sendFile(filePath);
});

app.listen(port, () => {
  const relRoot = toPosixPath(path.relative(process.cwd(), rootDir));
  console.log(`[mcap-file-server] listening on http://localhost:${port}`);
  console.log(`[mcap-file-server] MCAP root: ${relRoot || "."}`);
});
