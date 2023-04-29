import { Server } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents } from "../websocket/types";
import { dataAPI } from "../websocket/data";
import { server } from "./server";
import { websocketController } from "../websocket/controller";

export const socketio = new Server<
  ClientToServerEvents,
  ServerToClientEvents
>(server);

socketio.on("connection", (socket): void => {
  const player = dataAPI.createPlayer(socket);
  if (!player) return void socket.disconnect(true);

  socket.on("client-create-lobby", () => { websocketController.createLobby(player) });
  socket.on("client-join-lobby", (data) => { websocketController.joinLobby(player, data) });
  socket.on("client-leave-lobby", () => { websocketController.leaveLobby(player) });
  socket.on("client-lobby-update", () => { websocketController.lobbyUpdate(player) });
  socket.on("client-change-country", (data) => { websocketController.changeCountry(player, data) });

  socket.on("client-chat-message", (data) => { websocketController.chatMessage(player, data) });
  socket.on("client-sync-state", () => { websocketController.syncState(player) });

  socket.on("client-game-action", () => { websocketController.gameAction(player) });
});