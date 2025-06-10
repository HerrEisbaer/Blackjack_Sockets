const params = new URLSearchParams(window.location.search)

const roomid = params.get('roomid')
const username = params.get('name')

if (roomid === '' || roomid == null || username === '' || username === null) {
    window.location.href = "http://127.0.0.1:5500"
    alert("Ein Fehler ist passiert und du wurdest zurück auf die Startseite geschickt. Probiere das nächste mal eine gültige Raum ID :)")
}

var socket = io()

const table = document.getElementById("table")

var gestartet = false

if (!gestartet) {
    table.classList.add("blur")
}

var bereit = true

const bereitbtn = document.getElementById("bereitbtn")
bereitbtn.addEventListener('click', function() {
    if (bereitbtn.classList.contains('ready')) {
        bereit = false
    } else {
        bereit = true
    }
    socket.emit('setreadystatus', bereit, sollichstarten => {
        if (sollichstarten) {
            startGame()
        } else {
            newNotify("Spiel konnte nicht gestartet werden. Grund: Es gibt keinen Croupier.")
        }
    })
    bereitbtn.classList.toggle('ready', bereit)
})

socket.on('startgame', () => {
    startGame()
})

const bereitbtncontainer = document.getElementsByClassName("eingabe-container")[0]

function startGame() {
    bereitbtncontainer.remove()
    table.classList.remove("blur")
    newNotify("Die Karten werden nun ausgegeben.")
}

var dealooooor

socket.emit('newconnection', roomid, username, res => {
    if (res[0] >= 5) {
        window.location.href = "http://localhost:3000"
        alert("Dieser Raum ist bereits voll. Bitte suche einen anderen.")
    }
    if (res[0] == 1 & res[1] == null) {
        testforDealer()
    }
    socket.emit('chechifgamestarted', obgestartet => {
        if (obgestartet) {
            window.location.href = "http://localhost:3000"
            alert("Dieser Raum ist bereits gestartet. Warte, bis die Runde vorbei ist.")
        }
    })
    newCardholder(res[0], res[2])
})

const testfordealercontainer = document.getElementsByClassName("dealer-test-container")[0]

const testdealertem = document.getElementById("dealer-test-tem")

function testforDealer() {
    const testdealerdiv = testdealertem.content.cloneNode(true).children[0]
    const jabutton = testdealerdiv.getElementsByClassName("dealer-test-button-ja")[0]
    jabutton.addEventListener('click', () => {
        testfordealercontainer.classList.add("fadeouttop")
        setTimeout(() => {
            testdealerdiv.remove()
        }, 2000);
        socket.emit('setDealerOfRoom', callback => {
            if (callback[0]) {
                newNotify("Du bist jetzt der Croupier.")
            }
            newCardholder(callback[1], callback[2])
        })
        socket.emit('refreshTable', () => {
            console.log("weh");
        })
        bereitbtn.remove()
    })
    const neinbutton = testdealerdiv.getElementsByClassName("dealer-test-button-nein")[0]
    neinbutton.addEventListener('click', () => {
        alert("Du hast leider keine andere Wahl. #Diktatur")
    })
    document.getElementsByClassName("dealer-test-container")[0].append(testdealerdiv)
}

socket.on('refreshCardholder', (user, usernames) => {
    newCardholder(user, usernames)
})

const notifys = document.getElementsByClassName("notify")

for(var i = 0; i < notifys.length; i++) {
    (function(index) {
        notifys[index].addEventListener("click", function() {
        notifys[index].classList.remove("fadein")
        notifys[index].classList.add("fadeout")
        console.log(notifys[index]);
        setTimeout(() => {
            notifys[index].remove()
        }, 500);
       })
    })(i);
}

const notifycontainer = document.getElementById("notify-container")
const notifytemplate = document.getElementById("notify-template")

function newNotify(text) {
    const notify = notifytemplate.content.cloneNode(true).children[0]
    const notifytext = notify.querySelector("[data-notify-text]")
    notifytext.innerText = text
    notify.addEventListener("click", function() {
        notify.classList.remove("fadein")
        notify.classList.add("fadeout")
        setTimeout(() => {
            notify.remove()
        }, 500);
    })
    setTimeout(() => {
        notify.remove()
    }, 10000);
    notifycontainer.append(notify)
}

socket.on('newCardholder', (id, usernames) => {
    newCardholder(id, usernames)
})

const cardholdertemplate = document.getElementById("cardplace-template")

function newCardholder(id, usernames) {
    table.innerHTML = ""
    for (let i = 0; i < id; i++) {
        if (!(table.innerHTML.includes(`card${i + 1}`))) {
            const cardholdertem = cardholdertemplate.content.cloneNode(true).children[0]
            cardholdertem.classList.add(`card${i + 1}`)
            cardholdertem.querySelector("[data-username]").innerText = usernames[i]
            if (usernames[i] === username) {
                cardholdertem.classList.add("mycardholder")
            }
            table.append(cardholdertem)
            defineCardElements()
        }
    }
}

socket.on("deckedealerkarteauf", () => {
    const verstecktedealercard = document.getElementsByClassName("hiddendealercard")[0]
    verstecktedealercard.classList.remove("hiddendealercard")
    verstecktedealercard.dataset.suit = verstecktedealercard.dataset.amksuit
    verstecktedealercard.dataset.value = verstecktedealercard.dataset.amkvalue
    defineCardElements()
})

