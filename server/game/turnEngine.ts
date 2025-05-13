import { WebSocket } from "ws";
import { RedisClient } from "./redisClient";
import { IStorage } from "../storage";
import { Player, GameState, HeroInstance, BattleLogEntry, ActionResult, GameOptions, PrivateLobby, ReconnectionState, TurnActionPayload, SwapPositionPayload, Effect } from "./types";
import { getHeroById, getAllHeroes, Hero, Skill } from "./heroes";

export class BattleManager {
  private redis: RedisClient;
  private storage: IStorage;
  private activeGames: Map<string, GameState> = new Map();
  private playerToGame: Map<number, string> = new Map();
  private lobbies: Map<string, PrivateLobby> = new Map();
  private reconnections: Map<number, ReconnectionState> = new Map();
  private readonly TURN_TIMEOUT = 30000; // 30 seconds
  private readonly RECONNECT_WINDOW = 60000; // 60 seconds
  private readonly EXPERIENCE_PER_MATCH = 100;
  private readonly ELO_K_FACTOR = 32;

  constructor(redis: RedisClient, storage: IStorage) {
    this.redis = redis;
    this.storage = storage;
  }

  /**
   * Create a new battle between two players
   */
  async createBattle(
    matchId: string,
    player1: Player,
    player2: Player,
    isBotMatch: boolean,
    isPrivateMatch: boolean = false
  ): Promise<void> {
    console.log(`Creating new battle: ${matchId} between ${player1.username} and ${player2.username}`);
    
    // Check if either player is already in a game
    if (this.playerToGame.has(player1.userId) || this.playerToGame.has(player2.userId)) {
      console.error("One of the players is already in a game");
      return;
    }
    
    // Initial game state
    const gameState: GameState = {
      matchId,
      player1Id: player1.userId,
      player2Id: player2.userId,
      player1Username: player1.username,
      player2Username: player2.username,
      player1Team: [],
      player2Team: [],
      currentRound: 0,
      currentTurn: 0, // Will be set once the draft is complete
      turnTimeRemaining: 0,
      isMatchmaking: !isPrivateMatch && !isBotMatch,
      isPrivateMatch,
      isBotMatch,
      botDifficulty: isBotMatch ? player2.botDifficulty : undefined,
      matchStartTime: Date.now(),
      phase: 'drafting',
      player1Ready: false,
      player2Ready: false,
      battleLog: []
    };
    
    // Store game state
    this.activeGames.set(matchId, gameState);
    this.playerToGame.set(player1.userId, matchId);
    this.playerToGame.set(player2.userId, matchId);
    
    // Store match in database
    await this.storage.createMatch({
      player1Id: player1.userId,
      player2Id: isBotMatch ? null : player2.userId,
      matchState: gameState,
      duration: 0,
      isBot: isBotMatch,
      botDifficulty: isBotMatch ? player2.botDifficulty : null,
      winner: null
    });
    
    // Send match start message to both players
    this.sendToPlayer(player1, {
      type: 'match:start',
      payload: {
        matchId,
        opponent: {
          username: player2.username,
          isBot: player2.isBot || false
        },
        phase: 'drafting',
        availableHeroes: this.getAvailableHeroes(player1.userId),
        yourTeam: [],
        opponentTeam: [],
        timeRemaining: 0 // No time limit for drafting
      }
    });
    
    this.sendToPlayer(player2, {
      type: 'match:start',
      payload: {
        matchId,
        opponent: {
          username: player1.username,
          isBot: player1.isBot || false
        },
        phase: 'drafting',
        availableHeroes: this.getAvailableHeroes(player2.userId),
        yourTeam: [],
        opponentTeam: [],
        timeRemaining: 0 // No time limit for drafting
      }
    });
  }

  /**
   * Select a hero for the player's team
   */
  async selectHero(playerId: number, heroId: string): Promise<ActionResult> {
    // Check if player is in a game
    if (!this.playerToGame.has(playerId)) {
      return { success: false, message: "You are not in a game" };
    }
    
    const matchId = this.playerToGame.get(playerId)!;
    const gameState = this.activeGames.get(matchId);
    
    if (!gameState) {
      return { success: false, message: "Game not found" };
    }
    
    // Check if game is in drafting phase
    if (gameState.phase !== 'drafting') {
      return { success: false, message: "Cannot select heroes outside of drafting phase" };
    }
    
    // Check if hero exists
    const hero = getHeroById(heroId);
    if (!hero) {
      return { success: false, message: "Hero not found" };
    }
    
    // Check if player has access to this hero
    const user = await this.storage.getUser(playerId);
    if (!user || !user.unlockedHeroes.includes(heroId)) {
      return { success: false, message: "Hero not unlocked" };
    }
    
    // Check which team to update
    const isPlayer1 = playerId === gameState.player1Id;
    const team = isPlayer1 ? gameState.player1Team : gameState.player2Team;
    
    // Check if team already has 5 heroes
    if (team.length >= 5) {
      return { success: false, message: "Team already full" };
    }
    
    // Check if hero is already selected
    if (team.some(h => h.heroId === heroId)) {
      return { success: false, message: "Hero already selected" };
    }
    
    // Create hero instance
    const heroInstance: HeroInstance = {
      heroId,
      currentHp: hero.maxHp,
      maxHp: hero.maxHp,
      currentEp: hero.epRegen * 2, // Start with some energy
      maxEp: hero.epMax,
      epRegen: hero.epRegen,
      position: team.length < 2 ? 'front' : 'back', // First two heroes go in front line
      isAlive: true,
      buffs: [],
      debuffs: [],
      skillCooldowns: {}
    };
    
    // Add hero to team
    if (isPlayer1) {
      gameState.player1Team.push(heroInstance);
    } else {
      gameState.player2Team.push(heroInstance);
    }
    
    // Update game state
    this.activeGames.set(matchId, gameState);
    
    // Update match in database
    await this.storage.updateMatchState(parseInt(matchId), gameState);
    
    // Notify both players
    this.notifyPlayersInMatch(matchId, {
      type: 'game:hero_selected',
      payload: {
        playerId,
        heroId,
        playerTeam: isPlayer1 ? gameState.player1Team : gameState.player2Team
      }
    });
    
    return { success: true, message: "Hero selected" };
  }

