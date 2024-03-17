
function createBookmark(leafNode) {
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
        chrome.bookmarks.create({
            'parentId': leafNode[1].id,
            'title': tabs[0].title,
            'url':tabs[0].url,
        });
    });
}
function generateParentsForFolder(id, currentString) {
    return chrome.bookmarks
        .get(id)
        .then((node)=>{
            let nextString = currentString + "<" + node[0].title
            if(currentString === "") {
                nextString = node[0].title
            }
            if(!node[0].parentId) {
                return nextString
            } else {
                return generateParentsForFolder(node[0].parentId, nextString)
            }
        }).catch(console.error)
}
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
            if(checkMatches(leafNode[0])){
                const li = document.createElement("li")
                const a = document.createElement("a")
                a.addEventListener("click", () => {
                    createBookmark(leafNode)
                })
                if (event.keyCode === 13) {
                    createBookmark(leafNode)
                }
                generateParentsForFolder(leafNode[1].id, "")
                .then((result)=>{
                    a.textContent = result
                    // console.log(result)
                })
                li.appendChild(a)
                console.log(leafNode[1])
                ul.appendChild(li)
            }
        }
        results.appendChild(ul)
    })
    if(event.keyCode == 13) {
        window.close()
    }
}



function getBookmarks(nodes, leafNodes) {
    for(const node of nodes) {
        if(!node.url) {
            leafNodes.push([node.title, node])
        }
        if(node.children) {
            getBookmarks(node.children, leafNodes)
        }
    }
}

document.getElementById("searchBookmarks").focus()
document.getElementById("searchBookmarks").addEventListener("keydown", updateTree)