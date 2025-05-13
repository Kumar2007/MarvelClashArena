import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupRedisClient } from "./game/redisClient";
import { MatchmakingQueue } from "./game/matchmaking";
import { BattleManager } from "./game/turnEngine";
import { messageSchema } from "@shared/schema";
import { generateBotPlayer } from "./game/botAI";
import { fromZodError } from "zod-validation-error";

// Track connected clients
const clients = new Map<WebSocket, { userId?: number; username?: string }>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup Redis client
  const redisClient = await setupRedisClient();
  
  // Initialize game services
  const matchmakingQueue = new MatchmakingQueue(redisClient);
  const battleManager = new BattleManager(redisClient, storage);
  
  // WebSocket server setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    // Add to clients map
    clients.set(ws, {});
    
    // Handle client messages
    ws.on('message', async (message) => {
      try {
        const parsedMessage = JSON.parse(message.toString());
        try {
          messageSchema.parse(parsedMessage);
        } catch (err) {
          const validationError = fromZodError(err);
          sendErrorToClient(ws, 'Invalid message format', validationError.message);
          return;
        }
        
        const { type, payload } = parsedMessage;
        
        switch (type) {
          case 'auth:login':
            handleLogin(ws, payload);
            break;
          
          case 'auth:register':
            handleRegister(ws, payload);
            break;
            
          case 'matchmaking:join':
            handleJoinMatchmaking(ws, payload, matchmakingQueue);
            break;
            
          case 'matchmaking:leave':
            handleLeaveMatchmaking(ws, matchmakingQueue);
            break;
            
          case 'lobby:create':
            handleCreateLobby(ws, payload, battleManager);
            break;
            
          case 'lobby:join':
            handleJoinLobby(ws, payload, battleManager);
            break;
            
          case 'game:select_hero':
            handleSelectHero(ws, payload, battleManager);
            break;
            
          case 'game:confirm_team':
            handleConfirmTeam(ws, battleManager);
            break;
            
          case 'turn:action':
            handleTurnAction(ws, payload, battleManager);
            break;
            
          case 'turn:swap':
            handleSwapPosition(ws, payload, battleManager);
            break;
            
          case 'game:surrender':
            handleSurrender(ws, battleManager);
            break;
            
          case 'bot:create':
            handleCreateBotMatch(ws, payload, battleManager);
            break;
            
          default:
            sendErrorToClient(ws, 'Unknown message type', `Message type "${type}" is not supported`);
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
        sendErrorToClient(ws, 'Message processing error', 'Could not process your request');
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      const clientInfo = clients.get(ws);
      
      if (clientInfo && clientInfo.userId) {
        // Remove from matchmaking if disconnected while in queue
        matchmakingQueue.removeFromQueue(clientInfo.userId);
        
        // Handle disconnection from active game
        battleManager.handlePlayerDisconnect(clientInfo.userId);
      }
      
      // Remove from clients map
      clients.delete(ws);
      console.log('WebSocket client disconnected');
    });
  });
  
  // Register API routes
  app.get('/api/leaderboard', async (req, res) => {
    try {
      const topPlayers = await storage.getLeaderboard(10);
      res.json(topPlayers);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch leaderboard' });
    }
  });
  
  app.get('/api/hero-stats', async (req, res) => {
    try {
      const stats = await storage.getHeroStats();
      res.json(stats);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch hero stats' });
    }
  });
  
  app.get('/api/user/:id/stats', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const userStats = await storage.getUserStats(userId);
      res.json(userStats);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch user stats' });
    }
  });

  return httpServer;
}

// Helper functions for handling WebSocket messages

async function handleLogin(ws: WebSocket, payload: any) {
  try {
    const { username, password } = payload;
    
    if (!username || !password) {
      return sendErrorToClient(ws, 'Missing credentials', 'Username and password are required');
    }
    
    const user = await storage.getUserByUsername(username);
    
    if (!user || user.password !== password) { // In production, use proper password hashing
      return sendErrorToClient(ws, 'Authentication failed', 'Invalid username or password');
    }
    
    // Update client info
    clients.set(ws, { userId: user.id, username: user.username });
    
    // Update last login time
    await storage.updateLastLogin(user.id);
    
    // Send success response
    ws.send(JSON.stringify({
      type: 'auth:login_success',
      payload: {
        id: user.id,
        username: user.username,
        elo: user.elo,
        rank: user.rank,
        experience: user.experience,
        unlockedHeroes: user.unlockedHeroes,
        titles: user.titles,
        badges: user.badges,
      }
    }));
  } catch (err) {
    console.error('Login error:', err);
    sendErrorToClient(ws, 'Login error', 'An error occurred during login');
  }
}