  /**
   * Confirm team selection and proceed to battle
   */
  async confirmTeam(playerId: number): Promise<ActionResult> {
    // Check if player is in a game
    if (!this.playerToGame.has(playerId)) {
      return { success: false, message: "You are not in a game" };
    }
    
    const matchId = this.playerToGame.get(playerId)!;
    const gameState = this.activeGames.get(matchId);
    
    if (!gameState) {
      return { success: false, message: "Game not found" };
    }
    
    // Check if game is in drafting phase
    if (gameState.phase !== 'drafting') {
      return { success: false, message: "Cannot confirm team outside of drafting phase" };
    }
    
    // Check which player is confirming
    const isPlayer1 = playerId === gameState.player1Id;
    const team = isPlayer1 ? gameState.player1Team : gameState.player2Team;
    
    // Check if team has exactly 5 heroes
    if (team.length !== 5) {
      return { success: false, message: "Team must have exactly 5 heroes" };
    }
    
    // Mark player as ready
    if (isPlayer1) {
      gameState.player1Ready = true;
    } else {
      gameState.player2Ready = true;
    }
    
    // Update game state
    this.activeGames.set(matchId, gameState);
    
    // Notify both players
    this.notifyPlayersInMatch(matchId, {
      type: 'game:team_confirmed',
      payload: {
        playerId,
        isReady: true
      }
    });
    
    // Check if both players are ready
    if (gameState.player1Ready && gameState.player2Ready) {
      // Start the battle
      await this.startBattle(matchId);
    }
    
    return { success: true, message: "Team confirmed" };
  }

  /**
   * Start the battle phase after both players have selected their teams
   */
  private async startBattle(matchId: string): Promise<void> {
    const gameState = this.activeGames.get(matchId);
    
    if (!gameState) {
      console.error(`Cannot start battle: Game ${matchId} not found`);
      return;
    }
    
    // Update game state
    gameState.phase = 'battle';
    gameState.currentRound = 1;
    
    // Determine who goes first based on speed
    const player1FastestHero = this.getFastestHero(gameState.player1Team);
    const player2FastestHero = this.getFastestHero(gameState.player2Team);
    
    const player1GoesFirst = player1FastestHero >= player2FastestHero;
    gameState.currentTurn = player1GoesFirst ? gameState.player1Id : gameState.player2Id;
    
    // Add battle start entry to battle log
    gameState.battleLog.push({
      round: 1,
      text: `Battle begins! ${player1GoesFirst ? gameState.player1Username : gameState.player2Username} takes the first turn.`,
      type: 'system'
    });
    
    // Update game state
    this.activeGames.set(matchId, gameState);
    
    // Update match in database
    await this.storage.updateMatchState(parseInt(matchId), gameState);
    
    // Notify both players
    this.notifyPlayersInMatch(matchId, {
      type: 'battle:start',
      payload: {
        round: 1,
        currentTurn: gameState.currentTurn,
        player1Team: this.getTeamStatus(gameState.player1Team),
        player2Team: this.getTeamStatus(gameState.player2Team),
        battleLog: gameState.battleLog
      }
    });
    
    // Start the first turn
    this.startTurn(matchId);
  }

  /**
   * Start a new turn
   */
  private async startTurn(matchId: string): Promise<void> {
    const gameState = this.activeGames.get(matchId);
    
    if (!gameState) {
      console.error(`Cannot start turn: Game ${matchId} not found`);
      return;
    }
    
    // Get current player
    const currentPlayerId = gameState.currentTurn;
    const isPlayer1 = currentPlayerId === gameState.player1Id;
    const currentPlayerTeam = isPlayer1 ? gameState.player1Team : gameState.player2Team;
    const opponentTeam = isPlayer1 ? gameState.player2Team : gameState.player1Team;
    
    // Check if there are any alive heroes
    const hasAliveHeroes = currentPlayerTeam.some(hero => hero.isAlive);
    const opponentHasAliveHeroes = opponentTeam.some(hero => hero.isAlive);
    
    // If either team has no alive heroes, end the match
    if (!hasAliveHeroes || !opponentHasAliveHeroes) {
      await this.endMatch(matchId, hasAliveHeroes ? currentPlayerId : (isPlayer1 ? gameState.player2Id : gameState.player1Id));
      return;
    }
    
    // Set turn timer
    gameState.turnTimeRemaining = this.TURN_TIMEOUT;
    
    // Update game state
    this.activeGames.set(matchId, gameState);
    
    // Notify current player that it's their turn
    this.notifyPlayer(currentPlayerId, {
      type: 'turn:prompt',
      payload: {
        matchId,
        round: gameState.currentRound,
        currentTurn: currentPlayerId,
        timeRemaining: gameState.turnTimeRemaining,
        yourTeam: this.getTeamStatus(currentPlayerTeam),
        opponentTeam: this.getTeamStatus(opponentTeam),
        availableActions: this.getAvailableActions(currentPlayerTeam, opponentTeam),
        battleLog: gameState.battleLog
      }
    });
    
    // Notify opponent
    this.notifyPlayer(isPlayer1 ? gameState.player2Id : gameState.player1Id, {
      type: 'turn:waiting',
      payload: {
        matchId,
        round: gameState.currentRound,
        currentTurn: currentPlayerId,
        timeRemaining: gameState.turnTimeRemaining,
        yourTeam: this.getTeamStatus(opponentTeam),
        opponentTeam: this.getTeamStatus(currentPlayerTeam),
        battleLog: gameState.battleLog
      }
    });
    
    // Start turn timeout
    setTimeout(() => {
      this.checkTurnTimeout(matchId, currentPlayerId, gameState.currentRound);
    }, this.TURN_TIMEOUT);
  }

