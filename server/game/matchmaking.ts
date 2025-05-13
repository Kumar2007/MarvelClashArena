import { WebSocket } from "ws";
import { RedisClient } from "./redisClient";
import { MatchedPlayers, Player } from "./types";

export class MatchmakingQueue {
  private redis: RedisClient;
  private readonly queueKey = "matchmaking:queue";
  private readonly eloThreshold = 300; // Maximum ELO difference for matchmaking

  constructor(redis: RedisClient) {
    this.redis = redis;
  }

  /**
   * Add a player to the matchmaking queue
   */
  async addToQueue(player: Player): Promise<void> {
    const playerData = JSON.stringify({
      userId: player.userId,
      username: player.username,
      elo: player.elo,
      socketId: this.getSocketId(player.socket),
      joinedAt: Date.now()
    });

    // Add player to the queue
    await this.redis.rPush(this.queueKey, playerData);
    
    console.log(`Player ${player.username} (ID: ${player.userId}) added to matchmaking queue`);
  }

  /**
   * Remove a player from the matchmaking queue
   */
  async removeFromQueue(userId: number): Promise<boolean> {
    // Get all players in the queue
    const players = await this.redis.lRange(this.queueKey, 0, -1);
    
    // Find the player by userId and remove them from the queue
    let removed = false;
    for (const playerData of players) {
      try {
        const player = JSON.parse(playerData);
        if (player.userId === userId) {
          await this.redis.lRem(this.queueKey, 1, playerData);
          removed = true;
          console.log(`Player ${player.username} (ID: ${userId}) removed from matchmaking queue`);
          break;
        }
      } catch (err) {
        console.error("Error parsing player data:", err);
      }
    }
    
    return removed;
  }

  /**
   * Find a match for the given player
   */
  async findMatch(userId: number): Promise<MatchedPlayers | null> {
    // Get all players in the queue
    const players = await this.redis.lRange(this.queueKey, 0, -1);
    
    // Find current player in the queue
    let currentPlayer: any = null;
    for (const playerData of players) {
      try {
        const player = JSON.parse(playerData);
        if (player.userId === userId) {
          currentPlayer = player;
          break;
        }
      } catch (err) {
        console.error("Error parsing player data:", err);
      }
    }
    
    if (!currentPlayer) {
      console.log(`Player ${userId} not found in matchmaking queue`);
      return null;
    }
    
    // Find a match for the current player
    let bestMatch: any = null;
    let smallestEloDifference = Infinity;
    
    for (const playerData of players) {
      try {
        const player = JSON.parse(playerData);
        
        // Skip matching with self
        if (player.userId === userId) continue;
        
        // Calculate ELO difference
        const eloDifference = Math.abs(player.elo - currentPlayer.elo);
        
        // If within threshold and better than current best match
        if (eloDifference <= this.eloThreshold && eloDifference < smallestEloDifference) {
          bestMatch = player;
          smallestEloDifference = eloDifference;
        }
      } catch (err) {
        console.error("Error parsing player data:", err);
      }
    }
    
    if (!bestMatch) {
      // No suitable match found
      return null;
    }
    
    // Remove both players from the queue
    await this.redis.lRem(this.queueKey, 1, JSON.stringify(currentPlayer));
    await this.redis.lRem(this.queueKey, 1, JSON.stringify(bestMatch));
    
    // Generate a match ID
    const matchId = `match-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Get socket objects
    const currentPlayerSocket = this.getSocketById(currentPlayer.socketId);
    const matchedPlayerSocket = this.getSocketById(bestMatch.socketId);
    
    if (!currentPlayerSocket || !matchedPlayerSocket) {
      console.error("Socket not found for one of the matched players");
      // If a socket is not found, add the valid player back to the queue
      if (currentPlayerSocket) {
        await this.addToQueue({
          userId: currentPlayer.userId,
          username: currentPlayer.username,
          elo: currentPlayer.elo,
          socket: currentPlayerSocket
        });
      }
      if (matchedPlayerSocket) {
        await this.addToQueue({
          userId: bestMatch.userId,
          username: bestMatch.username,
          elo: bestMatch.elo,
          socket: matchedPlayerSocket
        });
      }
      return null;
    }
    
    const player1: Player = {
      userId: currentPlayer.userId,
      username: currentPlayer.username,
      elo: currentPlayer.elo,
      socket: currentPlayerSocket
    };
    
    const player2: Player = {
      userId: bestMatch.userId,
      username: bestMatch.username,
      elo: bestMatch.elo,
      socket: matchedPlayerSocket
    };
    
    console.log(`Match found! ${player1.username} vs ${player2.username}`);
    
    // Notify both players
    const matchFoundMessage = JSON.stringify({
      type: "matchmaking:match_found",
      payload: {
        matchId,
        opponent: {
          username: bestMatch.username,
          elo: bestMatch.elo
        }
      }
    });
    
    if (player1.socket.readyState === WebSocket.OPEN) {
      player1.socket.send(matchFoundMessage);
    }
    
    const matchFoundMessage2 = JSON.stringify({
      type: "matchmaking:match_found",
      payload: {
        matchId,
        opponent: {
          username: currentPlayer.username,
          elo: currentPlayer.elo
        }
      }
    });
    
    if (player2.socket.readyState === WebSocket.OPEN) {
      player2.socket.send(matchFoundMessage2);
    }
    
    return {
      player1,
      player2,
      matchId
    };
  }

  private getSocketId(socket: WebSocket): string {
    // Generate a unique ID for the socket
    return `socket-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  }

  private getSocketById(socketId: string): WebSocket | null {
    // In a real implementation with Redis, we would need to
    // maintain a mapping between socket IDs and socket objects.
    // For this implementation, we'll assume the socket objects are available.
    // In production, we might use a shared memory store or a different approach.
    
    // This is a simplified approach - in production, you'd need a proper socket registry
    return null; // Placeholder
  }

  /**
   * Get the current number of players in the queue
   */
  async getQueueSize(): Promise<number> {
    const players = await this.redis.lRange(this.queueKey, 0, -1);
    return players.length;
  }
}
