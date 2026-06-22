import { WebSocketServer, WebSocket } from 'ws'
import type { Server } from 'http'
import { randomUUID } from 'crypto'

interface Room {
  master: WebSocket | null
  players: Map<string, WebSocket>
}

const rooms = new Map<string, Room>()

function getOrCreate(gameId: string): Room {
  if (!rooms.has(gameId)) rooms.set(gameId, { master: null, players: new Map() })
  return rooms.get(gameId)!
}

function send(ws: WebSocket, data: object) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data))
}

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server })

  const keepAlive = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) ws.ping()
    })
  }, 30_000)

  wss.on('close', () => clearInterval(keepAlive))

  wss.on('connection', (ws) => {
    let gameId: string | null = null
    let role: 'master' | 'player' | null = null
    let playerId: string | null = null
    let dbPlayerId: string | null = null

    ws.on('message', (raw) => {
      if (raw.toString() === 'pong') return
      let msg: Record<string, any>
      try { msg = JSON.parse(raw.toString()) } catch { return }

      switch (msg.type) {
        case 'join': {
          gameId = msg.gameId
          role = msg.role
          const room = getOrCreate(gameId!)
          if (role === 'master') {
            room.master = ws
            send(ws, { type: 'joined', playerId: null })
          } else {
            playerId = randomUUID()
            dbPlayerId = msg.dbPlayerId ?? null
            room.players.set(playerId, ws)
            send(ws, { type: 'joined', playerId })
            if (room.master) send(room.master, { type: 'player_joined', playerId, dbPlayerId })
          }
          break
        }

        case 'request_players': {
          // Master asks for current player list (e.g. after starting audio capture)
          const room = rooms.get(gameId!)
          room?.players.forEach((_, pId) => send(ws, { type: 'player_joined', playerId: pId }))
          break
        }

        case 'offer': {
          const playerWs = rooms.get(gameId!)?.players.get(msg.playerId)
          if (playerWs) send(playerWs, { type: 'offer', sdp: msg.sdp })
          break
        }

        case 'answer': {
          const master = rooms.get(gameId!)?.master
          if (master) send(master, { type: 'answer', sdp: msg.sdp, playerId })
          break
        }

        case 'ice': {
          const room = rooms.get(gameId!)
          if (role === 'master') {
            const playerWs = room?.players.get(msg.playerId)
            if (playerWs) send(playerWs, { type: 'ice', candidate: msg.candidate })
          } else {
            if (room?.master) send(room.master, { type: 'ice', candidate: msg.candidate, playerId })
          }
          break
        }

        case 'sync_start': {
          const room = rooms.get(gameId!)
          const timestamp = Date.now() + 3000
          room?.players.forEach(playerWs => send(playerWs, { type: 'sync_start', timestamp }))
          send(ws, { type: 'sync_start', timestamp })
          break
        }
      }
    })

    ws.on('close', () => {
      if (!gameId) return
      const room = rooms.get(gameId)
      if (!room) return
      if (role === 'master') {
        room.master = null
      } else if (playerId) {
        room.players.delete(playerId)
        if (room.master) send(room.master, { type: 'player_left', playerId, dbPlayerId })
      }
      if (!room.master && room.players.size === 0) rooms.delete(gameId)
    })
  })
}