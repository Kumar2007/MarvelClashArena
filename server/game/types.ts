import { User } from "@shared/schema";
import { WebSocket } from "ws";
import { Hero, Skill } from "./heroes";

// Game state types
export interface Player {
  userId: number;
  username: string;
  elo: number;
  socket: WebSocket;
  isBot?: boolean;
  botDifficulty?: 'novice' | 'veteran' | 'master';
}

export interface MatchedPlayers {
  player1: Player;
  player2: Player;
  matchId: string;
}

export interface HeroInstance {
  heroId: string;
  currentHp: number;
  maxHp: number;
  currentEp: number;
  maxEp: number;
  epRegen: number;
  position: 'front' | 'back';
  isAlive: boolean;
  buffs: Effect[];
  debuffs: Effect[];
  skillCooldowns: Record<number, number>; // skillId -> cooldown remaining
}

export interface Effect {
  type: 'shield' | 'strengthen' | 'speed' | 'regen' | 'stun' | 'burn' | 'bleed' | 'slow' | 'weaken';
  duration: number;
  value?: number;
  source: string; // heroId that applied this effect
}

export interface ActionResult {
  success: boolean;
  message?: string;
  narration?: string;
  damage?: number;
  healing?: number;
  effects?: Effect[];
}

export interface GameState {
  matchId: string;
  player1Id: number;
  player2Id: number;
  player1Username: string;
  player2Username: string;
  player1Team: HeroInstance[];
  player2Team: HeroInstance[];
  currentRound: number;
  currentTurn: number; // playerId whose turn it is
  turnTimeRemaining: number;
  isMatchmaking: boolean;
  isPrivateMatch: boolean;
  isBotMatch: boolean;
  botDifficulty?: 'novice' | 'veteran' | 'master';
  matchStartTime: number;
  matchEndTime?: number;
  winner?: number;
  phase: 'drafting' | 'battle' | 'complete';
  player1Ready: boolean;
  player2Ready: boolean;
  battleLog: BattleLogEntry[];
}

export interface BattleLogEntry {
  round: number;
  text: string;
  type: 'action' | 'system' | 'effect';
}

export interface ReconnectionState {
  playerId: number;
  matchId: string;
  reconnectTimeout: NodeJS.Timeout;
  gameState: GameState;
}

export interface GameOptions {
  isPrivateMatch: boolean;
  isBotMatch: boolean;
  botDifficulty?: 'novice' | 'veteran' | 'master';
}

export interface PrivateLobby {
  lobbyCode: string;
  lobbyName: string;
  hostId: number;
  hostSocket: WebSocket;
  guestId?: number;
  guestSocket?: WebSocket;
  created: number;
}

// WebSocket message payloads
export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
}

export interface CreateLobbyPayload {
  lobbyName: string;
}

export interface JoinLobbyPayload {
  lobbyCode: string;
}

export interface SelectHeroPayload {
  heroId: string;
}

export interface TurnActionPayload {
  heroId: string;
  skillId: number;
  targetId: string;
}

export interface SwapPositionPayload {
  heroId: string;
  position: 'front' | 'back';
}

export interface CreateBotMatchPayload {
  difficulty: 'novice' | 'veteran' | 'master';
}

// Response types
export interface PlayerData {
  id: number;
  username: string;
  elo: number;
  rank: string;
  experience: number;
  unlockedHeroes: string[];
  titles: string[];
  badges: string[];
}

export interface HeroStats {
  id: number;
  heroId: string;
  pickCount: number;
  winCount: number;
  totalDamageDealt: number;
  totalHealing: number;
  totalMatches: number;
  winRate: number;
}

export interface UserStats {
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  heroUsage: Record<string, number>;
  mostPlayedHero?: string;
  bestHero?: {
    heroId: string;
    winRate: number;
  };
}

export interface SkillUsage {
  heroId: string;
  hero: Hero;
  skill: Skill;
  canUse: boolean;
  reason?: string;
  energyCost: number;
  cooldown: number;
  remainingCooldown?: number;
}

export interface TeamStatusData {
  heroId: string;
  name: string;
  currentHp: number;
  maxHp: number;
  currentEp: number;
  maxEp: number;
  position: 'front' | 'back';
  isAlive: boolean;
  effects: Effect[];
}

export interface MatchResultsData {
  matchId: string;
  winnerName: string;
  playerTeam: TeamStatusData[];
  opponentTeam: TeamStatusData[];
  battleLog: BattleLogEntry[];
  matchDuration: number;
  experienceGained: number;
  eloChange: number;
  totalDamageDealt: number;
  highestSingleAttack: number;
  heroesLost: number;
  unlockProgress?: {
    heroId: string;
    progress: number;
    totalNeeded: number;
  };
}
