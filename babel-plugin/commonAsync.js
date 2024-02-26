function commonAsync(babel) {
    const t = babel.types;
    const visitor = {
        CallExpression(path) {
            if (path.node.callee.name === 'require' && path.parent.type !== 'AwaitExpression') {
                function replaceParent(path) {
                    const fnParent = path.getFunctionParent()
                    if (fnParent && !fnParent.node.async) {
                        fnParent.node.async = true;
                        if (t.isFunctionDeclaration(fnParent.node)) {
                            const fnName = fnParent.node.id?.name
                            if (fnName && fnParent.scope.parent.bindings[fnName]) {
                                const binding = fnParent.scope.parent.bindings[fnName]
                                if (binding.path === fnParent) {
                                    binding.referencePaths.forEach(item => {
                                        if (t.isCallExpression(item.parent) && !t.isAwaitExpression(item.parentPath.parent)) {
                                            item.parentPath.replaceWith(t.awaitExpression(item.parent))
                                            replaceParent(item.parentPath)
                                        }
                                    })
                                }
                            }
                        }
                        if (t.isFunctionExpression(fnParent.node)) {
                            if (t.isCallExpression(fnParent.parent)) {
                                fnParent.parentPath.replaceWith(t.awaitExpression(fnParent.parent))
                                replaceParent(fnParent.parentPath)
                            }
                        }

                    }
                }
                replaceParent(path)
                path.replaceWith(t.awaitExpression(path.node))

            }
        },
    };
    return { visitor };
}



Babel.registerPlugin('commonAsync', commonAsync);
