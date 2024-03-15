

function updateTree(event) {
    const value = event.target.value
    function checkMatches(nodevalue){
        return nodevalue.toLowerCase().includes(value.toLowerCase())
    }
    chrome.bookmarks.getTree((tree) => {
        const leafNodes = []
        getBookmarks(tree[0].children, leafNodes)
        const results = document.getElementById("bookMarkResults")
        results.innerHTML = ''
        const ul = document.createElement("ul")
        for(const leafNode of leafNodes){
            if(checkMatches(leafNode[0]) || checkMatches(leafNode[1].url)){
                const li = document.createElement("li")
                const a = document.createElement("a")
                a.addEventListener("click", () => {
                    chrome.tabs.create({url: leafNode[1].url, active: false});
                })
                a.textContent = leafNode[0]
                li.appendChild(a)
                console.log(leafNode[1])
                ul.appendChild(li)
            }
        }
        results.appendChild(ul)
    })
}



function getBookmarks(nodes, leafNodes) {
    for(const node of nodes) {
        if(node.url) {
            leafNodes.push([node.title, node])
        }
        if(node.children) {
            getBookmarks(node.children, leafNodes)
        }
    }
}

document.getElementById("searchBookmarks").addEventListener("keydown", updateTree)