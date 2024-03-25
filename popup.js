
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
            let nextString = currentString + " | " + node[0].title
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

const UP = 38;
const DOWN = 40;
const ENTER = 13;
function rerender(prevIndex, choosenIndex) {
    const results = document.getElementById("bookMarkResults")
    const entries = results.querySelectorAll("li")
    entries[prevIndex].classList.remove("active")
    entries[choosenIndex].className += " active"
    entries[choosenIndex].scrollIntoView({ block: "center", behavior: "smooth" })
}

function render(leafNodes, choosenIndex) {
    const results = document.getElementById("bookMarkResults")
    results.innerHTML = ''
    const ul = document.createElement("ul")
    ul.className="list-group"
    let leafIndex = 0
    for(const leafNode of leafNodes){
        const li = document.createElement("li")
        li.className="list-group-item"
        if(leafIndex == choosenIndex) {
            li.className += " active"
            li.scrollIntoView({ block: "center", behavior: "smooth" })
        }
        const a = document.createElement("a")
        a.addEventListener("click", () => {
            createBookmark(leafNode)
        })
        a.style.fontSize = "1.2rem"
        generateParentsForFolder(leafNode[1].id, "")
        .then((result)=>{
            a.textContent = result
        })
        li.appendChild(a)
        ul.appendChild(li)
        leafIndex += 1
    }
    results.appendChild(ul)
}

const handleNonAlphaKey = async (keyCode) => {
    let leafNodes = await chrome.storage.local.get("bookmarkSearchResult")
    let index = await chrome.storage.local.get("bookmarkSearchIndex")
    leafNodes = leafNodes["bookmarkSearchResult"]
    index = index["bookmarkSearchIndex"]
    if(keyCode == ENTER)  {
        createBookmark(leafNodes[index])
        window.close()
        return
    }
    let prevIndex = index
    if(keyCode == DOWN) {
        index++;
        index = Math.min(index, leafNodes.length - 1)
    } else if(keyCode == UP) {
        index--;
        index = Math.max(index, 0)
    } else {
        assert(false)
    }

    await chrome.storage.local.set({"bookmarkSearchIndex": index})
    rerender(prevIndex, index)

}

function updateTree(event) {
    const value = event.target.value
    let keyCode = event.keyCode
    if(keyCode == UP || keyCode == DOWN || keyCode == ENTER) {
        handleNonAlphaKey(keyCode)
        return
    }
    function checkMatches(nodevalue){
        return nodevalue.toLowerCase().includes(value.toLowerCase())
    }
    chrome.bookmarks.getTree((tree) => {
        const leafNodes = []
        getBookmarks(tree[0].children, leafNodes)
        let filteredLeafNodes = []
        for(const leafNode of leafNodes){
            console.log(leafNode)
            if(checkMatches(leafNode[0])){
                filteredLeafNodes.push(leafNode)
            }
        }
        filteredLeafNodes.sort((a, b) => {
            return b[1].dateGroupModified - a[1].dateGroupModified
        })
        render(filteredLeafNodes, 0)
        chrome.storage.local.set({"bookmarkSearchResult": filteredLeafNodes})
        chrome.storage.local.set({"bookmarkSearchIndex": 0})
    })
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

document.getElementById("searchBookmarks").addEventListener("keydown", updateTree)
document.getElementById("searchBookmarks").addEventListener("focus", updateTree)
document.getElementById("searchBookmarks").focus()