  /**
   * Execute a turn action (use skill)
   */
  async executeTurnAction(playerId: number, action: TurnActionPayload): Promise<ActionResult> {
    // Check if player is in a game
    if (!this.playerToGame.has(playerId)) {
      return { success: false, message: "You are not in a game" };
    }
    
    const matchId = this.playerToGame.get(playerId)!;
    const gameState = this.activeGames.get(matchId);
    
    if (!gameState) {
      return { success: false, message: "Game not found" };
    }
    
    // Check if it's the player's turn
    if (gameState.currentTurn !== playerId) {
      return { success: false, message: "It's not your turn" };
    }
    
    // Check if battle phase
    if (gameState.phase !== 'battle') {
      return { success: false, message: "Cannot take actions outside of battle phase" };
    }
    
    // Get player team and check if hero exists and is alive
    const isPlayer1 = playerId === gameState.player1Id;
    const currentPlayerTeam = isPlayer1 ? gameState.player1Team : gameState.player2Team;
    const opponentTeam = isPlayer1 ? gameState.player2Team : gameState.player1Team;
    
    const actingHero = currentPlayerTeam.find(hero => hero.heroId === action.heroId);
    
    if (!actingHero) {
      return { success: false, message: "Hero not found in your team" };
    }
    
    if (!actingHero.isAlive) {
      return { success: false, message: "Hero is defeated and cannot act" };
    }
    
    // Check if hero has any stun debuffs
    const isStunned = actingHero.debuffs.some(debuff => debuff.type === 'stun' && debuff.duration > 0);
    if (isStunned) {
      return { success: false, message: "Hero is stunned and cannot act" };
    }
    
    // Get hero data and check if skill exists
    const heroData = getHeroById(actingHero.heroId);
    if (!heroData) {
      return { success: false, message: "Hero data not found" };
    }
    
    const skill = heroData.skills.find(s => s.id === action.skillId);
    if (!skill) {
      return { success: false, message: "Skill not found" };
    }
    
    // Check if skill is on cooldown
    const cooldown = actingHero.skillCooldowns[skill.id] || 0;
    if (cooldown > 0) {
      return { success: false, message: "Skill is on cooldown" };
    }
    
    // Check if hero has enough energy
    if (actingHero.currentEp < skill.energyCost) {
      return { success: false, message: "Not enough energy" };
    }
    
    // Find target(s)
    let targets: HeroInstance[] = [];
    
    // Determine valid targets based on skill targeting
    switch (skill.targeting) {
      case 'enemy':
        // Single enemy target
        const targetHero = opponentTeam.find(hero => hero.heroId === action.targetId);
        if (!targetHero || !targetHero.isAlive) {
          return { success: false, message: "Invalid target" };
        }
        targets = [targetHero];
        break;
        
      case 'ally':
        // Single ally target
        const allyHero = currentPlayerTeam.find(hero => hero.heroId === action.targetId);
        if (!allyHero || !allyHero.isAlive) {
          return { success: false, message: "Invalid target" };
        }
        targets = [allyHero];
        break;
        
      case 'self':
        // Self target
        targets = [actingHero];
        break;
        
      case 'all_enemies':
        // All enemy targets
        targets = opponentTeam.filter(hero => hero.isAlive);
        break;
        
      case 'all_allies':
        // All ally targets
        targets = currentPlayerTeam.filter(hero => hero.isAlive);
        break;
        
      case 'all':
        // All targets (enemies and allies)
        targets = [...currentPlayerTeam, ...opponentTeam].filter(hero => hero.isAlive);
        break;
        
      default:
        return { success: false, message: "Invalid targeting type" };
    }
    
    if (targets.length === 0) {
      return { success: false, message: "No valid targets" };
    }
    
    // Apply skill effects
    const result = await this.applySkillEffects(actingHero, skill, targets, heroData, gameState);
    
    // Update skill cooldown and energy
    actingHero.currentEp -= skill.energyCost;
    if (skill.cooldown > 0) {
      actingHero.skillCooldowns[skill.id] = skill.cooldown;
    }
    
    // Update game state
    this.activeGames.set(matchId, gameState);
    
    // Update match in database
    await this.storage.updateMatchState(parseInt(matchId), gameState);
    
    // Notify both players
    this.notifyPlayersInMatch(matchId, {
      type: 'turn:update',
      payload: {
        actingPlayerId: playerId,
        heroId: action.heroId,
        skillId: action.skillId,
        targetIds: targets.map(t => t.heroId),
        result: {
          damage: result.damage,
          healing: result.healing,
          effects: result.effects
        },
        narration: result.narration,
        player1Team: this.getTeamStatus(gameState.player1Team),
        player2Team: this.getTeamStatus(gameState.player2Team),
        battleLog: gameState.battleLog
      }
    });
    
    // Check if the match is over
    const player1HasAliveHeroes = gameState.player1Team.some(hero => hero.isAlive);
    const player2HasAliveHeroes = gameState.player2Team.some(hero => hero.isAlive);
    
    if (!player1HasAliveHeroes || !player2HasAliveHeroes) {
      await this.endMatch(matchId, player1HasAliveHeroes ? gameState.player1Id : gameState.player2Id);
      return result;
    }
    
    // End this turn and start the next
    this.endTurn(matchId);
    
    return result;
  }

