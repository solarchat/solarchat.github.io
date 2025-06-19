let inboxContent = "";
const inbox = document.getElementById("inbox")
const outbox = document.getElementById("outbox");
let username = "Guest";
let avatar = "https://www.listchallenges.com/f/items2020/4bbc8a3f-b6ce-47bb-bcfe-9b40a00642a5.jpg";
let datetime = "unknown datetime";
let receiving = "uninitialized";
let connected = false;
let myID=-1;
let socket;

try {
    socket = new WebSocket("ws://team.solarorbit.net:8001");
} catch (e) {}

function inputInfo() {
    if (document.getElementById("username_input").value !== "") {
        username = document.getElementById("username_input").value;
        document.getElementById("login_header").innerHTML="Welcome, "+username;
    }
    if (document.getElementById("avatarlink_input").value !== "") {
        avatar = document.getElementById("avatarlink_input").value;
    }
}

socket.onerror = (event) => {
    console.log(event);
    document.getElementById("server_status").innerHTML="Server status: Error";
}

socket.onopen = (event) => {
    console.log("Connection opened");
    document.getElementById("server_status").innerHTML="Server status: Connected";
    connected = true;
}

socket.onmessage = (event) => {

    console.log(`data received ${event.data}`);
    switch (event.data) {
        case "[init start]":
            receiving = "init";
            break;
        case "[init done]":
            receiving = "uninitialized"
            break;
        case "[message]":
            receiving = "message"
            break;
        case "[acknowledged]":
            outbox.setAttribute("placeholder","Send a message")
            break;
    }
    if (receiving === "init") {
        if (myID===-1 && event.data!=="[init start]") {
            myID=event.data
            if (username==="Guest") {
                username+=myID
            }
            console.log(`id: ${myID}`)
        } else {
            let pulled
            try { //dont ask me why it needs a trycatch firefox was just being weird
                pulled = JSON.parse(event.data);
                generateMessageDiv(pulled.username, pulled.datetime, pulled.avatar, pulled.message)
                inbox.scrollTop = inbox.scrollHeight;
            } catch (e) {}
        }

    } else if (receiving === "message") {
        try {
            pulled = JSON.parse(event.data);
            generateMessageDiv(pulled.username, pulled.datetime, pulled.avatar, pulled.message)
            inbox.scrollTop = inbox.scrollHeight;
            receiving="uninitialized";
        } catch (e) {}
    }
}

function generateMessageDiv(username, datetime, avatar, message) {
    inbox.innerHTML += `<div style=\"display: flex; border-bottom: 1px solid #ccc; border-top: 1px solid #ccc\">`+
      `<img src="`+avatar+`" width=48px height=48px> <p style="margin-left: 5px; margin-top: 0;"><b>` +
        username + ` </b>`+datetime+`<br>`+message+`</p>`+
      `</div>`;
}

function updateDateTime() {
    let dateObj = new Date();
    let time="";
    if (dateObj.getUTCMinutes()<10) {
        time = dateObj.getUTCHours()+`:0`+dateObj.getUTCMinutes();
    } else {
        time = dateObj.getUTCHours()+`:`+dateObj.getUTCMinutes();
    }
    //let month = date.toLocaleString('default',{month:'short'});
    let UTCMonth = dateObj.getUTCMonth()+1
    datetime = dateObj.getUTCDate()+`-`+UTCMonth+`-`+dateObj.getUTCFullYear()+`@`+time+``;
}


function sendMessage() {
    if (outbox.value !== "" && connected) {
        updateDateTime();
        console.log(`[message] ${outbox.value}`);
        let toSend = {
            "username":username,
            "datetime":datetime,
            "avatar":avatar,
            "message":outbox.value
        }
        console.log(toSend)
        socket.send(JSON.stringify(toSend));
        //generateMessageDiv(username,datetime,avatar,outbox.value);
        outbox.setAttribute("placeholder","Sending...")
        inbox.scrollTop = inbox.scrollHeight;
        outbox.value = "";
    }
}

outbox.addEventListener("keydown", (e) => {
    if(e.key === 'Enter'){
        e.preventDefault()
        sendMessage()
    }
})