async function handleRegister(ws: WebSocket, payload: any) {
  try {
    const { username, password } = payload;
    
    if (!username || !password) {
      return sendErrorToClient(ws, 'Missing data', 'Username and password are required');
    }
    
    // Check if username exists
    const existingUser = await storage.getUserByUsername(username);
    
    if (existingUser) {
      return sendErrorToClient(ws, 'Registration failed', 'Username already exists');
    }
    
    // Create new user
    const newUser = await storage.createUser({ username, password });
    
    // Update client info
    clients.set(ws, { userId: newUser.id, username: newUser.username });
    
    // Send success response
    ws.send(JSON.stringify({
      type: 'auth:register_success',
      payload: {
        id: newUser.id,
        username: newUser.username,
        elo: newUser.elo,
        rank: newUser.rank,
        experience: newUser.experience,
        unlockedHeroes: newUser.unlockedHeroes,
        titles: newUser.titles,
        badges: newUser.badges,
      }
    }));
  } catch (err) {
    console.error('Registration error:', err);
    sendErrorToClient(ws, 'Registration error', 'An error occurred during registration');
  }
}

async function handleJoinMatchmaking(ws: WebSocket, payload: any, matchmakingQueue: MatchmakingQueue) {
  const clientInfo = clients.get(ws);
  
  if (!clientInfo || !clientInfo.userId) {
    return sendErrorToClient(ws, 'Authentication required', 'You must be logged in to join matchmaking');
  }
  
  try {
    const user = await storage.getUser(clientInfo.userId);
    
    if (!user) {
      return sendErrorToClient(ws, 'User not found', 'Your user account could not be found');
    }
    
    // Add player to matchmaking queue
    await matchmakingQueue.addToQueue({
      userId: user.id,
      username: user.username,
      elo: user.elo,
      socket: ws,
    });
    
    // Send confirmation
    ws.send(JSON.stringify({
      type: 'matchmaking:joined',
      payload: {
        message: 'You have been added to the matchmaking queue',
      }
    }));
    
    // Check for matches
    const matchResult = await matchmakingQueue.findMatch(user.id);
    
    if (matchResult) {
      // Match found, notify both players
      const { player1, player2, matchId } = matchResult;
      
      // Create a new battle
      await battleManager.createBattle(matchId, player1, player2, false);
    }
  } catch (err) {
    console.error('Join matchmaking error:', err);
    sendErrorToClient(ws, 'Matchmaking error', 'Could not join matchmaking queue');
  }
}

async function handleLeaveMatchmaking(ws: WebSocket, matchmakingQueue: MatchmakingQueue) {
  const clientInfo = clients.get(ws);
  
  if (!clientInfo || !clientInfo.userId) {
    return sendErrorToClient(ws, 'Authentication required', 'You must be logged in');
  }
  
  try {
    // Remove player from matchmaking queue
    await matchmakingQueue.removeFromQueue(clientInfo.userId);
    
    // Send confirmation
    ws.send(JSON.stringify({
      type: 'matchmaking:left',
      payload: {
        message: 'You have been removed from the matchmaking queue',
      }
    }));
  } catch (err) {
    console.error('Leave matchmaking error:', err);
    sendErrorToClient(ws, 'Matchmaking error', 'Could not leave matchmaking queue');
  }
}

async function handleCreateLobby(ws: WebSocket, payload: any, battleManager: BattleManager) {
  const clientInfo = clients.get(ws);
  
  if (!clientInfo || !clientInfo.userId) {
    return sendErrorToClient(ws, 'Authentication required', 'You must be logged in to create a lobby');
  }
  
  try {
    const { lobbyName } = payload;
    
    if (!lobbyName) {
      return sendErrorToClient(ws, 'Missing data', 'Lobby name is required');
    }
    
    // Create a new lobby
    const lobbyCode = await battleManager.createLobby(clientInfo.userId, lobbyName, ws);
    
    // Send confirmation with lobby code
    ws.send(JSON.stringify({
      type: 'lobby:created',
      payload: {
        lobbyCode,
        lobbyName,
      }
    }));
  } catch (err) {
    console.error('Create lobby error:', err);
    sendErrorToClient(ws, 'Lobby error', 'Could not create lobby');
  }
}

async function handleJoinLobby(ws: WebSocket, payload: any, battleManager: BattleManager) {
  const clientInfo = clients.get(ws);
  
  if (!clientInfo || !clientInfo.userId) {
    return sendErrorToClient(ws, 'Authentication required', 'You must be logged in to join a lobby');
  }
  
  try {
    const { lobbyCode } = payload;
    
    if (!lobbyCode) {
      return sendErrorToClient(ws, 'Missing data', 'Lobby code is required');
    }
    
    // Join the lobby
    const success = await battleManager.joinLobby(lobbyCode, clientInfo.userId, ws);
    
    if (!success) {
      return sendErrorToClient(ws, 'Lobby not found', 'Could not find lobby with that code');
    }
  } catch (err) {
    console.error('Join lobby error:', err);
    sendErrorToClient(ws, 'Lobby error', 'Could not join lobby');
  }
}