  /**
   * Apply skill effects to targets
   */
  private async applySkillEffects(
    actor: HeroInstance,
    skill: Skill,
    targets: HeroInstance[],
    heroData: Hero,
    gameState: GameState
  ): Promise<ActionResult> {
    // Track damage and healing
    let totalDamage = 0;
    let totalHealing = 0;
    const appliedEffects: Effect[] = [];
    
    // Generate narration
    let narration = skill.narration;
    
    // Apply strengthening buffs to damage
    const strengthBuffs = actor.buffs.filter(buff => buff.type === 'strengthen');
    const damageMultiplier = 1 + strengthBuffs.reduce((sum, buff) => sum + (buff.value || 0) / 100, 0);
    
    // Apply weakening debuffs to damage received
    const damageReductionFn = (target: HeroInstance) => {
      const weakenDebuffs = target.debuffs.filter(debuff => debuff.type === 'weaken');
      return 1 + weakenDebuffs.reduce((sum, debuff) => sum + (debuff.value || 0) / 100, 0);
    };
    
    // Add to battle log
    const actorName = heroData.name;
    const skillName = skill.name;
    
    gameState.battleLog.push({
      round: gameState.currentRound,
      text: `${actorName} used ${skillName}!`,
      type: 'action'
    });
    
    // Apply effects to each target
    for (const target of targets) {
      // Get target hero data
      const targetHeroData = getHeroById(target.heroId);
      if (!targetHeroData) continue;
      
      // Apply damage
      if (skill.baseDamage > 0) {
        // Calculate damage with buffs and debuffs
        const damage = Math.floor(skill.baseDamage * damageMultiplier * damageReductionFn(target));
        
        // Apply shield reduction
        const shieldBuffs = target.buffs.filter(buff => buff.type === 'shield');
        const shieldValue = shieldBuffs.reduce((sum, buff) => sum + (buff.value || 0), 0);
        
        let actualDamage = damage;
        if (shieldValue > 0) {
          // Reduce damage by shield
          const absorbedDamage = Math.min(damage, shieldValue);
          actualDamage -= absorbedDamage;
          
          // Remove shield value used
          let remainingDamage = absorbedDamage;
          for (const shield of shieldBuffs) {
            if (remainingDamage <= 0) break;
            
            const value = shield.value || 0;
            const absorbed = Math.min(value, remainingDamage);
            shield.value = value - absorbed;
            remainingDamage -= absorbed;
            
            // Remove shield if depleted
            if (shield.value <= 0) {
              target.buffs = target.buffs.filter(b => b !== shield);
            }
          }
          
          // Add to battle log
          gameState.battleLog.push({
            round: gameState.currentRound,
            text: `${targetHeroData.name}'s shield absorbed ${absorbedDamage} damage!`,
            type: 'effect'
          });
        }
        
        // Apply damage to target
        target.currentHp = Math.max(0, target.currentHp - actualDamage);
        totalDamage += actualDamage;
        
        // Add to battle log
        gameState.battleLog.push({
          round: gameState.currentRound,
          text: `${targetHeroData.name} took ${actualDamage} damage!`,
          type: 'effect'
        });
        
        // Check if target is defeated
        if (target.currentHp <= 0) {
          target.isAlive = false;
          
          // Add to battle log
          gameState.battleLog.push({
            round: gameState.currentRound,
            text: `${targetHeroData.name} was defeated!`,
            type: 'effect'
          });
        }
      }
      
      // Apply healing
      if (skill.healing > 0) {
        // Calculate healing
        const healing = skill.healing;
        
        // Apply healing to target
        const missingHp = target.maxHp - target.currentHp;
        const actualHealing = Math.min(missingHp, healing);
        target.currentHp += actualHealing;
        totalHealing += actualHealing;
        
        // Add to battle log
        if (actualHealing > 0) {
          gameState.battleLog.push({
            round: gameState.currentRound,
            text: `${targetHeroData.name} recovered ${actualHealing} HP!`,
            type: 'effect'
          });
        }
      }
      
      // Apply buffs
      if (skill.applyBuff) {
        const buff: Effect = {
          type: skill.applyBuff.type,
          duration: skill.applyBuff.duration,
          value: skill.applyBuff.value,
          source: actor.heroId
        };
        
        // Add buff to target
        target.buffs.push(buff);
        appliedEffects.push(buff);
        
        // Add to battle log
        gameState.battleLog.push({
          round: gameState.currentRound,
          text: `${targetHeroData.name} gained ${buff.type} buff!`,
          type: 'effect'
        });
      }
      
      // Apply debuffs
      if (skill.applyDebuff) {
        const debuff: Effect = {
          type: skill.applyDebuff.type,
          duration: skill.applyDebuff.duration,
          value: skill.applyDebuff.value,
          source: actor.heroId
        };
        
        // Add debuff to target
        target.debuffs.push(debuff);
        appliedEffects.push(debuff);
        
        // Add to battle log
        gameState.battleLog.push({
          round: gameState.currentRound,
          text: `${targetHeroData.name} suffered ${debuff.type} debuff!`,
          type: 'effect'
        });
      }
    }
    
    return {
      success: true,
      narration,
      damage: totalDamage,
      healing: totalHealing,
      effects: appliedEffects
    };
  }

  /**
   * Swap hero position (front/back)
   */
  async swapHeroPosition(playerId: number, swap: SwapPositionPayload): Promise<ActionResult> {
    // Check if player is in a game
    if (!this.playerToGame.has(playerId)) {
      return { success: false, message: "You are not in a game" };
    }
    
    const matchId = this.playerToGame.get(playerId)!;
    const gameState = this.activeGames.get(matchId);
    
    if (!gameState) {
      return { success: false, message: "Game not found" };
    }
    
    // Check if it's the player's turn
    if (gameState.currentTurn !== playerId) {
      return { success: false, message: "It's not your turn" };
    }
    
    // Check if battle phase
    if (gameState.phase !== 'battle') {
      return { success: false, message: "Cannot swap positions outside of battle phase" };
    }
    
    // Get player team and check if hero exists and is alive
    const isPlayer1 = playerId === gameState.player1Id;
    const team = isPlayer1 ? gameState.player1Team : gameState.player2Team;
    
    const hero = team.find(h => h.heroId === swap.heroId);
    
    if (!hero) {
      return { success: false, message: "Hero not found in your team" };
    }
    
    if (!hero.isAlive) {
      return { success: false, message: "Hero is defeated and cannot be moved" };
    }
    
    // Check if position is valid
    if (swap.position !== 'front' && swap.position !== 'back') {
      return { success: false, message: "Invalid position" };
    }
    
    // Check if hero is already in that position
    if (hero.position === swap.position) {
      return { success: false, message: "Hero is already in that position" };
    }
    
    // Get hero data
    const heroData = getHeroById(hero.heroId);
    if (!heroData) {
      return { success: false, message: "Hero data not found" };
    }
    
    // Update hero position
    hero.position = swap.position;
    
    // Add to battle log
    gameState.battleLog.push({
      round: gameState.currentRound,
      text: `${heroData.name} moved to the ${swap.position} line.`,
      type: 'action'
    });
    
    // Update game state
    this.activeGames.set(matchId, gameState);
    
    // Update match in database
    await this.storage.updateMatchState(parseInt(matchId), gameState);
    
    // Notify both players
    this.notifyPlayersInMatch(matchId, {
      type: 'turn:swap',
      payload: {
        playerId,
        heroId: swap.heroId,
        position: swap.position,
        player1Team: this.getTeamStatus(gameState.player1Team),
        player2Team: this.getTeamStatus(gameState.player2Team),
        battleLog: gameState.battleLog
      }
    });
    
    // End turn
    this.endTurn(matchId);
    
    return { success: true, message: "Position swapped" };
  }

  /**
   * End the current turn and start the next
   */
  private async endTurn(matchId: string): Promise<void> {
    const gameState = this.activeGames.get(matchId);
    
    if (!gameState) {
      console.error(`Cannot end turn: Game ${matchId} not found`);
      return;
    }
    
    // Switch turns
    const currentPlayerId = gameState.currentTurn;
    const isPlayer1 = currentPlayerId === gameState.player1Id;
    const nextPlayerId = isPlayer1 ? gameState.player2Id : gameState.player1Id;
    
    gameState.currentTurn = nextPlayerId;
    
    // Check if we've completed a round (both players have taken a turn)
    if (!isPlayer1) {
      // Player 2 just finished, increment round
      gameState.currentRound++;
      
      // Process end of round effects
      await this.processEndOfRound(matchId);
    }
    
    // Update game state
    this.activeGames.set(matchId, gameState);
    
    // Start next turn
    this.startTurn(matchId);
  }

