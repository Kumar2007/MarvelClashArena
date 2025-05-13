import { users, type User, type InsertUser, matches, heroStats, type Match, type InsertMatch, type HeroStat, type InsertHeroStat } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateLastLogin(id: number): Promise<void>;
  updateUserElo(id: number, newElo: number): Promise<void>;
  updateUserExperience(id: number, experience: number): Promise<void>;
  unlockHero(userId: number, heroId: string): Promise<boolean>;
  
  // Match operations
  createMatch(match: InsertMatch): Promise<Match>;
  getMatchById(id: number): Promise<Match | undefined>;
  getMatchesByUserId(userId: number): Promise<Match[]>;
  updateMatchState(id: number, state: any): Promise<void>;
  endMatch(id: number, winnerId: number | null, duration: number): Promise<void>;
  
  // Stats operations
  updateHeroStats(heroId: string, isWin: boolean, damageDealt: number, healing: number): Promise<void>;
  getHeroStats(): Promise<HeroStat[]>;
  getUserStats(userId: number): Promise<any>;
  getLeaderboard(limit: number): Promise<Partial<User>[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private matches: Map<number, Match>;
  private heroStats: Map<string, HeroStat>;
  currentId: number;
  currentMatchId: number;
  currentStatId: number;

  constructor() {
    this.users = new Map();
    this.matches = new Map();
    this.heroStats = new Map();
    this.currentId = 1;
    this.currentMatchId = 1;
    this.currentStatId = 1;
    
    // Initialize with some starter heroes for stats
    const starterHeroes = [
      "ironman", "captain-america", "hulk", "black-widow", "thor", 
      "spider-man", "doctor-strange", "scarlet-witch", "hawkeye", "ant-man", 
      "falcon", "vision", "winter-soldier", "rocket-raccoon", "groot"
    ];
    
    starterHeroes.forEach(heroId => {
      this.heroStats.set(heroId, {
        id: this.currentStatId++,
        heroId,
        pickCount: 0,
        winCount: 0,
        totalDamageDealt: 0,
        totalHealing: 0,
        totalMatches: 0,
        updatedAt: new Date()
      });
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const defaultHeroes = ["ironman", "captain-america", "hulk", "black-widow", "thor"];
    
    const user: User = { 
      ...insertUser, 
      id,
      elo: 1000,
      rank: "Rookie",
      lastLogin: new Date(),
      unlockedHeroes: defaultHeroes,
      experience: 0,
      titles: [],
      badges: [],
      createdAt: new Date()
    };
    
    this.users.set(id, user);
    return user;
  }
  
  async updateLastLogin(id: number): Promise<void> {
    const user = await this.getUser(id);
    if (user) {
      user.lastLogin = new Date();
      this.users.set(id, user);
    }
  }
  
  async updateUserElo(id: number, newElo: number): Promise<void> {
    const user = await this.getUser(id);
    if (user) {
      user.elo = newElo;
      
      // Update rank based on ELO
      if (newElo >= 2000) {
        user.rank = "Legendary Commander";
      } else if (newElo >= 1800) {
        user.rank = "Master Tactician";
      } else if (newElo >= 1600) {
        user.rank = "Elite Strategist";
      } else if (newElo >= 1400) {
        user.rank = "Veteran Commander";
      } else if (newElo >= 1200) {
        user.rank = "Skilled Tactician";
      } else if (newElo >= 1000) {
        user.rank = "Experienced Strategist";
      } else {
        user.rank = "Rookie";
      }
      
      this.users.set(id, user);
    }
  }
  
  async updateUserExperience(id: number, experience: number): Promise<void> {
    const user = await this.getUser(id);
    if (user) {
      user.experience += experience;
      this.users.set(id, user);
    }
  }
  
  async unlockHero(userId: number, heroId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;
    
    if (user.unlockedHeroes.includes(heroId)) {
      return false; // Already unlocked
    }
    
    user.unlockedHeroes.push(heroId);
    this.users.set(userId, user);
    return true;
  }
  
  // Match operations
  async createMatch(match: InsertMatch): Promise<Match> {
    const id = this.currentMatchId++;
    const newMatch: Match = {
      ...match,
      id,
      createdAt: new Date()
    };
    
    this.matches.set(id, newMatch);
    return newMatch;
  }
  
  async getMatchById(id: number): Promise<Match | undefined> {
    return this.matches.get(id);
  }
  
  async getMatchesByUserId(userId: number): Promise<Match[]> {
    return Array.from(this.matches.values()).filter(
      match => match.player1Id === userId || match.player2Id === userId
    );
  }
  
  async updateMatchState(id: number, state: any): Promise<void> {
    const match = await this.getMatchById(id);
    if (match) {
      match.matchState = state;
      this.matches.set(id, match);
    }
  }
  
  async endMatch(id: number, winnerId: number | null, duration: number): Promise<void> {
    const match = await this.getMatchById(id);
    if (match) {
      match.winner = winnerId;
      match.duration = duration;
      this.matches.set(id, match);
    }
  }
  
  // Stats operations
  async updateHeroStats(heroId: string, isWin: boolean, damageDealt: number, healing: number): Promise<void> {
    let stats = this.heroStats.get(heroId);
    
    if (!stats) {
      // Create a new hero stat entry if it doesn't exist
      stats = {
        id: this.currentStatId++,
        heroId,
        pickCount: 0,
        winCount: 0,
        totalDamageDealt: 0,
        totalHealing: 0,
        totalMatches: 0,
        updatedAt: new Date()
      };
    }
    
    stats.pickCount += 1;
    stats.totalMatches += 1;
    if (isWin) {
      stats.winCount += 1;
    }
    stats.totalDamageDealt += damageDealt;
    stats.totalHealing += healing;
    stats.updatedAt = new Date();
    
    this.heroStats.set(heroId, stats);
  }
  
  async getHeroStats(): Promise<HeroStat[]> {
    return Array.from(this.heroStats.values());
  }
  
  async getUserStats(userId: number): Promise<any> {
    const matches = await this.getMatchesByUserId(userId);
    const totalMatches = matches.length;
    const wins = matches.filter(match => match.winner === userId).length;
    const losses = matches.filter(match => match.winner !== userId && match.winner !== null).length;
    const draws = matches.filter(match => match.winner === null).length;
    const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
    
    // Calculate hero usage
    const heroUsage: Record<string, number> = {};
    
    matches.forEach(match => {
      const state = match.matchState as any;
      const isPlayer1 = match.player1Id === userId;
      const playerTeam = isPlayer1 ? state.player1Team : state.player2Team;
      
      if (playerTeam && Array.isArray(playerTeam)) {
        playerTeam.forEach(hero => {
          if (hero.heroId) {
            heroUsage[hero.heroId] = (heroUsage[hero.heroId] || 0) + 1;
          }
        });
      }
    });
    
    return {
      totalMatches,
      wins,
      losses,
      draws,
      winRate,
      heroUsage,
    };
  }
  
  async getLeaderboard(limit: number): Promise<Partial<User>[]> {
    const allUsers = Array.from(this.users.values())
      .sort((a, b) => b.elo - a.elo)
      .slice(0, limit)
      .map(({ id, username, elo, rank }) => ({ id, username, elo, rank }));
    
    return allUsers;
  }
}

export const storage = new MemStorage();
