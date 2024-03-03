import * as React from 'react'
export default function Counter() {
    const [c, setC] = React.useState(0)
    return <div>话多{c}<button onClick={() => setC(c => c + 1)}>add</button></div>
}