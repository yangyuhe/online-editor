import React, { Profiler, Suspense, startTransition, useDeferredValue, useState } from "react";
import { Bar } from "./Bar";
import Albums from "./dynamic";

let cache = {}
function Throw(props: { url }) {
    const { url } = props
    console.log("url:", url)
    if (!cache[url]) {
        cache[url] = [new Promise((res, rej) => {
            setTimeout(() => {
                let data = "url complete:" + url
                res(data)
                cache[url].push(data)
            }, 3000);
        })]
        throw cache[url][0]
    } else {
        if (!cache[url][1]) throw cache[url][0]
    }
    return <h1>{cache[url][1]}</h1>
}
function Foo(props: { query }) {
    const { query } = props
    console.log("FOO:", query)
    return <div style={{ color: 'blue' }}>{query}</div>
}
function Test(props: { children }) {
    const { children } = props
    return <div style={{ color: 'red' }}>{children}</div>
}
const WTest = React.memo(Test)

function ErrorFunc() {
    throw new Error("this is error")
    return null;
}
export function App() {
    const [query, setQuery] = useState('')
    const deferedQuery = useDeferredValue(query)
    console.log('deferedQuery:', deferedQuery)
    return (
        <Profiler id="root" onRender={function (id, phase, actualDuration, baseDuration, startTime, commitTime) {
            console.log("root:", id, phase, actualDuration, baseDuration, startTime, commitTime)
        }}>
            {/* <Bar />
            <Suspense fallback={<div>Loading...</div>}>
                <Albums artistId="the-beatles" />
            </Suspense>*/}
            <Suspense fallback={<div>throwing</div>}>
                <Profiler id="throw" onRender={function (id, phase, actualDuration, baseDuration, startTime, commitTime) {
                    console.log("throw:", id, phase, actualDuration, baseDuration, startTime, commitTime)
                }}>
                    <Throw url={deferedQuery} />
                </Profiler>
            </Suspense>
            <Profiler id="counter" onRender={function (id, phase, actualDuration, baseDuration, startTime, commitTime) {
                console.log("counter:", id, phase, actualDuration, baseDuration, startTime, commitTime)
            }}>
                <Bar />
            </Profiler>
            query:<input onChange={evt => {
                setQuery(evt.target.value)

            }
            }></input>
            query:{query}
            deferedQuery:{deferedQuery}
            {/* <Throw url={deferedQuery} /> */}
            {/* <WTest>
                <Foo query={deferedQuery} />
            </WTest> */}
        </Profiler>
    );
}
