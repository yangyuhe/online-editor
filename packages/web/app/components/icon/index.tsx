import cn from "classnames"
export default function Icon(props: { name: string, className?: string; }) {
    const { name, className } = props
    return <svg className={cn("icon", className)} aria-hidden="true">
        <use xlinkHref={"#online-editor-" + name}></use>
    </svg>
}