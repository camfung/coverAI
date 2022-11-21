document.querySelector("#playlist-name").innerHTML = localStorage.getItem("name");
document.querySelector("#banner").src = localStorage.getItem("img");

const get_tracks = () => {
    console.log("get tracks called")
    let href = localStorage.getItem("song");
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
        doc = JSON.parse(this.responseText);
        console.log(doc)
        prompt = ""
        for (let i = 0; i < doc.length; i++){
            prompt += doc[i];
        }
        console.log(prompt)
    }
    
    xhr.open("GET", "http://localhost:8000/playlist-tracks" + "?href="+href);
    xhr.send();
    
    
}