String.prototype.trimChar = function (char) {
  return this.split(char)
    .filter(Boolean)
    .join(char);
};
let srcCount = 0;

const queue = [];
let runningCount = 0;
const MAX_TASK = 200;

function loopFetch() {
  while (queue.length > 0 && runningCount < MAX_TASK) {
    const item = queue.shift();
    runningCount++;
    fetch(item[0])
      .then((res) => item[1](res))
      .catch((err) => item[2](err))
      .finally(() => {
        runningCount--;
        loopFetch();
      });
  }
}
function myFetch(url) {
  return new Promise((resolve, reject) => {
    if (runningCount > MAX_TASK) {
      queue.push([url, resolve, reject]);
      return;
    }
    runningCount++;
    return fetch(url)
      .then((httpRes) => resolve(httpRes))
      .catch((err) => reject(err))
      .finally(() => {
        runningCount--;
        loopFetch();
      });
  });
}

define(['loader/db'], function (db) {
  const cache = {}

  return {
    async getFileContent(moduleName) {
      if (cache[moduleName]) {
        if (!cache[moduleName])
          debugger;
        return cache[moduleName];
      }

      async function fetchData(moduleName) {
        try {
          const res = await db.getItem(moduleName)
          return res;
        } catch (err) {
          return myFetch(`/api/file?module=${moduleName}`)
            .then(res => res.json()).then(json => json.data).then(data => {
              if (moduleName.split("/").includes("node_modules"))
                db.setItem(moduleName, data)
              return data;
            })
        }
      }
      cache[moduleName] = fetchData(moduleName).then((data) => {
        if (data) {
          cache[data.file] = data
        } else {
          debugger
        }
        return data
      });
      return cache[moduleName];
    }
  };
});
