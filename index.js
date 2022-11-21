// requires
const express = require("express");
const app = express();
const fs = require("fs");
const axios = require("axios");
const qs = require("querystring");

const { Configuration, OpenAIApi } = require("openai");

const openai = require("openai");
const { send } = require("process");


let access_token = null;
const authorize = "https://accounts.spotify.com/authorize";
const TOKEN = "https://accounts.spotify.com/api/token"
CLIENT_ID = "8185081e41dd43d98ce0316fb6b109b1";
CLIENT_SECRET = "";
REDIRECT_URI = "http://localhost:8000/callback";
const stateKey = 'spotify_auth_state';

axios.defaults.baseURL = 'https://api.spotify.com/v1';
axios.defaults.headers['Authorization'] = `Bearer ${access_token}`;
axios.defaults.headers['Content-Type'] = 'application/json';

app.use("/scripts", express.static("./scripts"));
app.use("/styles", express.static("./styles"));
app.use("/images", express.static("./images"));

app.get("/", (req, res) => {
    sendHtml("index", res);
})

app.get("/login", (req, res) => {
    sendHtml("login", res)
})

app.get("/main" , (req, res) => {
    sendHtml("main", res);
})

/**
 * End point that gets code from spoftify in 
 * preparation for requesting the auth token.
 */
 app.get("/spotifyLogin", (req, res) => {
    // const state = generateRandomString(16);
    const scope = "user-read-private user-read-email playlist-read-private playlist-read-collaborative"
    // res.cookie(stateKey, state);
    const queryParams = qs.stringify({
        client_id : CLIENT_ID, 
        response_type: "code", 
        redirect_uri: REDIRECT_URI, 
        // state: state,
        scope: scope,
    });

    // redirects to spotify to get the code.
    let data = {
        url: authorize + "?" + queryParams
    }
    res.send(data);
})

/** 
 * Redirect uri that was given to spotify.
 * Exchanges the code for the access token. 
 * Saves the access token into access_token.
 */
 app.get("/callback", (req, res) => {
    const code = req.query.code || null;

    axios({
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        data: qs.stringify({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: REDIRECT_URI
        }),
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${new Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
        },
      })
        .then(response => {
          if (response.status === 200) {
            access_token = response.data.access_token;
            
            sendHtml("main", res)
            

        } else {
            res.send(response);
          }
        })
        .catch(error => {
          res.send(error);
        });
    });

app.get("/getPlaylists", (req, res) => {
    axios({
        method: 'get',
        url: 'https://api.spotify.com/v1/me/playlists?limit=20&offset=0',
        headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${access_token}`,
        }
    })
    .then(response => {
        let data = [];
        let numItems = Object.keys(response.data.items).length
        
        for (let i = 0 ; i < numItems; i++){
            data.push({
                name: response.data.items[i].name,
                imageUrl: response.data.items[i].images[0].url,
                trackUrl: response.data.items[i].tracks.href,
            });
        }    
        res.send(data);
    })
    .catch(error => {
        res.send(error)
    })
})

app.get("/playlist-view", (req, res) => {
  sendHtml("playlist", res);
})

app.get("/playlist-tracks", (req, res) => {
  // sendHtml("playlist", res)
  let href = req.query.href
  axios({
    method: 'get',
    url: href + "?fields=items(track(name))",
    headers: {
      "Accept" : "application/json",
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access_token}`,
    }
  })
  .then( async response => {
    data = [];
    let numSongs = response.data.items.length;
    for (let i = 0 ; i < numSongs; i++){
      data.push(response.data.items[i].track.name)
    }
    let prompt = ""
    for (let i = 0; i < 5; i++) {
      let r = getRandomInt(numSongs);
      prompt += data[r] + " "
    }
    console.log(prompt)

    let key = "";
    const configuration = new Configuration({
      apiKey: key
  });
  const openai = new OpenAIApi(configuration);

  predict(prompt, openai)
    .then(
        response => {
            const now = Date.now();
            for (let i = 0; i < response.data.length; i++)
            {
                const b64 = response.data[i]['b64_json'];
                const buffer = Buffer.from(b64, "base64");
                const filename = `image_${now}_${i}.png`;
                console.log("Writing image " + filename);
                fs.writeFileSync(filename, buffer);
            }
            res.send("worked!")
        }
    )
  })
  .catch(error => {
    console.log(error)
    res.send(error)
  })

})

app.get("/get-image", async (req, res) => {

    const configuration = new openai.Configuration({
      apiKey : "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"
    })

  const openai = new openai.OpenAIApi(configuration);

  const prompt = "a hamster wearing a pirate hat with a hook on its paw digital art";

  const result = await openai.createImage({
      prompt, 
      n: 1, 
      size: "256x256",
      user: "CameronFung"
  });

  const url = result.data.data[0].url;

  // const url = "https://oaidalleapiprodscus.blob.core.windows.net/private/org-QeC7ZTxfNMcvjFmNESArRyDj/user-3opTxCsowq2CdcrpHmBcGVmZ/img-AmRoXGiCGmGm3AWdwjwXUa6W.png?st=2022-11-04T22%3A03%3A51Z&se=2022-11-05T00%3A03%3A51Z&sp=r&sv=2021-08-06&sr=b&rscd=inline&rsct=image/png&skoid=6aaadede-4fb3-4698-a8f6-684d7786b067&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2022-11-04T01%3A20%3A27Z&ske=2022-11-05T01%3A20%3A27Z&sks=b&skv=2021-08-06&sig=FF5%2BdFP54nXxvR6tHCweuogO77hYVfx2Tksccgbrukk%3D";

  // save url to disk
  const imgResult = await fetch(url);
  const blob = await imgResult.blob();
  const buffer = Buffer.from( await blob.arrayBuffer() );
  fs.writeFileSync( `./images/${Date.now()}.png`, buffer );

})

let sendHtml = (url, res) => {
    let doc = fs.readFileSync("html/" + url + ".html", "utf-8");
    res.send(doc);
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

const predict = async function (prompt, openai) {
  const response = await openai.createImage({
      prompt: prompt,
      n: 1,
      size: "256x256",
      // size: "1024x1024",
      response_format: 'b64_json',
  });

  return response.data;
}


/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
 const generateRandomString = length => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };


let port = 8000;
app.listen(port, () => {
    console.log("server running on http://localhost:" + port)
})