async function handleSelectHero(ws: WebSocket, payload: any, battleManager: BattleManager) {
  const clientInfo = clients.get(ws);
  
  if (!clientInfo || !clientInfo.userId) {
    return sendErrorToClient(ws, 'Authentication required', 'You must be logged in');
  }
  
  try {
    const { heroId } = payload;
    
    if (!heroId) {
      return sendErrorToClient(ws, 'Missing data', 'Hero ID is required');
    }
    
    // Select the hero
    const result = await battleManager.selectHero(clientInfo.userId, heroId);
    
    if (!result.success) {
      return sendErrorToClient(ws, 'Selection failed', result.message || 'Could not select hero');
    }
  } catch (err) {
    console.error('Select hero error:', err);
    sendErrorToClient(ws, 'Selection error', 'Could not select hero');
  }
}

async function handleConfirmTeam(ws: WebSocket, battleManager: BattleManager) {
  const clientInfo = clients.get(ws);
  
  if (!clientInfo || !clientInfo.userId) {
    return sendErrorToClient(ws, 'Authentication required', 'You must be logged in');
  }
  
  try {
    // Confirm team selection
    const result = await battleManager.confirmTeam(clientInfo.userId);
    
    if (!result.success) {
      return sendErrorToClient(ws, 'Confirmation failed', result.message || 'Could not confirm team');
    }
  } catch (err) {
    console.error('Confirm team error:', err);
    sendErrorToClient(ws, 'Confirmation error', 'Could not confirm team');
  }
}

async function handleTurnAction(ws: WebSocket, payload: any, battleManager: BattleManager) {
  const clientInfo = clients.get(ws);
  
  if (!clientInfo || !clientInfo.userId) {
    return sendErrorToClient(ws, 'Authentication required', 'You must be logged in');
  }
  
  try {
    const { heroId, skillId, targetId } = payload;
    
    if (!heroId || skillId === undefined || !targetId) {
      return sendErrorToClient(ws, 'Missing data', 'Hero ID, skill ID, and target ID are required');
    }
    
    // Execute turn action
    const result = await battleManager.executeTurnAction(clientInfo.userId, {
      heroId,
      skillId,
      targetId,
    });
    
    if (!result.success) {
      return sendErrorToClient(ws, 'Action failed', result.message || 'Could not execute action');
    }
  } catch (err) {
    console.error('Turn action error:', err);
    sendErrorToClient(ws, 'Action error', 'Could not process turn action');
  }
}

async function handleSwapPosition(ws: WebSocket, payload: any, battleManager: BattleManager) {
  const clientInfo = clients.get(ws);
  
  if (!clientInfo || !clientInfo.userId) {
    return sendErrorToClient(ws, 'Authentication required', 'You must be logged in');
  }
  
  try {
    const { heroId, position } = payload;
    
    if (!heroId || !position) {
      return sendErrorToClient(ws, 'Missing data', 'Hero ID and position are required');
    }
    
    // Swap hero position
    const result = await battleManager.swapHeroPosition(clientInfo.userId, {
      heroId,
      position,
    });
    
    if (!result.success) {
      return sendErrorToClient(ws, 'Swap failed', result.message || 'Could not swap positions');
    }
  } catch (err) {
    console.error('Swap position error:', err);
    sendErrorToClient(ws, 'Swap error', 'Could not process position swap');
  }
}

async function handleSurrender(ws: WebSocket, battleManager: BattleManager) {
  const clientInfo = clients.get(ws);
  
  if (!clientInfo || !clientInfo.userId) {
    return sendErrorToClient(ws, 'Authentication required', 'You must be logged in');
  }
  
  try {
    // Surrender the match
    await battleManager.surrender(clientInfo.userId);
  } catch (err) {
    console.error('Surrender error:', err);
    sendErrorToClient(ws, 'Surrender error', 'Could not process surrender');
  }
}

async function handleCreateBotMatch(ws: WebSocket, payload: any, battleManager: BattleManager) {
  const clientInfo = clients.get(ws);
  
  if (!clientInfo || !clientInfo.userId) {
    return sendErrorToClient(ws, 'Authentication required', 'You must be logged in');
  }
  
  try {
    const { difficulty } = payload;
    
    if (!difficulty) {
      return sendErrorToClient(ws, 'Missing data', 'Bot difficulty is required');
    }
    
    // Get user
    const user = await storage.getUser(clientInfo.userId);
    
    if (!user) {
      return sendErrorToClient(ws, 'User not found', 'Your user account could not be found');
    }
    
    // Generate bot opponent
    const botPlayer = generateBotPlayer(difficulty);
    
    // Create a new battle with a bot
    const matchId = `bot-${clientInfo.userId}-${Date.now()}`;
    
    const player1 = {
      userId: user.id,
      username: user.username,
      elo: user.elo,
      socket: ws,
    };
    
    // Create a new battle
    await battleManager.createBattle(matchId, player1, botPlayer, true);
  } catch (err) {
    console.error('Create bot match error:', err);
    sendErrorToClient(ws, 'Bot match error', 'Could not create bot match');
  }
}

function sendErrorToClient(ws: WebSocket, errorType: string, errorMessage: string) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'error',
      payload: {
        errorType,
        message: errorMessage,
      }
    }));
  }
}
