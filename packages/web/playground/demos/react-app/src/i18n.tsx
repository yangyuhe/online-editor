import React, { Children } from 'react';

const strSet = new Set();
window.strSet = strSet;

const typeCache = [];

function NewComponent(Com) {
  if (Com.prototype?.render) {
    class NewClass extends Com {
      render() {
        const node = super.render();
        return proxy(node);
      }
    }
    return NewClass;
  }
  if (typeof Com === 'function') {
    function NewClass(...args: any[]) {
      const originNode = Com.call(null, ...args);
      return proxy(originNode);
    }
    return NewClass;
  }
}

function RecursiveReplaceCom(OldType) {
  if (typeof OldType === 'function') {
    if (OldType.name === 'NewClass') {
      return;
    }

    const exist = typeCache.find((i) => i[0] === OldType);
    let NewCom;
    if (exist) {
      NewCom = exist[1];
    } else {
      NewCom = NewComponent(OldType);
      typeCache.push([OldType, NewCom]);
    }
    return NewCom;
  }

  if (OldType.$$typeof?.toString() === 'Symbol(react.forward_ref)') {
    if (typeof OldType.render === 'object') {
      RecursiveReplaceCom(OldType.render);
      return;
    }
    if (OldType.render.name === 'NewClass') return;
    const exist = typeCache.find((i) => i[0] === OldType.render);
    let NewCom;
    if (exist) {
      NewCom = exist[1];
    } else {
      NewCom = NewComponent(OldType.render);
      typeCache.push([OldType.render, NewCom]);
    }
    OldType.render = NewCom;
    return;
  }

  //React.memo
  if (OldType.$$typeof?.toString() === 'Symbol(react.memo)') {
    if (typeof OldType.type === 'object') {
      RecursiveReplaceCom(OldType.type);
      return;
    }
    if (OldType.type.name === 'NewClass') return;
    const exist = typeCache.find((i) => i[0] === OldType.type);
    let NewCom;
    if (exist) {
      NewCom = exist[1];
    } else {
      NewCom = NewComponent(OldType.type);
      typeCache.push([OldType.type, NewCom]);
    }
    OldType.type = NewCom;
    return;
  }
}

function proxy(child) {
  if (child !== undefined && child !== null && typeof child === 'object') {
    const OldType = child.type;

    const oldProps = child.props;
    const newChildren = Children.map(oldProps.children, (child) => {
      return proxy(child);
    });
    const newProps = {
      ...oldProps,
      children: newChildren
    };

    if (typeof OldType === 'string') {
      const newChild = {
        props: newProps
      };
      Object.setPrototypeOf(newChild, child);
      return newChild;
    }

    const res = RecursiveReplaceCom(OldType);
    if (!res) {
      const newChild = {
        props: newProps
      };
      Object.setPrototypeOf(newChild, child);
      return newChild;
    } else {
      const newChild = {
        type: res,
        props: newProps
      };
      Object.setPrototypeOf(newChild, child);
      return newChild;
    }
  }
  if (typeof child === 'string') strSet.add(child);
  return child;
}
export function I18n(props: { children }) {
  const { children } = props;
  return Children.map(children, (child) => {
    return proxy(child);
  });
}
