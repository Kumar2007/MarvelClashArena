import { WebSocket } from "ws";
import { Player, TurnActionPayload, GameState, HeroInstance } from "./types";
import { getHeroById, Hero, Skill } from "./heroes";

// Create a mock WebSocket for bot players
class BotWebSocket implements Partial<WebSocket> {
  private listeners: Map<string, Function[]> = new Map();
  public readyState = WebSocket.OPEN;

  constructor(private botId: number, private difficulty: string) {}

  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(listener);
  }

  send(data: string): void {
    // Process messages from the server
    try {
      const message = JSON.parse(data);
      
      // If it's the bot's turn, calculate a move
      if (message.type === 'turn:prompt' && message.payload.currentTurn === this.botId) {
        setTimeout(() => {
          this.simulateBotTurn(message.payload);
        }, this.getResponseDelay());
      }
      
      // Handle match start
      if (message.type === 'match:start') {
        // Bot automatically selects heroes during draft phase
        if (message.payload.phase === 'drafting') {
          this.simulateHeroSelection(message.payload);
        }
      }
      
    } catch (err) {
      console.error("Bot error processing message:", err);
    }
  }

  private simulateBotTurn(gameState: GameState): void {
    try {
      const isPlayer1 = gameState.player1Id === this.botId;
      const botTeam = isPlayer1 ? gameState.player1Team : gameState.player2Team;
      const opponentTeam = isPlayer1 ? gameState.player2Team : gameState.player1Team;
      
      // Get decision based on difficulty
      const decision = this.calculateBestMove(botTeam, opponentTeam);
      
      if (decision) {
        // Trigger the "message" event
        this.listeners.get('message')?.forEach(listener => {
          const actionMessage = JSON.stringify({
            type: 'turn:action',
            payload: decision
          });
          
          listener(actionMessage);
        });
      }
    } catch (err) {
      console.error("Bot error calculating turn:", err);
    }
  }

  private simulateHeroSelection(gameState: GameState): void {
    // Simulate hero draft based on difficulty
    setTimeout(() => {
      // Trigger the "message" event to select heroes
      // This is a simplified version. In the real game, we would select one hero at a time
      const heroes = this.selectBotHeroes();
      
      // Select heroes one by one with delays for realism
      const selectHero = (index: number) => {
        if (index >= heroes.length) {
          // All heroes selected, confirm team
          this.listeners.get('message')?.forEach(listener => {
            const confirmMessage = JSON.stringify({
              type: 'game:confirm_team',
              payload: {}
            });
            listener(confirmMessage);
          });
          return;
        }
        
        // Select current hero
        this.listeners.get('message')?.forEach(listener => {
          const selectMessage = JSON.stringify({
            type: 'game:select_hero',
            payload: { heroId: heroes[index] }
          });
          listener(selectMessage);
        });
        
        // Schedule next hero selection
        setTimeout(() => selectHero(index + 1), 1000 + Math.random() * 1000);
      };
      
      // Start selecting heroes
      selectHero(0);
      
    }, 1000);
  }

  private calculateBestMove(botTeam: HeroInstance[], opponentTeam: HeroInstance[]): TurnActionPayload | null {
    // Filter to get only alive heroes
    const aliveHeroes = botTeam.filter(hero => hero.isAlive);
    const aliveOpponents = opponentTeam.filter(hero => hero.isAlive);
    
    if (aliveHeroes.length === 0 || aliveOpponents.length === 0) {
      return null;
    }
    
    // Get a random hero that can act
    const actingHero = this.getRandomActor(aliveHeroes);
    if (!actingHero) return null;
    
    // Get hero data
    const heroData = getHeroById(actingHero.heroId);
    if (!heroData) return null;
    
    // Get usable skills
    const usableSkills = this.getUsableSkills(actingHero, heroData);
    if (usableSkills.length === 0) return null;
    
    // Determine the best skill to use based on difficulty
    const { skill, targets } = this.chooseBestSkillAndTargets(
      usableSkills, 
      actingHero, 
      heroData, 
      aliveHeroes, 
      aliveOpponents
    );
    
    if (!skill || targets.length === 0) return null;
    
    // Return the action
    return {
      heroId: actingHero.heroId,
      skillId: skill.id,
      targetId: targets[0].heroId
    };
  }

  private getRandomActor(aliveHeroes: HeroInstance[]): HeroInstance | null {
    if (aliveHeroes.length === 0) return null;
    
    // Filter heroes that have enough energy for at least one skill
    const heroesWithEnergy = aliveHeroes.filter(hero => {
      const heroData = getHeroById(hero.heroId);
      if (!heroData) return false;
      
      // Check if hero has at least one skill they can use
      return heroData.skills.some(skill => {
        const cooldown = hero.skillCooldowns[skill.id] || 0;
        return skill.energyCost <= hero.currentEp && cooldown === 0;
      });
    });
    
    if (heroesWithEnergy.length === 0) return null;
    
    // Pick one randomly
    return heroesWithEnergy[Math.floor(Math.random() * heroesWithEnergy.length)];
  }

  private getUsableSkills(hero: HeroInstance, heroData: Hero): Skill[] {
    return heroData.skills.filter(skill => {
      const cooldown = hero.skillCooldowns[skill.id] || 0;
      return skill.energyCost <= hero.currentEp && cooldown === 0;
    });
  }

  private chooseBestSkillAndTargets(
    usableSkills: Skill[],
    actingHero: HeroInstance,
    heroData: Hero,
    allyTeam: HeroInstance[],
    enemyTeam: HeroInstance[]
  ): { skill: Skill | null, targets: HeroInstance[] } {
    // Different strategies based on difficulty
    switch (this.difficulty) {
      case 'master':
        return this.masterBotStrategy(usableSkills, actingHero, heroData, allyTeam, enemyTeam);
      case 'veteran':
        return this.veteranBotStrategy(usableSkills, actingHero, heroData, allyTeam, enemyTeam);
      case 'novice':
      default:
        return this.noviceBotStrategy(usableSkills, actingHero, heroData, allyTeam, enemyTeam);
    }
  }

  private noviceBotStrategy(
    usableSkills: Skill[],
    actingHero: HeroInstance,
    heroData: Hero,
    allyTeam: HeroInstance[],
    enemyTeam: HeroInstance[]
  ): { skill: Skill | null, targets: HeroInstance[] } {
    // Novice strategy: Pick a random skill and target
    if (usableSkills.length === 0) return { skill: null, targets: [] };
    
    const skill = usableSkills[Math.floor(Math.random() * usableSkills.length)];
    let targets: HeroInstance[] = [];
    
    // Determine valid targets
    if (skill.targeting === 'enemy' || skill.targeting === 'all_enemies') {
      targets = enemyTeam;
    } else if (skill.targeting === 'ally' || skill.targeting === 'all_allies') {
      targets = allyTeam;
    } else if (skill.targeting === 'self') {
      targets = [actingHero];
    } else if (skill.targeting === 'all') {
      targets = [...allyTeam, ...enemyTeam];
    }
    
    // If no valid targets, return null
    if (targets.length === 0) return { skill: null, targets: [] };
    
    // For single target skills, pick a random target
    if (skill.targeting === 'enemy' || skill.targeting === 'ally') {
      const randomTarget = targets[Math.floor(Math.random() * targets.length)];
      targets = [randomTarget];
    } else if (skill.targeting === 'self') {
      targets = [actingHero];
    }
    
    return { skill, targets };
  }

  private veteranBotStrategy(
    usableSkills: Skill[],
    actingHero: HeroInstance,
    heroData: Hero,
    allyTeam: HeroInstance[],
    enemyTeam: HeroInstance[]
  ): { skill: Skill | null, targets: HeroInstance[] } {
    // Veteran strategy: Slightly smarter targeting
    if (usableSkills.length === 0) return { skill: null, targets: [] };
    
    // Prioritize healing skills when allies are low on health
    const healingSkills = usableSkills.filter(skill => skill.healing > 0);
    const damageSkills = usableSkills.filter(skill => skill.baseDamage > 0);
    const buffSkills = usableSkills.filter(skill => skill.applyBuff);
    const debuffSkills = usableSkills.filter(skill => skill.applyDebuff);
    
    // Check if any ally is below 40% health
    const lowHealthAllies = allyTeam.filter(ally => (ally.currentHp / ally.maxHp) < 0.4);
    
    let skill: Skill | null = null;
    let targets: HeroInstance[] = [];
    
    // If there are allies with low health and we have healing skills, use them
    if (lowHealthAllies.length > 0 && healingSkills.length > 0) {
      // Get the most effective healing skill
      skill = healingSkills.sort((a, b) => b.healing - a.healing)[0];
      
      // Target the ally with the lowest health percentage
      const lowestHealthAlly = lowHealthAllies.sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp))[0];
      
      if (skill.targeting === 'ally') {
        targets = [lowestHealthAlly];
      } else if (skill.targeting === 'all_allies') {
        targets = allyTeam;
      } else if (skill.targeting === 'self' && actingHero.heroId === lowestHealthAlly.heroId) {
        targets = [actingHero];
      }
    }
    // If we have strong damage skills, target enemies
    else if (damageSkills.length > 0) {
      // Prefer AoE skills if there are multiple enemies
      const aoeSkills = damageSkills.filter(skill => skill.isAoe);
      
      if (enemyTeam.length > 1 && aoeSkills.length > 0) {
        skill = aoeSkills.sort((a, b) => b.baseDamage - a.baseDamage)[0];
        targets = enemyTeam;
      } else {
        // Otherwise, use the highest damage single-target skill
        skill = damageSkills.sort((a, b) => b.baseDamage - a.baseDamage)[0];
        
        // Target the enemy with the lowest health
        const lowestHealthEnemy = enemyTeam.sort((a, b) => a.currentHp - b.currentHp)[0];
        targets = [lowestHealthEnemy];
      }
    }
    // If we have buff skills, use them when not at full health
    else if (buffSkills.length > 0 && actingHero.currentHp < actingHero.maxHp * 0.8) {
      skill = buffSkills[0];
      
      if (skill.targeting === 'self') {
        targets = [actingHero];
      } else if (skill.targeting === 'all_allies') {
        targets = allyTeam;
      } else if (skill.targeting === 'ally') {
        // Target the ally with the highest damage output
        const tankHeroes = allyTeam.filter(ally => {
          const hero = getHeroById(ally.heroId);
          return hero && hero.class === 'Tank';
        });
        
        const damageHeroes = allyTeam.filter(ally => {
          const hero = getHeroById(ally.heroId);
          return hero && (hero.class === 'Blaster' || hero.class === 'Speedster');
        });
        
        // Prefer damage dealers, then tanks, then anyone else
        targets = damageHeroes.length > 0 ? [damageHeroes[0]] : 
                 tankHeroes.length > 0 ? [tankHeroes[0]] : 
                 [allyTeam[0]];
      }
    }
    // If we have debuff skills, use them on enemies
    else if (debuffSkills.length > 0) {
      skill = debuffSkills[0];
      
      if (skill.targeting === 'enemy') {
        // Target the enemy with the highest health
        const highestHealthEnemy = enemyTeam.sort((a, b) => b.currentHp - a.currentHp)[0];
        targets = [highestHealthEnemy];
      } else if (skill.targeting === 'all_enemies') {
        targets = enemyTeam;
      }
    }
    // Fallback to any available skill
    else if (usableSkills.length > 0) {
      return this.noviceBotStrategy(usableSkills, actingHero, heroData, allyTeam, enemyTeam);
    }
    
    if (!skill || targets.length === 0) {
      return { skill: null, targets: [] };
    }
    
    return { skill, targets };
  }

  private masterBotStrategy(
    usableSkills: Skill[],
    actingHero: HeroInstance,
    heroData: Hero,
    allyTeam: HeroInstance[],
    enemyTeam: HeroInstance[]
  ): { skill: Skill | null, targets: HeroInstance[] } {
    // Master strategy: Advanced targeting and lookahead
    if (usableSkills.length === 0) return { skill: null, targets: [] };
    
    // Group skills by type
    const healingSkills = usableSkills.filter(skill => skill.healing > 0);
    const damageSkills = usableSkills.filter(skill => skill.baseDamage > 0);
    const buffSkills = usableSkills.filter(skill => skill.applyBuff);
    const debuffSkills = usableSkills.filter(skill => skill.applyDebuff);
    
    let skill: Skill | null = null;
    let targets: HeroInstance[] = [];
    
    // Analyze team status
    const allyHealthPercentages = allyTeam.map(ally => ally.currentHp / ally.maxHp);
    const enemyHealthPercentages = enemyTeam.map(enemy => enemy.currentHp / enemy.maxHp);
    
    const avgAllyHealth = allyHealthPercentages.reduce((sum, hp) => sum + hp, 0) / allyHealthPercentages.length;
    const avgEnemyHealth = enemyHealthPercentages.reduce((sum, hp) => sum + hp, 0) / enemyHealthPercentages.length;
    
    // Critical healing situation
    const criticalAllies = allyTeam.filter(ally => (ally.currentHp / ally.maxHp) < 0.3);
    
    // Calculate the threat level of enemies
    const enemyThreats = enemyTeam.map(enemy => {
      const enemyData = getHeroById(enemy.heroId);
      if (!enemyData) return { heroId: enemy.heroId, threat: 0 };
      
      // Higher threat for enemies with high damage potential and current EP
      const damageSkills = enemyData.skills.filter(skill => skill.baseDamage > 0);
      const maxPotentialDamage = damageSkills.reduce((max, skill) => {
        if (skill.energyCost <= enemy.currentEp) {
          return Math.max(max, skill.baseDamage);
        }
        return max;
      }, 0);
      
      // Also consider health - lower health means they're easier to eliminate
      const healthPercentage = enemy.currentHp / enemy.maxHp;
      
      // Higher threat score if they have low health (can be eliminated)
      // or if they have high potential damage output
      let threat = maxPotentialDamage * (1 + (1 - healthPercentage));
      
      // Adjust based on class
      const enemyClass = enemyData.class;
      if (enemyClass === 'Blaster') threat *= 1.3; // Blasters are more threatening
      if (enemyClass === 'Support') threat *= 1.2; // Supports keep enemies alive
      
      return { heroId: enemy.heroId, threat };
    }).sort((a, b) => b.threat - a.threat);
    
    // Decision tree based on game state
    if (criticalAllies.length > 0 && healingSkills.length > 0) {
      // Critical healing needed
      skill = healingSkills.sort((a, b) => b.healing - a.healing)[0];
      
      if (skill.targeting === 'ally') {
        targets = [criticalAllies[0]];
      } else if (skill.targeting === 'all_allies') {
        targets = allyTeam;
      } else if (skill.targeting === 'self' && actingHero.currentHp / actingHero.maxHp < 0.3) {
        targets = [actingHero];
      }
    } 
    else if (avgAllyHealth < 0.5 && avgEnemyHealth < 0.5) {
      // Both teams are weak, focus on eliminating enemies
      if (damageSkills.length > 0) {
        // Find the enemy most likely to be eliminated
        const vulnerableEnemies = enemyTeam.filter(enemy => enemy.currentHp <= Math.max(...damageSkills.map(s => s.baseDamage)));
        
        if (vulnerableEnemies.length > 0) {
          // Target the most threatening vulnerable enemy
          const targetEnemy = vulnerableEnemies.sort((a, b) => {
            const threatA = enemyThreats.find(t => t.heroId === a.heroId)?.threat || 0;
            const threatB = enemyThreats.find(t => t.heroId === b.heroId)?.threat || 0;
            return threatB - threatA;
          })[0];
          
          // Find the skill that can eliminate this enemy
          const lethalSkills = damageSkills.filter(s => s.baseDamage >= targetEnemy.currentHp);
          skill = lethalSkills.length > 0 ? 
                  lethalSkills.sort((a, b) => a.energyCost - b.energyCost)[0] : // Use the most energy-efficient
                  damageSkills.sort((a, b) => b.baseDamage - a.baseDamage)[0]; // Or highest damage
          
          targets = [targetEnemy];
        } else {
          // Target the most threatening enemy
          const targetEnemy = enemyTeam.find(e => e.heroId === enemyThreats[0].heroId) || enemyTeam[0];
          
          // Use the highest damage skill
          skill = damageSkills.sort((a, b) => b.baseDamage - a.baseDamage)[0];
          targets = [targetEnemy];
        }
      }
    }
    else if (avgAllyHealth > 0.7 && buffSkills.length > 0) {
      // Team is healthy, apply buffs
      skill = buffSkills.sort((a, b) => {
        // Prefer shields during early game, strength buffs during late game
        const aValue = a.applyBuff?.type === 'shield' ? 2 : 1;
        const bValue = b.applyBuff?.type === 'shield' ? 2 : 1;
        return bValue - aValue;
      })[0];
      
      if (skill.targeting === 'self') {
        targets = [actingHero];
      } else if (skill.targeting === 'all_allies') {
        targets = allyTeam;
      } else if (skill.targeting === 'ally') {
        // Target the highest value ally
        const blasters = allyTeam.filter(ally => {
          const hero = getHeroById(ally.heroId);
          return hero && hero.class === 'Blaster';
        });
        
        const speedsters = allyTeam.filter(ally => {
          const hero = getHeroById(ally.heroId);
          return hero && hero.class === 'Speedster';
        });
        
        const tanks = allyTeam.filter(ally => {
          const hero = getHeroById(ally.heroId);
          return hero && hero.class === 'Tank';
        });
        
        // Prefer offensive classes for buffs
        targets = blasters.length > 0 ? [blasters[0]] :
                  speedsters.length > 0 ? [speedsters[0]] :
                  tanks.length > 0 ? [tanks[0]] : [allyTeam[0]];
      }
    }
    else if (debuffSkills.length > 0 && enemyTeam.length > 0) {
      // Apply debuffs to the most threatening enemies
      skill = debuffSkills.sort((a, b) => {
        // Prefer stuns over other debuffs
        const aValue = a.applyDebuff?.type === 'stun' ? 3 : 
                      a.applyDebuff?.type === 'weaken' ? 2 : 1;
        const bValue = b.applyDebuff?.type === 'stun' ? 3 : 
                      b.applyDebuff?.type === 'weaken' ? 2 : 1;
        return bValue - aValue;
      })[0];
      
      if (skill.targeting === 'enemy') {
        // Target the most threatening enemy
        const targetEnemy = enemyTeam.find(e => e.heroId === enemyThreats[0].heroId) || enemyTeam[0];
        targets = [targetEnemy];
      } else if (skill.targeting === 'all_enemies') {
        targets = enemyTeam;
      }
    }
    else {
      // Default to damaging the most threatening enemy
      if (damageSkills.length > 0) {
        // Prefer AoE if multiple enemies
        const aoeSkills = damageSkills.filter(skill => skill.isAoe);
        
        if (enemyTeam.length > 1 && aoeSkills.length > 0) {
          skill = aoeSkills.sort((a, b) => b.baseDamage - a.baseDamage)[0];
          targets = enemyTeam;
        } else {
          // Use highest damage single-target skill
          skill = damageSkills.sort((a, b) => b.baseDamage - a.baseDamage)[0];
          
          // Target most threatening enemy
          const targetEnemy = enemyTeam.find(e => e.heroId === enemyThreats[0].heroId) || enemyTeam[0];
          targets = [targetEnemy];
        }
      }
    }
    
    // If we couldn't find a good strategy, fall back to veteran strategy
    if (!skill || targets.length === 0) {
      return this.veteranBotStrategy(usableSkills, actingHero, heroData, allyTeam, enemyTeam);
    }
    
    return { skill, targets };
  }

  private selectBotHeroes(): string[] {
    // Select heroes based on bot difficulty
    const allHeroes = [
      "ironman", "captain-america", "hulk", "black-widow", "thor",
      "spider-man", "doctor-strange", "scarlet-witch", "hawkeye", "ant-man",
      "falcon", "vision", "winter-soldier", "rocket-raccoon", "groot"
    ];
    
    // Different strategies for different difficulties
    switch (this.difficulty) {
      case 'master':
        // Create a balanced team
        return [
          "captain-america",  // Tank
          "ironman",          // Blaster
          "doctor-strange",   // Controller
          "black-widow",      // Speedster
          "groot"             // Tank/Support
        ];
      
      case 'veteran':
        // Pick a semi-balanced team
        return [
          "hulk",           // Tank
          "thor",           // Blaster
          "scarlet-witch",  // Controller  
          "falcon",         // Speedster
          "rocket-raccoon"  // Blaster
        ];
      
      case 'novice':
      default:
        // Randomly select 5 heroes
        const shuffled = [...allHeroes].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 5);
    }
  }

  private getResponseDelay(): number {
    // Simulate thinking time based on difficulty
    switch (this.difficulty) {
      case 'master':
        return 800 + Math.random() * 1200; // 0.8-2 seconds
      case 'veteran':
        return 500 + Math.random() * 1000; // 0.5-1.5 seconds
      case 'novice':
      default:
        return 300 + Math.random() * 700;  // 0.3-1 second
    }
  }
}

export function generateBotPlayer(difficulty: 'novice' | 'veteran' | 'master'): Player {
  const botId = Math.floor(Math.random() * 100000);
  
  // Generate bot username based on difficulty
  const prefix = difficulty === 'master' ? 'MasterBot' : 
                 difficulty === 'veteran' ? 'VeteranBot' : 'NoviceBot';
  
  const username = `${prefix}-${botId}`;
  
  // Determine ELO rating based on difficulty
  const elo = difficulty === 'master' ? 1800 + Math.floor(Math.random() * 200) :
              difficulty === 'veteran' ? 1400 + Math.floor(Math.random() * 200) :
              1000 + Math.floor(Math.random() * 200);
  
  // Create mock WebSocket for the bot
  const socket = new BotWebSocket(botId, difficulty) as unknown as WebSocket;
  
  return {
    userId: botId,
    username,
    elo,
    socket,
    isBot: true,
    botDifficulty: difficulty
  };
}
