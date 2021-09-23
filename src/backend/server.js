const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
	cors: { origin: "*" },
});

const rooms = {};
// function setroomState(room, change){
// 	rooms[room].state = change(rooms[room].state)
// 	io.emit(room, rooms[room].state)
// }

app.use(express.static("public"));

app.get("/*", (req, res) => {
	res.sendFile(__dirname + "/public/index.html");
});

io.on("connection", socket => {
	console.log(`${socket.id}: connected`);
	const user = {
		id: socket.id,
		room: null,
	};
	function userUpdate() {
		socket.emit("userStateUpdate", user);
	}
	function groupUpdate() {
		io.in(user.room).emit(
			"groupStateUpdate",
			Array.from(rooms[user.room].users)
		);
	}
	function roomUpdate() {
		if (rooms[user.room]) {
			io.in(user.room).emit("roomStateUpdate", rooms[user.room].state);
		} else {
			console.error("Attempted to update a nonexistant room");
		}
	}
	function leaveRoom() {
		if (rooms[user.room]) {
			socket.leave(user.room); // stop broadcasting
			rooms[user.room].users.delete(user); // remove from set
			console.log(`${socket.id}: left room ${user.room}`);
			if (rooms[user.room].users.size === 0) {
				// check if there's no one left, if so delete the room
				Object.values(rooms[user.room].intervals).forEach(interval =>
					clearInterval(interval)
				);
				delete rooms[user.room];
				console.log(`Room ${user.room} deleted`);
			} else {
				// if there are people left
				if (rooms[user.room].state.leader == user.id) {
					// check if this person was the leader
					rooms[user.room].state.leader = Array.from(
						rooms[user.room].users
					)[0].id; // set the leader to the next person in the room
					console.log(
						`Room ${user.room} has new leader: ${rooms[user.room].state.leader}`
					);
				}
				roomUpdate();
				groupUpdate();
			}
			user.room = null;
			if (socket.connected) {
				userUpdate();
			}
		} else {
			console.error("user has no room");
		}
	}
	userUpdate();
	socket.on("joinRoom", room => {
		if (user.room) {
			leaveRoom();
		}
		user.room = room;
		userUpdate();
		socket.join(room);
		if (!rooms[room]) {
			rooms[room] = {
				users: new Set(),
				state: {
					someCount: 0,
					leader: user.id,
				},
				intervals: {
					someCountInterval: setInterval(() => {
						rooms[room].state.someCount += 1;
						roomUpdate();
					}, 1000),
				},
			};
			console.log(`Room ${room} created`);
			roomUpdate();
		}
		rooms[room].users.add(user);
		groupUpdate();
		roomUpdate();
		socket.emit("roomJoinSuccess");
		console.log(`${socket.id}: joined room ${room}`);
	});
	socket.on("leaveRoom", leaveRoom);
	socket.on("disconnect", function () {
		// console.log(rooms);
		console.log(`${socket.id}: disconnected`);
		leaveRoom();
	});
});

httpServer.listen(3000);
