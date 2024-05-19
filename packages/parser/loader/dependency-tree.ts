const tree = [];
window._tree = tree;
function findTreeNode(tree, module) {
  for (const node of tree) {
    if (node.module === module) return node;
    if (node.children) {
      const res = findTreeNode(node.children, module);
      if (res) return res;
    }
  }
  return null;
}

export function insertNode(parent, child) {
  if (!parent) tree.push({ module: child });
  else {
    const node = findTreeNode(tree, parent);
    if (node) {
      if (!node.children) node.children = [];
      node.children.push({ module: child });
    } else {
      tree.push({ module: parent, children: [{ module: child }] });
    }
  }
}
