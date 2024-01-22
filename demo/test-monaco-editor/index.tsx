import { createRoot } from "react-dom/client"
import * as React from 'react'
import { App } from "./app"
import "./index.css"

const rootDom = document.getElementById("app")
const root = createRoot(rootDom)
root.render(<App />)