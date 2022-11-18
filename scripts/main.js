if (localStorage.login === "true") {
    console.log("logged in")

    
    let doc;
    const xhr = new XMLHttpRequest();
    // console.log("xhr", xhr);
    xhr.onload = function() {
        doc = JSON.parse(this.responseText);
        const template = document.querySelector("#playlist-template");
        console.table(doc)
        // console.log(doc[0].images[0].imageUrl)

        for (let i = 0 ; i < doc.length; i++){
            let imageUrl = doc[i].imageUrl;
            let name = doc[i].name;
            let trackUrl = doc[i].trackUrl;
            localStorage.setItem(name, trackUrl);
            let newEle = template.content.cloneNode(true);
            newEle.querySelector(".playlist-name").textContent = name;
            newEle.querySelector(".playlist-image").src = imageUrl;
            document.querySelector("#playlists-holder").appendChild(newEle);
        }

        let playlists = document.querySelectorAll(".playlist")
        for (ele of playlists){
            ele.addEventListener("click", call)
        }
    }

    xhr.open("GET", "http://localhost:8000/getPlaylists");
    xhr.send();
}

const call = () =>{
    console.log("called")
}