// $(function () {
//     socket.on('user join', function(username) {
//         console.log("amk");
//         newNotify(`${username} ist an den Tisch gekommen.`)
//     });

//     function KarteSchicken(karte) {
//         socket.emit('neuekarteschicken', karte);
//     }

//     socket.on('user leave', function(username, id) {
//         console.log(username, id);
//         newNotify(`${username} hat den Tisch verlassen.`)
//         newCardholder(id)
//     });
// });

socket.on("newnotify", text => {
    newNotify(text)
})

const cardtemplate = document.getElementById("cardtemplate")

function addKarte(karte) {
    const cardtemplateneu = cardtemplate.content.cloneNode(true).children[0]
    cardtemplateneu.dataset.suit = karte[0][0]
    cardtemplateneu.dataset.value = karte[0][1]
    const allecardholder = document.getElementsByClassName("cardholder")
    allecardholder[(karte[1] - 1)].append(cardtemplateneu)
    defineCardElements()
}

socket.on("neuekarte", karte => {
    addKarte(karte)
})

var slidecardsound = new Audio('https://dkihjuum4jcjr.cloudfront.net/ES_ITUNES/Game%20Card%20Slide%202/ES_Game%20Card%20Slide%202.mp3')

function addDealerQuestion(frage, janeinfrage, antwort1, antwort2) {
    
}

socket.on("startgameasdealer", async () => {
    for (let k = 0; k < 2; k++) {
        socket.emit("erstekartenausgeben", cb => {
            for (let i = 0; i < cb[0].length; i++) {
                addKarte(cb[0][i])
            }
            neueDealerKarte(cb[1])
        })
        slidecardsound.play()
        await sleep(1000)
    }
    socket.emit("dealerfragtobholden")
})

const dealerquestions = document.getElementsByClassName("wehtest")

socket.on("dealerfragestellen", user => {
    for (let i = 0; i < dealerquestions.length; i++) {
        if (dealerquestions[i].querySelector("[data-question-header]").innerHTML.includes(user)) return
    }
    dealerFragen(user)
})

const holdingfragetemplate = document.getElementById("holdingfrage-template")

function dealerFragen(user) {
    const holdingfragetemplateneu = holdingfragetemplate.content.cloneNode(true).children[0]
    holdingfragetemplateneu.querySelector("[data-question-header]").innerText = `Möchte der User "${user}" eine neue Karte?`
    var button1 = holdingfragetemplateneu.querySelector("[data-dealer-question-button1]")
    button1.innerText = "Hit"
    button1.classList.add("dealer-test-button.ja-button")
    button1.addEventListener('click', () => {
        socket.emit("neuekartefueruser", user, "hit", (cb) => {
            console.log(cb);
            if (cb == null) return
            addKarte(cb)
        })
        holdingfragetemplateneu.remove()
    })
    var button2 = holdingfragetemplateneu.querySelector("[data-dealer-question-button2]")
    button2.innerText = "Stand"
    button2.classList.add("dealer-test-button.nein-button")
    button2.addEventListener('click', () => {
        socket.emit("neuekartefueruser", user, "stand", cb => {
            console.log(cb);
            if (cb == null) return
            addKarte(cb)
        })
        holdingfragetemplateneu.remove()
    })
    var button3 = holdingfragetemplateneu.querySelector("[data-dealer-question-button3]")
    button3.addEventListener('click', () => {
        socket.emit("neuekartefueruser", user, "verdoppeln", cb => {
            console.log(cb);
            if (cb == null) return
            addKarte(cb)
        })
        holdingfragetemplateneu.remove()
    })
    button3.innerText = "Verdoppeln"
    testfordealercontainer.classList.remove("fadeouttop")
    document.getElementsByClassName("dealer-test-container")[0].append(holdingfragetemplateneu)
}

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

const dealercarddingsda = document.getElementById("dealercardholder")

var dealerkarten = 0

socket.on("letzedealerkartenziehen", () => {
    socket.emit("letzedealerkartenziehenserver")
})

socket.on("neuedealerkarte", karte => {
    neueDealerKarte(karte)
})

function neueDealerKarte(karte) {
    dealerkarten++
    const cardtemplateneu = cardtemplate.content.cloneNode(true).children[0]
    cardtemplateneu.dataset.amksuit = karte[0]
    cardtemplateneu.dataset.amkvalue = karte[1]
    if (dealerkarten > 1) {
        cardtemplateneu.dataset.suit = karte[0]
        cardtemplateneu.dataset.value = karte[1]
    } else {
        cardtemplateneu.classList.add("hiddendealercard")
    }
    dealercarddingsda.append(cardtemplateneu)
    defineCardElements()
}

function defineCardElements() {
    var cards = document.querySelectorAll(".card")
    cards.forEach(addCardElements)  
}

function addCardElements(card) {
    // kartenindex++
    const value = card.dataset.value
    // const suit = card.dataset.suit
    const valueAsNumber = parseInt(value)
    card.innerHTML = ""
    if (isNaN(valueAsNumber)) {
        card.append(createPip())
    } else {
        for (let i = 0; i < valueAsNumber; i++) {
        card.append(createPip())
        }
    }
    card.append(createCornerNumber("top", value))
    card.append(createCornerNumber("bottom", value))
}

function createCornerNumber(position, value) {
  const corner = document.createElement("div")
  corner.textContent = value
  corner.classList.add("corner-number")
  corner.classList.add(position)
  return corner
}

function createPip() {
  const pip = document.createElement("div")
  pip.classList.add("pip")
  return pip
}
