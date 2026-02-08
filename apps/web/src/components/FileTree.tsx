import type { MouseEvent } from "react";
import type { TreeNode } from "../types";
import "./FileTree.css";

type Props = {
  node: TreeNode;
  expanded: Set<string>;
  selected: Set<string>;
  onToggle: (path: string) => void;
  onSelect: (path: string, additive: boolean) => void;
};

function TreeRow({
  node,
  depth,
  expanded,
  selected,
  onToggle,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  expanded: Set<string>;
  selected: Set<string>;
  onToggle: (path: string) => void;
  onSelect: (path: string, additive: boolean) => void;
}) {
  const isFolder = node.type === "folder";
  const isExpanded = expanded.has(node.path);
  const isSelected = selected.has(node.path);

  const handleToggle = () => {
    if (isFolder) onToggle(node.path);
  };

  const handleSelect = (event: MouseEvent) => {
    if (!isFolder) {
      onSelect(node.path, event.metaKey || event.ctrlKey);
    }
  };

  return (
    <div className="tree-node">
      <div
        className={`tree-row ${isSelected ? "is-selected" : ""}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {isFolder ? (
          <button
            className={`tree-toggle ${isExpanded ? "is-open" : ""}`}
            onClick={handleToggle}
            aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
            type="button"
          >
            {isExpanded ? "▾" : "▸"}
          </button>
        ) : (
          <span className="tree-toggle placeholder" />
        )}
        <button
          className={`tree-label ${isFolder ? "is-folder" : "is-file"}`}
          onClick={isFolder ? handleToggle : handleSelect}
          type="button"
        >
          <span className="tree-icon" aria-hidden="true" />
          <span className="tree-name">{node.name}</span>
        </button>
      </div>
      {isFolder && isExpanded && node.children?.length
        ? node.children.map((child) => (
            <TreeRow
              key={child.path}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              selected={selected}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))
        : null}
    </div>
  );
}

export default function FileTree({
  node,
  expanded,
  selected,
  onToggle,
  onSelect,
}: Props) {
  return (
    <div className="tree">
      <TreeRow
        node={node}
        depth={0}
        expanded={expanded}
        selected={selected}
        onToggle={onToggle}
        onSelect={onSelect}
      />
    </div>
  );
}
