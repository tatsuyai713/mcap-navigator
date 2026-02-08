import { useEffect, useMemo, useRef, useState } from "react";
import FileTree from "./components/FileTree";
import { buildFileUrl, fetchTree } from "./api";
import type { TreeNode } from "./types";

const rawLichtblickBase =
  (import.meta.env.VITE_LICHTBLICK_URL as string | undefined) ?? "/lichtblick";
const lichtblickBase = rawLichtblickBase.replace(/\/$/, "");

function buildLichtblickUrl(paths: string[]) {
  if (!paths.length) {
    return lichtblickBase;
  }

  const params = new URLSearchParams();
  params.set("ds", "remote-file");
  for (const relPath of paths) {
    params.append("ds.url", buildFileUrl(relPath));
  }

  return `${lichtblickBase}/?${params.toString()}`;
}

export default function App() {
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set([""]));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [iframeSrc, setIframeSrc] = useState(() => buildLichtblickUrl([]));
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  const selectedPaths = useMemo(
    () => Array.from(selected).sort(),
    [selected]
  );

  const loadTree = async () => {
    setLoadError(null);
    try {
      const nextTree = await fetchTree();
      setTree(nextTree);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Load failed");
    }
  };

  useEffect(() => {
    loadTree();
  }, []);

  useEffect(() => {
    setIframeSrc(buildLichtblickUrl(selectedPaths));
  }, [selectedPaths]);

  const handleToggle = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleSelect = (path: string, additive: boolean) => {
    setSelected((prev) => {
      const next = new Set(additive ? prev : []);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const applyKioskTweaks = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const doc = iframe.contentDocument;
      if (!doc) return;

      const styleId = "mcap-kiosk-style";
      if (!doc.getElementById(styleId)) {
        const style = doc.createElement("style");
        style.id = styleId;
        style.textContent = `
          header,
          .MuiAppBar-root,
          [role="menubar"],
          [data-testid*="app-bar"],
          [data-testid*="appbar"],
          [data-testid*="app-menu"],
          [aria-label*="App menu"] {
            display: none !important;
          }
          body,
          #root {
            padding-top: 0 !important;
            margin-top: 0 !important;
          }
        `;
        doc.head.appendChild(style);
      }

      const removeTopBars = () => {
        const selectors = [
          "header",
          ".MuiAppBar-root",
          '[role="menubar"]',
          '[data-testid*="app-bar"]',
          '[data-testid*="appbar"]',
          '[data-testid*="app-menu"]',
          '[aria-label*="App menu"]',
        ];

        selectors.forEach((selector) => {
          doc.querySelectorAll(selector).forEach((el) => {
            (el as HTMLElement).style.display = "none";
          });
        });
      };

      removeTopBars();

      doc.addEventListener(
        "keydown",
        (event) => {
          if (
            (event.ctrlKey || event.metaKey) &&
            ["o", "p", "k"].includes(event.key.toLowerCase())
          ) {
            event.preventDefault();
            event.stopPropagation();
          }
        },
        true
      );

      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      const observer = new MutationObserver(removeTopBars);
      observer.observe(doc.body, { childList: true, subtree: true });
      observerRef.current = observer;
    } catch {
      // Cross-origin iframe; kiosk tweaks will be skipped.
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div>
            <div className="title">MCAP Navigator</div>
            <div className="subtitle">
              {tree?.name ?? "MCAP root"}
            </div>
          </div>
          <button className="ghost-button" onClick={loadTree} type="button">
            Refresh
          </button>
        </div>

        <div className="tree-panel">
          {loadError ? (
            <div className="empty-state">{loadError}</div>
          ) : tree ? (
            <FileTree
              node={tree}
              expanded={expanded}
              selected={selected}
              onToggle={handleToggle}
              onSelect={handleSelect}
            />
          ) : (
            <div className="empty-state">Loading...</div>
          )}
        </div>

        <div className="selection-panel">
          <div className="selection-title">Selected</div>
          {selectedPaths.length ? (
            <ul className="selection-list">
              {selectedPaths.map((path) => (
                <li key={path}>{path}</li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">No MCAP selected</div>
          )}
          <div className="selection-hint">
            {selectedPaths.length
              ? "Click a file to load it into Lichtblick."
              : "Pick an MCAP file to load the viewer."}
          </div>
        </div>
      </aside>

      <main className="viewer">
        <div className="viewer-header">
          <div>
            <div className="viewer-title">Lichtblick Viewer</div>
            <div className="viewer-subtitle">
              {selectedPaths.length
                ? `${selectedPaths.length} file(s) loaded`
                : "Waiting for file selection"}
            </div>
          </div>
          <button
            className="ghost-button"
            onClick={() => setIframeSrc(buildLichtblickUrl(selectedPaths))}
            type="button"
          >
            Reload
          </button>
        </div>

        <div className="viewer-frame">
          <iframe
            ref={iframeRef}
            title="Lichtblick"
            src={iframeSrc}
            onLoad={applyKioskTweaks}
            allow="fullscreen"
          />
        </div>
      </main>
    </div>
  );
}
