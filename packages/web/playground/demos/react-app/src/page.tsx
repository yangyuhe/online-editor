import React, { useEffect, useState } from 'react';

function _Page(props: { children: any }) {
  const { children } = props;
  const [list, setList] = useState([]);
  console.log('this is page');
  useEffect(() => {
    console.log('page:useeffect');
    setList([{ name: 'one' }]);
  }, []);
  return (
    <ul>
      {children}:
      {list.map((i) => (
        <li key={i.name}>{i.name}</li>
      ))}
      <button
        onClick={() => {
          setList((items) => items.concat({ name: new Date().toString() }));
        }}
      >
        add
      </button>
    </ul>
  );
}

export class PageOne extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      list: []
    };
  }
  componentDidMount(): void {
    console.log('page:useeffect');
    this.setState({
      list: [{ name: 'one' }]
    });
  }

  render() {
    console.log('this is page');
    const { children } = this.props;
    return (
      <ul>
        {children}:
        {this.state.list.map((i) => (
          <li key={i.name}>{i.name}</li>
        ))}
        <button
          onClick={() => {
            this.setState((state) => {
              return {
                list: state.list.concat({ name: new Date().toString() })
              };
            });
          }}
        >
          add
        </button>
      </ul>
    );
  }
}
export const Page = React.memo(PageOne);

export class Cat extends React.Component {
  render() {
    return <div>this is cat</div>;
  }
}

export function ProxyPage(...args) {
  const node = Page.call(null, ...args);
  debugger;
  return node;
}
