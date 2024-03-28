import { useProjectContext } from "./context";

export default function Directory() {
    const { dir } = useProjectContext()
    return <div className="xxx">{dir?.name}</div>
}