  /**
   * Process end of round effects (EP regen, cooldown reduction, effect duration)
   */
  private async processEndOfRound(matchId: string): Promise<void> {
    const gameState = this.activeGames.get(matchId);
    
    if (!gameState) {
      console.error(`Cannot process end of round: Game ${matchId} not found`);
      return;
    }
    
    // Add to battle log
    gameState.battleLog.push({
      round: gameState.currentRound,
      text: `Round ${gameState.currentRound} begins!`,
      type: 'system'
    });
    
    // Process both teams
    const processTeam = (team: HeroInstance[]) => {
      for (const hero of team) {
        if (!hero.isAlive) continue;
        
        // EP regeneration
        const epRegen = hero.epRegen;
        const newEp = Math.min(hero.maxEp, hero.currentEp + epRegen);
        const epGained = newEp - hero.currentEp;
        hero.currentEp = newEp;
        
        if (epGained > 0) {
          // Add to battle log
          const heroData = getHeroById(hero.heroId);
          if (heroData) {
            gameState.battleLog.push({
              round: gameState.currentRound,
              text: `${heroData.name} recovered ${epGained} energy.`,
              type: 'effect'
            });
          }
        }
        
        // Cooldown reduction
        for (const skillId in hero.skillCooldowns) {
          if (hero.skillCooldowns[skillId] > 0) {
            hero.skillCooldowns[skillId]--;
            
            // Add to battle log if cooldown completed
            if (hero.skillCooldowns[skillId] === 0) {
              const heroData = getHeroById(hero.heroId);
              const skill = heroData?.skills.find(s => s.id === parseInt(skillId));
              
              if (heroData && skill) {
                gameState.battleLog.push({
                  round: gameState.currentRound,
                  text: `${heroData.name}'s ${skill.name} is ready again.`,
                  type: 'effect'
                });
              }
            }
          }
        }
        
        // Buff duration reduction
        hero.buffs = hero.buffs.filter(buff => {
          buff.duration--;
          
          // Remove expired buffs
          if (buff.duration <= 0) {
            // Add to battle log
            const heroData = getHeroById(hero.heroId);
            if (heroData) {
              gameState.battleLog.push({
                round: gameState.currentRound,
                text: `${heroData.name}'s ${buff.type} buff expired.`,
                type: 'effect'
              });
            }
            return false;
          }
          return true;
        });
        
        // Debuff duration reduction
        hero.debuffs = hero.debuffs.filter(debuff => {
          debuff.duration--;
          
          // Remove expired debuffs
          if (debuff.duration <= 0) {
            // Add to battle log
            const heroData = getHeroById(hero.heroId);
            if (heroData) {
              gameState.battleLog.push({
                round: gameState.currentRound,
                text: `${heroData.name} is no longer affected by ${debuff.type}.`,
                type: 'effect'
              });
            }
            return false;
          }
          return true;
        });
        
        // Apply damage over time effects (burn, bleed)
        const dotDebuffs = hero.debuffs.filter(debuff => 
          (debuff.type === 'burn' || debuff.type === 'bleed') && debuff.value
        );
        
        if (dotDebuffs.length > 0) {
          let totalDotDamage = 0;
          
          for (const dot of dotDebuffs) {
            const dotDamage = dot.value || 0;
            totalDotDamage += dotDamage;
          }
          
          if (totalDotDamage > 0) {
            // Apply damage
            hero.currentHp = Math.max(0, hero.currentHp - totalDotDamage);
            
            // Add to battle log
            const heroData = getHeroById(hero.heroId);
            if (heroData) {
              gameState.battleLog.push({
                round: gameState.currentRound,
                text: `${heroData.name} took ${totalDotDamage} damage from damage over time effects.`,
                type: 'effect'
              });
            }
            
            // Check if hero is defeated
            if (hero.currentHp <= 0) {
              hero.isAlive = false;
              
              // Add to battle log
              if (heroData) {
                gameState.battleLog.push({
                  round: gameState.currentRound,
                  text: `${heroData.name} was defeated!`,
                  type: 'effect'
                });
              }
            }
          }
        }
        
        // Apply regeneration effects
        const regenBuffs = hero.buffs.filter(buff => buff.type === 'regen' && buff.value);
        
        if (regenBuffs.length > 0) {
          let totalRegen = 0;
          
          for (const regen of regenBuffs) {
            const regenAmount = regen.value || 0;
            totalRegen += regenAmount;
          }
          
          if (totalRegen > 0) {
            // Apply healing
            const missingHp = hero.maxHp - hero.currentHp;
            const actualHealing = Math.min(missingHp, totalRegen);
            hero.currentHp += actualHealing;
            
            // Add to battle log
            const heroData = getHeroById(hero.heroId);
            if (heroData && actualHealing > 0) {
              gameState.battleLog.push({
                round: gameState.currentRound,
                text: `${heroData.name} recovered ${actualHealing} HP from regeneration.`,
                type: 'effect'
              });
            }
          }
        }
      }
    };
    
    // Process both teams
    processTeam(gameState.player1Team);
    processTeam(gameState.player2Team);
    
    // Update game state
    this.activeGames.set(matchId, gameState);
  }

