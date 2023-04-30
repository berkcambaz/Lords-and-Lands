import { INetworkPlayer } from "../types/network_player";
import { IPlayer } from "../types/player";
import { dataAPI } from "./data";
import { changeCountrySchema, chatMessageSchema, createLobbySchema, gameActionSchema, joinLobbySchema, lobbyUpdateSchema } from "./schemas";
import { ClientToServerEvents } from "./types";

function createLobby(player: IPlayer, data: Parameters<ClientToServerEvents["client-create-lobby"]>[0]): void {
  const parsed = createLobbySchema.safeParse(data);
  if (!parsed.success) return void player.socket.emit("server-create-lobby", undefined);
  const parsedData = parsed.data;

  // Set player's name
  player.name = parsedData.playerName;

  // Try to create a lobby
  const lobby = dataAPI.createLobby(player);

  // Send the result to the player that tried to create a lobby
  if (!lobby) {
    player.socket.emit("server-create-lobby", undefined);
  }
  else {
    const { width, height, seed } = lobby.gameData;
    player.socket.emit(
      "server-create-lobby",
      { playerName: player.name, playerId: player.id, lobbyId: lobby.id, w: width, h: height, seed }
    );
  }
}

function joinLobby(player: IPlayer, data: Parameters<ClientToServerEvents["client-join-lobby"]>[0]): void {
  const parsed = joinLobbySchema.safeParse(data);
  if (!parsed.success) return void player.socket.emit("server-join-lobby", undefined);
  const parsedData = parsed.data;

  // Set player's name
  player.name = parsedData.playerName;

  const lobby = dataAPI.joinLobby(player, parsedData.lobbyId);

  if (!lobby) {
    // Send the joined player, that player couldn't join
    player.socket.emit("server-join-lobby", undefined);
  }
  else {
    const players = Object.values(lobby.players);
    const networkPlayer: INetworkPlayer = { id: player.id, name: player.name, country: player.country, isAdmin: dataAPI.isPlayerAdmin(player) }
    const networkPlayers: INetworkPlayer[] = players.map(p =>
      ({ id: p.id, name: p.name, country: p.country, isAdmin: dataAPI.isPlayerAdmin(p) })
    );

    const { width, height, seed } = lobby.gameData;

    // Send the joined player: player id, lobby id, width, height, seed, and all players
    player.socket.emit(
      "server-join-lobby",
      { playerId: player.id, lobbyId: lobby.id, w: width, h: height, seed, players: networkPlayers }
    );

    // Send the already joined players, only the joined player
    players
      .filter(p => p.id !== player.id)
      .forEach(p => p.socket.emit("server-join-lobby", { players: [networkPlayer] }));
  }
}

function leaveLobby(player: IPlayer) {
  // Send "leave lobby" event to all players in the lobby
  dataAPI.getLobbyPlayers(player.lobby).forEach(p => p.socket.emit("server-leave-lobby", { playerId: player.id }));

  // Make player leave the lobby
  dataAPI.leaveLobby(player);
}

function lobbyUpdate(player: IPlayer, data: Parameters<ClientToServerEvents["client-lobby-update"]>[0]): void {
  const parsed = lobbyUpdateSchema.safeParse(data);
  if (!parsed.success) return void player.socket.emit("server-lobby-update", undefined);
  const { w, h, seed, online } = parsed.data;

  const status = dataAPI.lobbyUpdate(player, w, h, seed);

  // If lobby is made offline, remove the lobby and all the players connected to the lobby
  if (online !== undefined && !online) {
    const players = dataAPI.getLobbyPlayers(player.lobby);
    dataAPI.removeLobby(player);
    players.forEach(p => p.socket.emit("server-lobby-update", { online: false }));
  }

  // If "lobby update" is done successfully, send it to all players, if not, only send to current player
  if (status) {
    const players = dataAPI.getLobbyPlayers(player.lobby);
    players.forEach(p => {
      p.socket.emit("server-lobby-update", { w, h, seed, online });
    });
  }
  else {
    player.socket.emit("server-lobby-update", undefined);
  }
}

function changeCountry(player: IPlayer, data: Parameters<ClientToServerEvents["client-change-country"]>[0]): void {
  const parsed = changeCountrySchema.safeParse(data);
  if (!parsed.success) return void player.socket.emit("server-change-country", undefined);
  const parsedData = parsed.data;

  const result = dataAPI.changeCountry(player, parsedData.country);

  // If "change country" is done successfully, send it to all players, if not, only send to current player
  if (result) {
    const players = dataAPI.getLobbyPlayers(player.lobby);
    players.forEach(p => p.socket.emit("server-change-country", result));
  }
  else {
    player.socket.emit("server-change-country", undefined);
  }
}

function chatMessage(player: IPlayer, data: Parameters<ClientToServerEvents["client-chat-message"]>[0]): void {
  const parsed = chatMessageSchema.safeParse(data);
  if (!parsed.success) return void player.socket.emit("server-chat-message", undefined);
  const parsedData = parsed.data;

  const players = dataAPI.getLobbyPlayers(player.lobby);
  players.forEach(p => p.socket.emit("server-chat-message", { id: player.id, msg: parsedData.message }));
}

function syncState(_player: IPlayer) {

}

function gameAction(player: IPlayer, data: Parameters<ClientToServerEvents["client-game-action"]>[0]): void {
  const parsed = gameActionSchema.safeParse(data);
  if (!parsed.success) return void player.socket.emit("server-game-action", undefined);
  const parsedData = parsed.data;

  const actable = dataAPI.gameAction(player, parsedData);

  if (actable) {
    const players = dataAPI.getLobbyPlayers(player.lobby);
    players.forEach(p => p.socket.emit("server-game-action", parsedData));
  }
  else {
    player.socket.emit("server-game-action", undefined);
  }
}

export const websocketController = {
  createLobby,
  joinLobby,
  leaveLobby,
  lobbyUpdate,
  changeCountry,

  chatMessage,
  syncState,

  gameAction,
}