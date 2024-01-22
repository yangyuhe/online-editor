await new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve()
    }, 3000);
})
console.log("in foo")
export function foo() {
    console.log("foo")
}