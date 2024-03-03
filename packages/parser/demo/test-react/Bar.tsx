import * as React from 'react'

export function Bar() {
    const [c, setC] = React.useState(0)
    const add = () => {
        setC(c => c + 1)
    }
    return <div><button onClick={add}>{c}</button></div>
}