  /**
   * End the match and declare a winner
   */
  private async endMatch(matchId: string, winnerId: number): Promise<void> {
    const gameState = this.activeGames.get(matchId);
    
    if (!gameState) {
      console.error(`Cannot end match: Game ${matchId} not found`);
      return;
    }
    
    const player1Won = winnerId === gameState.player1Id;
    const winnerUsername = player1Won ? gameState.player1Username : gameState.player2Username;
    const loserUsername = player1Won ? gameState.player2Username : gameState.player1Username;
    
    // Update game state
    gameState.phase = 'complete';
    gameState.winner = winnerId;
    gameState.matchEndTime = Date.now();
    
    // Calculate match duration in seconds
    const matchDuration = Math.floor((gameState.matchEndTime - gameState.matchStartTime) / 1000);
    
    // Add to battle log
    gameState.battleLog.push({
      round: gameState.currentRound,
      text: `Match over! ${winnerUsername} is victorious!`,
      type: 'system'
    });
    
    // Update match in database
    await this.storage.updateMatchState(parseInt(matchId), gameState);
    await this.storage.endMatch(parseInt(matchId), winnerId, matchDuration);
    
    // Update player stats if not a bot match
    if (!gameState.isBotMatch) {
      // Update winner stats
      await this.updatePlayerStats(winnerId, true, matchDuration);
      
      // Update loser stats
      const loserId = player1Won ? gameState.player2Id : gameState.player1Id;
      await this.updatePlayerStats(loserId, false, matchDuration);
      
      // Update hero stats
      await this.updateHeroStats(gameState);
      
      // Calculate and update ELO ratings
      await this.updateEloRatings(
        winnerId,
        player1Won ? gameState.player2Id : gameState.player1Id,
        gameState.isBotMatch
      );
    } else {
      // Only update the human player's stats
      const humanPlayerId = gameState.player1Id;
      await this.updatePlayerStats(humanPlayerId, humanPlayerId === winnerId, matchDuration);
      
      // Update hero stats just for the human player
      await this.updateHeroStats(gameState, true);
      
      // Simplified ELO update for bot matches
      if (humanPlayerId === winnerId) {
        // Human wins against bot
        const botDifficulty = gameState.botDifficulty || 'novice';
        const eloChange = botDifficulty === 'master' ? 20 : 
                          botDifficulty === 'veteran' ? 15 : 10;
        
        await this.updateBotMatchElo(humanPlayerId, eloChange);
      } else {
        // Human loses to bot
        const botDifficulty = gameState.botDifficulty || 'novice';
        const eloChange = botDifficulty === 'master' ? -10 : 
                          botDifficulty === 'veteran' ? -15 : -20;
        
        await this.updateBotMatchElo(humanPlayerId, eloChange);
      }
    }
    
    // Notify both players
    this.notifyPlayersInMatch(matchId, {
      type: 'match:end',
      payload: {
        matchId,
        winnerId,
        winnerUsername,
        matchDuration,
        player1Team: this.getTeamStatus(gameState.player1Team),
        player2Team: this.getTeamStatus(gameState.player2Team),
        battleLog: gameState.battleLog,
        experience: this.EXPERIENCE_PER_MATCH,
        eloChange: this.calculateEloChange(winnerId === gameState.player1Id, gameState.isBotMatch)
      }
    });
    
    // Check if player unlocked a new hero
    // This is simplified - in a real game you'd have more complex unlock logic
    if (!gameState.isBotMatch) {
      const winner = await this.storage.getUser(winnerId);
      
      if (winner) {
        // Check if player can unlock a new hero
        const unlockedHeroes = winner.unlockedHeroes;
        const allHeroes = getAllHeroes().map(h => h.id);
        const lockedHeroes = allHeroes.filter(id => !unlockedHeroes.includes(id));
        
        if (lockedHeroes.length > 0) {
          // 10% chance to unlock a new hero on win
          if (Math.random() < 0.1) {
            const randomHeroId = lockedHeroes[Math.floor(Math.random() * lockedHeroes.length)];
            const unlocked = await this.storage.unlockHero(winnerId, randomHeroId);
            
            if (unlocked) {
              const hero = getHeroById(randomHeroId);
              
              if (hero) {
                // Notify player of unlock
                this.notifyPlayer(winnerId, {
                  type: 'hero:unlocked',
                  payload: {
                    heroId: randomHeroId,
                    heroName: hero.name
                  }
                });
              }
            }
          }
        }
      }
    }
    
    // Clean up match data
    this.activeGames.delete(matchId);
    this.playerToGame.delete(gameState.player1Id);
    this.playerToGame.delete(gameState.player2Id);
  }

  /**
   * Update player stats after a match
   */
  private async updatePlayerStats(playerId: number, isWin: boolean, matchDuration: number): Promise<void> {
    // Add experience
    await this.storage.updateUserExperience(playerId, this.EXPERIENCE_PER_MATCH);
  }

  /**
   * Update hero stats after a match
   */
  private async updateHeroStats(gameState: GameState, onlyPlayerOne: boolean = false): Promise<void> {
    // Player 1 heroes
    for (const hero of gameState.player1Team) {
      const isWin = gameState.winner === gameState.player1Id;
      
      // Calculate total damage and healing (simplified)
      const damageDealt = 100; // In a real implementation, track damage per hero
      const healing = 50;      // In a real implementation, track healing per hero
      
      // Update hero stats
      await this.storage.updateHeroStats(hero.heroId, isWin, damageDealt, healing);
    }
    
    // Player 2 heroes (if not a bot or if we want to update bot heroes too)
    if (!onlyPlayerOne) {
      for (const hero of gameState.player2Team) {
        const isWin = gameState.winner === gameState.player2Id;
        
        // Calculate total damage and healing (simplified)
        const damageDealt = 100; // In a real implementation, track damage per hero
        const healing = 50;      // In a real implementation, track healing per hero
        
        // Update hero stats
        await this.storage.updateHeroStats(hero.heroId, isWin, damageDealt, healing);
      }
    }
  }

