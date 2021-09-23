import { writable } from "svelte/store";
import { io } from "socket.io-client";

const stores = {
	connected: writable(false),
	userState: writable({}),
	roomState: writable({}),
	groupState: writable([]),
};

const socket = io("http://localhost:3000");
socket.on("connect", () => {
	stores.connected.set(true);
});
socket.on("disconnect", () => stores.connected.set(false));
let roomJoinSuccess = function () {};
let roomJoinFailure = function () {};
socket.on("roomJoinSuccess", () => roomJoinSuccess());
socket.on("roomJoinFailure", error => {
	roomJoinFailure(error);
	socket.disconnect();
});
socket.on("userStateUpdate", state => stores.userState.set(state));
socket.on("roomStateUpdate", state => stores.roomState.set(state));
socket.on("groupStateUpdate", state => stores.groupState.set(state));

export function join(roomID) {
	return new Promise((resolve, reject) => {
		socket.emit("joinRoom", roomID);
		roomJoinSuccess = resolve;
		roomJoinFailure = reject;
	});
}

export function leave() {
	socket.emit("leaveRoom");
}

export const connected = { subscribe: stores.connected.subscribe };
export const user = { subscribe: stores.userState.subscribe };
export const room = { subscribe: stores.roomState.subscribe };
export const group = { subscribe: stores.groupState.subscribe };
