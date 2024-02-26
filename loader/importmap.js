export async function handleImportmap() {
    const response = await fetch(`/api/importmap`)
    const res = await response.json()
    const content = `const importmap = document.createElement("script")
    importmap.type = 'importmap'
    importmap.innerHTML = \`
    {
"imports":${JSON.stringify(res.data)}

}\`
    document.head.appendChild(importmap);`
    return new Response(content, {
        status: 200,
        headers: {
            'Content-Type': 'text/javascript',
        }
    })
}