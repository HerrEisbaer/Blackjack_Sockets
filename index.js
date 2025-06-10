var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http)
const express = require('express');
var path = require('path')

http.listen(3000, function() {
    console.log('Server gestartet, listening on localhost:3000.');
});

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html')
    // res.sendFile(path.join(__dirname + "/blackjack/"))
})

app.get('/blackjack', function(req, res) {
    res.sendFile(__dirname + '/blackjack/')
})

app.use('/blackjack', express.static("blackjack/"))

var karten = {
    "kartendeck1": [
        {"heart": [2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A"]},
        {"diamond": [2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A"]},
        {"spade": [2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A"]},
        {"club": [2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A"]}
    ],
    "kartendeck2": [
        {"heart": [2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A"]},
        {"diamond": [2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A"]},
        {"spade": [2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A"]},
        {"club": [2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A"]}
    ],
}

var user = []

var rooms = {}

io.on('connection', function(socket, name) {
    console.log(`Ein neuer Nutzer hat den Server betreten, ${socket.id}`);
    user[(user.length + 1)] = socket.id
    user = user.filter(function () { return true });
    console.log(user);
    // io.emit('user join', { for: 'everyone' });
    socket.on('disconnect', function() {
        if (user.includes(socket.id)) {
            var uesrindex = user.indexOf(socket.id)
            if (uesrindex > -1) {
              user.splice(uesrindex, 1);
            }
        }
        user = user.filter(function () { return true });
        console.log(user, user.length);
        // io.emit('user leave', { for: 'everyone' })
        console.log(`Ein Nutzer hat den Server verlassen, ${name}`);
    })
});

io.emit('some event', { for: 'everyone' });

io.on('connection', function(socket) {
    socket.on('chat message', function(msg) {
        console.log(`Ein Nutzer hat eine Nachricht geschrieben.`);
        io.emit('chat message', msg);
    });

    socket.on('newconnection', (roomid, username, cb) => {
        socket.join(roomid)
        if (rooms[roomid] === null || rooms[roomid] === undefined) {
            rooms[roomid] = {
                "gestartet": false,
                "user": 0,
                "userready": 0,
                "usernames": [],
                "userlist": [],
                "dealer": null,
                "dealersocket": null,
                "dealerkartensumme": 0,
                "playersreadytoaufdecken": 0,
                "playersreadytoaufdeckenliste": []
            }
        }
        rooms[roomid].user++
        rooms[roomid].usernames.push(username)
        rooms[roomid].userlist.push({
            "username": username,
            "user": rooms[roomid].user,
            "usersocketid": socket.id,
            "kartensumme": 0,
            "lastaction": null
        })
        console.log("suiiiiii userlist:", rooms[roomid].userlist);
        console.log("suiiiiii user:", rooms);
        socket.to(roomid).emit('user join', username)
        socket.to(roomid).emit('newCardholder', rooms[roomid].user, rooms[roomid].usernames)
        cb([rooms[roomid].user, rooms[roomid].dealer, rooms[roomid].usernames])

        socket.on('setreadystatus', (readystatus, cb) => {
            if (readystatus) {
                rooms[roomid].userready++
            } else {
                rooms[roomid].userready--
            }
            if (rooms[roomid].user === rooms[roomid].userready && !(rooms[roomid].dealer == null)) {
                socket.to(roomid).emit('startgame')
                rooms[roomid].gestartet = true
                socket.to(rooms[roomid].dealersocket).emit("startgameasdealer")
                cb(true)
            } else {
                cb(false)
            }
        })

        socket.on("getusernames", (cb) => {
            cb(rooms[roomid].usernames)
        })

        socket.on('chechifgamestarted', cb => {
            cb(rooms[roomid].gestartet)
        })

        socket.on('setDealerOfRoom', cb => {
            rooms[roomid].dealer = username
            rooms[roomid].dealersocket = socket.id
            rooms[roomid].user--

            rooms[roomid].userlist = []
            rooms[roomid].usernames = []

            cb([true, rooms[roomid].user, rooms[roomid].usernames])
            console.log(rooms);
        })

        socket.on('refreshTable', () => {
            socket.emit('refreshCardholder', rooms[roomid].user, rooms[roomid].usernames)
        })

        socket.on("erstekartenausgeben", (cb) => {
            ready = true
            var callbackende = []
            for (let i = 0; i < (rooms[roomid].userlist.length); i++) {
                var user = rooms[roomid].userlist[i];
                var neuekartedingsda = neueKarteErstellen()
                var kartensummesuii = KartenSumme(neuekartedingsda, rooms[roomid].userlist[i].kartensumme)
                rooms[roomid].userlist[i].kartensumme += kartensummesuii
                socket.to(roomid).emit("neuekarte", [neuekartedingsda, user.user])
                callbackende.push([neuekartedingsda, user.user])
            }
            var aopsidja
            var neuedealerkarte = neueKarteErstellen()
            if (typeof neuedealerkarte[1] === "string") {
                if (!(neuedealerkarte[1] === "A")) {
                    aopsidja = 10
                } else {
                    if ((rooms[roomid].dealerkartensumme + 11) <= 21) {
                        aopsidja = 11
                    } else {
                        aopsidja = 1
                    }
                }
            } else {
                aopsidja = neuedealerkarte[1]
            }
            console.log("AOPSIDJA:", rooms[roomid].dealerkartensumme, neuedealerkarte);
            rooms[roomid].dealerkartensumme += aopsidja
            console.log("AOPSIDJA2:", rooms[roomid].dealerkartensumme, neuedealerkarte);
            socket.to(roomid).emit("neuedealerkarte", neuedealerkarte)
            cb([callbackende, neuedealerkarte])
        })

        socket.on("neuekartefueruser", (user, action, cb) => {
            var ende = null
            const index = rooms[roomid].usernames.indexOf(user);
            if (index > -1) {
                rooms[roomid].userlist[index].lastaction = action
            }
            if (action === "hit") {
                var neuekarte = neueKarteErstellen()
                var kartensumme = KartenSumme(neuekarte, rooms[roomid].userlist[index].kartensumme)
                rooms[roomid].userlist[index].kartensumme += kartensumme
                socket.emit("neuekarte", [neuekarte, rooms[roomid].userlist[index].user])
                socket.to(roomid).emit("neuekarte", [neuekarte, rooms[roomid].userlist[index].user])
                ende = [neuekarte, rooms[roomid].userlist[index].user]
            }
            if (action === "verdoppeln") {
                var neuekarte = neueKarteErstellen()
                var kartensumme = KartenSumme(neuekarte, rooms[roomid].userlist[index].kartensumme)
                rooms[roomid].userlist[index].kartensumme += kartensumme
                socket.to(roomid).emit("neuekarte", [neuekarte, rooms[roomid].userlist[index].user])
                ende = [neuekarte, rooms[roomid].userlist[index].user]
            }
            if (action === "stand") {
                if (rooms[roomid].playersreadytoaufdeckenliste.includes(rooms[roomid].userlist[index].username)) return
                rooms[roomid].playersreadytoaufdeckenliste.push(rooms[roomid].userlist[index].username)
                rooms[roomid].playersreadytoaufdecken++
            }
            if (rooms[roomid].userlist[index].kartensumme === 21) {
                socket.emit("newnotify", `Der User "${rooms[roomid].userlist[index].username}" ist fertig und hat genau 21.`)
            } else if (rooms[roomid].userlist[index].kartensumme >= 21) {
                socket.emit("newnotify", `Der User "${rooms[roomid].userlist[index].username}" hat mehr als 21 und ist raus :( LG Boergie)`)
            }
            for (let i = 0; i < rooms[roomid].userlist.length; i++) {
                if (rooms[roomid].userlist[i].kartensumme >= 21) {
                    if (rooms[roomid].playersreadytoaufdeckenliste.includes(rooms[roomid].userlist[i].username)) return
                    rooms[roomid].playersreadytoaufdeckenliste.push(rooms[roomid].userlist[i].username)
                    rooms[roomid].playersreadytoaufdecken++
                } else {
                    if (rooms[roomid].userlist[i].lastaction === "stand") {
                        
                    } else {
                        socket.emit("dealerfragestellen", rooms[roomid].userlist[i].username)
                    }
                }
                if (rooms[roomid].playersreadytoaufdeckenliste.length === rooms[roomid].user) {
                    socket.to(roomid).emit("deckedealerkarteauf")
                    socket.emit("deckedealerkarteauf")
                    socket.emit("letzedealerkartenziehen")
                }
            }
        })

        socket.on("dealerfragtobholden", () => {
            for (let i = 0; i < rooms[roomid].userlist.length; i++) {
                if (rooms[roomid].userlist[i].kartensumme >= 21) {
                    socket.emit("newnotify", `Unser allerliebster User ${rooms[roomid].userlist[i].username} hat ein Blackjack.`)
                    rooms[roomid].playersreadytoaufdeckenliste.push(rooms[roomid].userlist[i].username)
                    return
                }
                socket.emit("dealerfragestellen", rooms[roomid].userlist[i].username)
            }
        })

        socket.on("letzedealerkartenziehenserver", async () => {
            if (rooms[roomid].dealerkartensumme === 21) {
                socket.emit("newnotify", `Der Dealer hat einen Blackjack.`)
                return
            }
            if (rooms[roomid].dealerkartensumme >= 17) {
                socket.emit("newnotify", `Der Dealer darf keine Karte mehr ziehen. (${rooms[roomid].dealerkartensumme})`)
                return
            }
            letzeDealerKarten()
        })

        function letzeDealerKarten() {
            var neuedealerkarte = neueKarteErstellen()
            var aopsidja = 0
            if (typeof neuedealerkarte[1] === "string") {
                if (!(neuedealerkarte[1] === "A")) {
                    aopsidja = 10
                } else {
                    if ((rooms[roomid].dealerkartensumme + 11) <= 21) {
                        aopsidja = 11
                    } else {
                        aopsidja = 1
                    }
                }
            } else {
                aopsidja = neuedealerkarte[1]
            }
            if (rooms[roomid].dealerkartensumme + neuedealerkarte[1] > 21) neuedealerkarte[1] = 1
            console.log("AOPSIDJA:", rooms[roomid].dealerkartensumme, neuedealerkarte);
            rooms[roomid].dealerkartensumme += aopsidja
            console.log("AOPSIDJA2:", rooms[roomid].dealerkartensumme, neuedealerkarte);
            socket.to(roomid).emit("neuedealerkarte", neuedealerkarte)
            socket.emit("neuedealerkarte", neuedealerkarte)
            if (rooms[roomid].dealerkartensumme >= 21) {
                if (rooms[roomid].dealerkartensumme === 21) {
                    socket.emit("newnotify", `Der Dealer ist fertig.`)
                } else {
                    console.log("Dealerkartensumme:", rooms[roomid].dealerkartensumme);
                    socket.emit("newnotify", `Der Dealer hat sich überkauft.`)
                }
            } else {
                if (rooms[roomid].dealerkartensumme >= 17) {
                    socket.emit("newnotify", `Der Dealer darf keine Karte mehr ziehen. (${rooms[roomid].dealerkartensumme})`)
                    return
                } else {
                    letzeDealerKarten()
                }
            }
        }

        function KartenSumme(karte, userkartensumme) {
            // console.log("yallahkrassertest", karte, userkartensumme);
            var kartensumme = 0
            if (typeof karte[1] === "string") {
                if (!(karte[1] === "A")) {
                    kartensumme = 10
                } else {
                    if ((userkartensumme + 11) <= 21) {
                        kartensumme = 11
                    } else {
                        kartensumme = 1
                    }
                }
            } else {
                kartensumme = karte[1]
            }
            return kartensumme
        }

        function neueKarteErstellen() {
            var kartendeck = getKartenDeck()
            var kartentyp = getKarte(karten[`kartendeck${kartendeck}`])
            const index = karten[`kartendeck${kartendeck}`][kartentyp[2]][kartentyp[1]].indexOf(kartentyp[0]);
            if (index > -1) {
                karten[`kartendeck${kartendeck}`][kartentyp[2]][kartentyp[1]].splice(index, 1);
            }
            return [kartentyp[1], kartentyp[0]]
        }
        function getKartenDeck() {
            return Math.floor(Math.random() * Object.keys(karten).length) + 1
        }
        function getKarte(kartendeck) {
            var kartentypindex = Math.floor(Math.random() * Object.keys(kartendeck).length)
            var kartentyp = Object.keys(kartendeck[kartentypindex])[0]
            var kartentyparray = Object.values(kartendeck[kartentypindex])[0]
            var kartevalueindex = Math.floor(Math.random() * kartentyparray.length)
            var kartevalue = kartentyparray[kartevalueindex]
            return [kartevalue, kartentyp, kartentypindex]
        }

        socket.on('disconnect', () => {
            socket.to(roomid).emit('user leave', username, user.length)
            if (rooms[roomid].usernames.includes(username)) {
                var userindex = rooms[roomid].usernames.indexOf(username)
                if (userindex > -1) {
                    rooms[roomid].usernames.splice(userindex, 1);
                }
            }
            console.log(username, rooms[roomid].dealer);
            if (username === rooms[roomid].dealer) {
                rooms[roomid].dealer = null
                rooms[roomid].dealersocket = null
            }
            rooms[roomid].user--
            console.log("suiiiiii user:", rooms);
        })
    })
});

io.on('connection', function(socket) {
    socket.on('neuekarteschicken', function(msg) {
        console.log(socket.id, msg);
    });
});