  /**
   * Update ELO ratings after a match
   */
  private async updateEloRatings(winnerId: number, loserId: number, isBotMatch: boolean): Promise<void> {
    if (isBotMatch) return; // Don't update ELO for bot matches
    
    // Get players
    const winner = await this.storage.getUser(winnerId);
    const loser = await this.storage.getUser(loserId);
    
    if (!winner || !loser) return;
    
    // Calculate ELO change
    const winnerElo = winner.elo;
    const loserElo = loser.elo;
    
    // Expected score (probability of winning)
    const expectedWinnerScore = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
    const expectedLoserScore = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));
    
    // Actual score
    const actualWinnerScore = 1;
    const actualLoserScore = 0;
    
    // Calculate new ELO
    const newWinnerElo = Math.round(winnerElo + this.ELO_K_FACTOR * (actualWinnerScore - expectedWinnerScore));
    const newLoserElo = Math.round(loserElo + this.ELO_K_FACTOR * (actualLoserScore - expectedLoserScore));
    
    // Update ELO
    await this.storage.updateUserElo(winnerId, newWinnerElo);
    await this.storage.updateUserElo(loserId, newLoserElo);
  }

  /**
   * Update ELO for bot matches
   */
  private async updateBotMatchElo(playerId: number, eloChange: number): Promise<void> {
    const player = await this.storage.getUser(playerId);
    
    if (!player) return;
    
    const newElo = Math.max(1, player.elo + eloChange);
    await this.storage.updateUserElo(playerId, newElo);
  }

  /**
   * Surrender a match
   */
  async surrender(playerId: number): Promise<ActionResult> {
    // Check if player is in a game
    if (!this.playerToGame.has(playerId)) {
      return { success: false, message: "You are not in a game" };
    }
    
    const matchId = this.playerToGame.get(playerId)!;
    const gameState = this.activeGames.get(matchId);
    
    if (!gameState) {
      return { success: false, message: "Game not found" };
    }
    
    // Check if battle phase
    if (gameState.phase !== 'battle') {
      return { success: false, message: "Cannot surrender outside of battle phase" };
    }
    
    // Determine winner
    const winnerId = playerId === gameState.player1Id ? gameState.player2Id : gameState.player1Id;
    
    // Add to battle log
    const surrenderingPlayer = playerId === gameState.player1Id ? gameState.player1Username : gameState.player2Username;
    
    gameState.battleLog.push({
      round: gameState.currentRound,
      text: `${surrenderingPlayer} has surrendered the match!`,
      type: 'system'
    });
    
    // End the match
    await this.endMatch(matchId, winnerId);
    
    return { success: true, message: "You have surrendered the match" };
  }

  /**
   * Handle player disconnect
   */
  async handlePlayerDisconnect(playerId: number): Promise<void> {
    // Check if player is in a game
    if (!this.playerToGame.has(playerId)) {
      return;
    }
    
    const matchId = this.playerToGame.get(playerId)!;
    const gameState = this.activeGames.get(matchId);
    
    if (!gameState) {
      return;
    }
    
    // If the game is already completed, no need to do anything
    if (gameState.phase === 'complete') {
      return;
    }
    
    // Set up reconnection timeout
    const reconnectTimeout = setTimeout(async () => {
      console.log(`Player ${playerId} did not reconnect, ending match`);
      
      // Get the opponent
      const isPlayer1 = playerId === gameState.player1Id;
      const opponentId = isPlayer1 ? gameState.player2Id : gameState.player1Id;
      
      // End the match with the opponent as winner
      await this.endMatch(matchId, opponentId);
      
      // Remove from reconnections
      this.reconnections.delete(playerId);
      
    }, this.RECONNECT_WINDOW);
    
    // Store reconnection state
    this.reconnections.set(playerId, {
      playerId,
      matchId,
      reconnectTimeout,
      gameState: { ...gameState }
    });
    
    // Notify opponent
    const isPlayer1 = playerId === gameState.player1Id;
    const opponentId = isPlayer1 ? gameState.player2Id : gameState.player1Id;
    
    this.notifyPlayer(opponentId, {
      type: 'player:disconnected',
      payload: {
        playerId,
        username: isPlayer1 ? gameState.player1Username : gameState.player2Username,
        reconnectWindow: this.RECONNECT_WINDOW / 1000
      }
    });
  }

  /**
   * Handle player reconnect
   */
  async handlePlayerReconnect(playerId: number, socket: WebSocket): Promise<void> {
    // Check if player has a reconnection state
    if (!this.reconnections.has(playerId)) {
      return;
    }
    
    const reconnection = this.reconnections.get(playerId)!;
    
    // Clear reconnection timeout
    clearTimeout(reconnection.reconnectTimeout);
    
    // Check if the game is still active
    if (!this.activeGames.has(reconnection.matchId)) {
      console.log(`Player ${playerId} tried to reconnect to inactive game ${reconnection.matchId}`);
      this.reconnections.delete(playerId);
      return;
    }
    
    const gameState = this.activeGames.get(reconnection.matchId)!;
    
    // Update player socket
    const isPlayer1 = playerId === gameState.player1Id;
    
    // Notify opponent
    const opponentId = isPlayer1 ? gameState.player2Id : gameState.player1Id;
    
    this.notifyPlayer(opponentId, {
      type: 'player:reconnected',
      payload: {
        playerId,
        username: isPlayer1 ? gameState.player1Username : gameState.player2Username
      }
    });
    
    // Send game state to reconnected player
    this.sendToSocket(socket, {
      type: 'game:reconnect',
      payload: {
        matchId: reconnection.matchId,
        phase: gameState.phase,
        round: gameState.currentRound,
        currentTurn: gameState.currentTurn,
        yourTeam: this.getTeamStatus(isPlayer1 ? gameState.player1Team : gameState.player2Team),
        opponentTeam: this.getTeamStatus(isPlayer1 ? gameState.player2Team : gameState.player1Team),
        battleLog: gameState.battleLog
      }
    });
    
    // Remove from reconnections
    this.reconnections.delete(playerId);
  }

  /**
   * Check if a turn has timed out
   */
  private async checkTurnTimeout(matchId: string, playerId: number, round: number): Promise<void> {
    const gameState = this.activeGames.get(matchId);
    
    if (!gameState) {
      return;
    }
    
    // Only process if it's still the same player's turn and round
    if (gameState.currentTurn !== playerId || gameState.currentRound !== round) {
      return;
    }
    
    // Add to battle log
    const playerUsername = playerId === gameState.player1Id ? gameState.player1Username : gameState.player2Username;
    
    gameState.battleLog.push({
      round: gameState.currentRound,
      text: `${playerUsername} took too long to act and forfeited their turn!`,
      type: 'system'
    });
    
    // End the turn
    this.endTurn(matchId);
    
    // Notify both players
    this.notifyPlayersInMatch(matchId, {
      type: 'turn:timeout',
      payload: {
        playerId,
        round: gameState.currentRound,
        battleLog: gameState.battleLog
      }
    });
  }

  /**
   * Create a private lobby
   */
  async createLobby(hostId: number, lobbyName: string, socket: WebSocket): Promise<string> {
    // Generate a lobby code
    const lobbyCode = this.generateLobbyCode();
    
    // Create lobby
    const lobby: PrivateLobby = {
      lobbyCode,
      lobbyName,
      hostId,
      hostSocket: socket,
      created: Date.now()
    };
    
    // Store lobby
    this.lobbies.set(lobbyCode, lobby);
    
    console.log(`Created lobby ${lobbyCode} with name ${lobbyName} for player ${hostId}`);
    
    return lobbyCode;
  }

  /**
   * Join a private lobby
   */
  async joinLobby(lobbyCode: string, playerId: number, socket: WebSocket): Promise<boolean> {
    // Check if lobby exists
    if (!this.lobbies.has(lobbyCode)) {
      return false;
    }
    
    const lobby = this.lobbies.get(lobbyCode)!;
    
    // Check if player is the host
    if (lobby.hostId === playerId) {
      return false;
    }
    
    // Check if lobby already has a guest
    if (lobby.guestId) {
      return false;
    }
    
    // Add player as guest
    lobby.guestId = playerId;
    lobby.guestSocket = socket;
    
    // Update lobby
    this.lobbies.set(lobbyCode, lobby);
    
    console.log(`Player ${playerId} joined lobby ${lobbyCode}`);
    
    // Get player info
    const player = await this.storage.getUser(playerId);
    const host = await this.storage.getUser(lobby.hostId);
    
    if (!player || !host) {
      return false;
    }
    
    // Notify host
    if (lobby.hostSocket.readyState === WebSocket.OPEN) {
      lobby.hostSocket.send(JSON.stringify({
        type: 'lobby:player_joined',
        payload: {
          lobbyCode,
          player: {
            id: player.id,
            username: player.username,
            elo: player.elo,
            rank: player.rank
          }
        }
      }));
    }
    
    // Notify guest
    if (lobby.guestSocket.readyState === WebSocket.OPEN) {
      lobby.guestSocket.send(JSON.stringify({
        type: 'lobby:joined',
        payload: {
          lobbyCode,
          lobbyName: lobby.lobbyName,
          host: {
            id: host.id,
            username: host.username,
            elo: host.elo,
            rank: host.rank
          }
        }
      }));
    }
    
    // Start match
    const player1: Player = {
      userId: host.id,
      username: host.username,
      elo: host.elo,
      socket: lobby.hostSocket
    };
    
    const player2: Player = {
      userId: player.id,
      username: player.username,
      elo: player.elo,
      socket: lobby.guestSocket
    };
    
    const matchId = `lobby-${lobbyCode}-${Date.now()}`;
    await this.createBattle(matchId, player1, player2, false, true);
    
    // Remove lobby
    this.lobbies.delete(lobbyCode);
    
    return true;
  }

  /**
   * Create a match against a bot
   */
  async createBotMatch(playerId: number, socket: WebSocket, difficulty: 'novice' | 'veteran' | 'master'): Promise<boolean> {
    // Get player info
    const user = await this.storage.getUser(playerId);
    
    if (!user) {
      return false;
    }
    
    // Create player object
    const player: Player = {
      userId: user.id,
      username: user.username,
      elo: user.elo,
      socket
    };
    
    // Create bot player (from botAI.ts)
    const botPlayer = {
      userId: -1, // Bot ID will be assigned in generateBotPlayer
      username: `Bot-${difficulty}`,
      elo: 1000,
      socket,
      isBot: true,
      botDifficulty: difficulty
    };
    
    // Create match
    const matchId = `bot-${playerId}-${Date.now()}`;
    await this.createBattle(matchId, player, botPlayer, true);
    
    return true;
  }

  /**
   * Helper method to get a list of available heroes for a player
   */
  private async getAvailableHeroes(playerId: number): Promise<any[]> {
    // Get player
    const user = await this.storage.getUser(playerId);
    
    if (!user) {
      return [];
    }
    
    // Get unlocked heroes
    const unlockedHeroIds = user.unlockedHeroes;
    
    // Get hero data for unlocked heroes
    return unlockedHeroIds.map(heroId => {
      const hero = getHeroById(heroId);
      if (!hero) return null;
      
      return {
        id: hero.id,
        name: hero.name,
        class: hero.class,
        archetype: hero.archetype,
        maxHp: hero.maxHp,
        epMax: hero.epMax,
        epRegen: hero.epRegen,
        baseSpeed: hero.baseSpeed,
        skills: hero.skills,
        description: hero.description
      };
    }).filter(hero => hero !== null);
  }

  /**
   * Helper method to get the fastest hero's speed from a team
   */
  private getFastestHero(team: HeroInstance[]): number {
    let fastestSpeed = 0;
    
    for (const hero of team) {
      const heroData = getHeroById(hero.heroId);
      if (heroData && heroData.baseSpeed > fastestSpeed) {
        fastestSpeed = heroData.baseSpeed;
      }
    }
    
    return fastestSpeed;
  }

  /**
   * Helper method to get the status of a team for display
   */
  private getTeamStatus(team: HeroInstance[]): any[] {
    return team.map(hero => {
      const heroData = getHeroById(hero.heroId);
      
      return {
        heroId: hero.heroId,
        name: heroData?.name || 'Unknown Hero',
        currentHp: hero.currentHp,
        maxHp: hero.maxHp,
        currentEp: hero.currentEp,
        maxEp: hero.maxEp,
        position: hero.position,
        isAlive: hero.isAlive,
        effects: [...hero.buffs, ...hero.debuffs]
      };
    });
  }

  /**
   * Helper method to get available actions for a player
   */
  private getAvailableActions(playerTeam: HeroInstance[], opponentTeam: HeroInstance[]): any[] {
    const actions: any[] = [];
    
    // Get usable skills for each hero
    for (const hero of playerTeam) {
      if (!hero.isAlive) continue;
      
      const heroData = getHeroById(hero.heroId);
      if (!heroData) continue;
      
      const heroActions = {
        heroId: hero.heroId,
        name: heroData.name,
        skills: heroData.skills.map(skill => {
          const cooldown = hero.skillCooldowns[skill.id] || 0;
          const canUse = hero.currentEp >= skill.energyCost && cooldown === 0;
          
          return {
            id: skill.id,
            name: skill.name,
            description: skill.description,
            energyCost: skill.energyCost,
            cooldown: skill.cooldown,
            remainingCooldown: cooldown,
            canUse,
            targeting: skill.targeting
          };
        })
      };
      
      actions.push(heroActions);
    }
    
    return actions;
  }

  /**
   * Helper method to generate a random lobby code
   */
  private generateLobbyCode(): string {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return code;
  }

  /**
   * Helper method to calculate ELO change for display
   */
  private calculateEloChange(isWinner: boolean, isBotMatch: boolean): number {
    if (isBotMatch) {
      // Simplified ELO change for bot matches
      return isWinner ? 15 : -15;
    }
    
    // For player matches, this would be calculated based on ELO difference
    // This is just a simplified version for display
    return isWinner ? 25 : -25;
  }

  /**
   * Helper method to send a message to a player
   */
  private notifyPlayer(playerId: number, message: any): void {
    // Find the player's WebSocket
    // In a real implementation, we would have a more robust way to map player IDs to WebSockets
    
    // For now, we'll use a simplified approach
    // We could also use Redis pub/sub for this in a real implementation
    
    const matchId = this.playerToGame.get(playerId);
    if (!matchId) return;
    
    const gameState = this.activeGames.get(matchId);
    if (!gameState) return;
    
    // Find the player's socket
    const isPlayer1 = playerId === gameState.player1Id;
    const opponentId = isPlayer1 ? gameState.player2Id : gameState.player1Id;
    
    // Find socket from reconnections or use a player registry
    // This is a simplified implementation
  }

  /**
   * Helper method to send a message to both players in a match
   */
  private notifyPlayersInMatch(matchId: string, message: any): void {
    const gameState = this.activeGames.get(matchId);
    
    if (!gameState) {
      console.error(`Cannot notify players: Game ${matchId} not found`);
      return;
    }
    
    // Notify player 1
    this.notifyPlayer(gameState.player1Id, message);
    
    // Notify player 2
    this.notifyPlayer(gameState.player2Id, message);
  }

  /**
   * Helper method to send a message to a WebSocket
   */
  private sendToPlayer(player: Player, message: any): void {
    this.sendToSocket(player.socket, message);
  }

  /**
   * Helper method to send a message to a WebSocket
   */
  private sendToSocket(socket: WebSocket, message: any): void {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }
}
