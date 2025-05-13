export interface Skill {
  id: number;
  name: string;
  description: string;
  energyCost: number;
  cooldown: number;
  baseDamage: number;
  healing: number;
  isAoe: boolean;
  isMultiTarget: boolean;
  applyDebuff?: {
    type: 'stun' | 'burn' | 'bleed' | 'slow' | 'weaken';
    duration: number;
    value?: number;
  };
  applyBuff?: {
    type: 'shield' | 'strengthen' | 'speed' | 'regen';
    duration: number;
    value?: number;
  };
  targeting: 'enemy' | 'ally' | 'self' | 'all_enemies' | 'all_allies' | 'all';
  narration: string;
}

export interface Hero {
  id: string;
  name: string;
  class: 'Tank' | 'Blaster' | 'Support' | 'Controller' | 'Speedster';
  archetype: string;
  maxHp: number;
  epMax: number;
  epRegen: number;
  baseSpeed: number;
  skills: Skill[];
  description: string;
}

// 15+ Marvel heroes with different classes, stats, and abilities
export const heroes: Hero[] = [
  {
    id: "ironman",
    name: "Iron Man",
    class: "Blaster",
    archetype: "Tech Genius",
    maxHp: 350,
    epMax: 10,
    epRegen: 4,
    baseSpeed: 75,
    skills: [
      {
        id: 0,
        name: "Repulsor Blast",
        description: "Fires a quick energy blast at a single enemy",
        energyCost: 3,
        cooldown: 0,
        baseDamage: 75,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        targeting: "enemy",
        narration: "Iron Man raises his palm and fires a concentrated energy blast!"
      },
      {
        id: 1,
        name: "Unibeam",
        description: "Charges and fires a powerful beam from chest reactor",
        energyCost: 5,
        cooldown: 2,
        baseDamage: 120,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        targeting: "enemy",
        narration: "Iron Man's chest reactor glows intensely before firing a devastating unibeam!"
      },
      {
        id: 2,
        name: "Missile Barrage",
        description: "Launches a swarm of small missiles at all enemies",
        energyCost: 7,
        cooldown: 3,
        baseDamage: 95,
        healing: 0,
        isAoe: true,
        isMultiTarget: false,
        targeting: "all_enemies",
        narration: "Shoulder panels open as Iron Man unleashes a barrage of guided missiles!"
      },
      {
        id: 3,
        name: "Nanite Repair",
        description: "Activates nanites to repair suit damage",
        energyCost: 4,
        cooldown: 3,
        baseDamage: 0,
        healing: 80,
        isAoe: false,
        isMultiTarget: false,
        targeting: "self",
        narration: "Iron Man's armor shifts as nanobots quickly repair damaged sections!"
      }
    ],
    description: "Genius inventor Tony Stark uses his high-tech suit of armor to battle threats worldwide."
  },
  {
    id: "captain-america",
    name: "Captain America",
    class: "Tank",
    archetype: "Leader",
    maxHp: 450,
    epMax: 8,
    epRegen: 3,
    baseSpeed: 65,
    skills: [
      {
        id: 0,
        name: "Shield Bash",
        description: "Slams shield into enemy for moderate damage",
        energyCost: 2,
        cooldown: 0,
        baseDamage: 60,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        targeting: "enemy",
        narration: "Captain America rushes forward and bashes his shield into the enemy!"
      },
      {
        id: 1,
        name: "Shield Throw",
        description: "Throws shield to hit multiple enemies",
        energyCost: 4,
        cooldown: 2,
        baseDamage: 85,
        healing: 0,
        isAoe: false,
        isMultiTarget: true,
        targeting: "enemy",
        narration: "Captain America's shield ricochets between enemies with incredible precision!"
      },
      {
        id: 2,
        name: "Inspire",
        description: "Boosts team attack and defense",
        energyCost: 3,
        cooldown: 3,
        baseDamage: 0,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        applyBuff: {
          type: "strengthen",
          duration: 2,
          value: 15
        },
        targeting: "all_allies",
        narration: "With unwavering resolve, Captain America rallies his team with inspirational words!"
      },
      {
        id: 3,
        name: "Indomitable Will",
        description: "Temporarily boosts defense and recovers health",
        energyCost: 5,
        cooldown: 4,
        baseDamage: 0,
        healing: 100,
        isAoe: false,
        isMultiTarget: false,
        applyBuff: {
          type: "shield",
          duration: 2,
          value: 25
        },
        targeting: "self",
        narration: "Captain America stands firm, his unwavering will strengthening his resolve!"
      }
    ],
    description: "Super-soldier Steve Rogers fights for freedom with enhanced strength, agility and his vibranium shield."
  },
  {
    id: "hulk",
    name: "Hulk",
    class: "Tank",
    archetype: "Berserker",
    maxHp: 500,
    epMax: 12,
    epRegen: 2,
    baseSpeed: 50,
    skills: [
      {
        id: 0,
        name: "Smash",
        description: "Hulk smashes a single enemy",
        energyCost: 3,
        cooldown: 0,
        baseDamage: 90,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        targeting: "enemy",
        narration: "HULK SMASH! The green giant brings down his fists with earth-shattering force!"
      },
      {
        id: 1,
        name: "Thunderclap",
        description: "Creates shockwave hitting all enemies",
        energyCost: 6,
        cooldown: 2,
        baseDamage: 110,
        healing: 0,
        isAoe: true,
        isMultiTarget: false,
        applyDebuff: {
          type: "stun",
          duration: 1
        },
        targeting: "all_enemies",
        narration: "Hulk claps his hands together creating a devastating shockwave!"
      },
      {
        id: 2,
        name: "Rage",
        description: "Anger increases strength but reduces defense",
        energyCost: 4,
        cooldown: 3,
        baseDamage: 0,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        applyBuff: {
          type: "strengthen",
          duration: 3,
          value: 30
        },
        targeting: "self",
        narration: "Hulk's rage builds, his muscles bulging as he grows even stronger!"
      },
      {
        id: 3,
        name: "Unstoppable",
        description: "Recovers from damage and becomes temporarily invulnerable",
        energyCost: 8,
        cooldown: 4,
        baseDamage: 0,
        healing: 150,
        isAoe: false,
        isMultiTarget: false,
        applyBuff: {
          type: "shield",
          duration: 1,
          value: 100
        },
        targeting: "self",
        narration: "Hulk roars defiantly as his incredible regeneration kicks in!"
      }
    ],
    description: "Dr. Bruce Banner transforms into the Hulk when angered, gaining incredible strength and durability."
  },
  {
    id: "black-widow",
    name: "Black Widow",
    class: "Speedster",
    archetype: "Spy",
    maxHp: 300,
    epMax: 8,
    epRegen: 4,
    baseSpeed: 90,
    skills: [
      {
        id: 0,
        name: "Widow's Bite",
        description: "Electrifies enemy with wrist gauntlets",
        energyCost: 2,
        cooldown: 0,
        baseDamage: 65,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        applyDebuff: {
          type: "stun",
          duration: 1
        },
        targeting: "enemy",
        narration: "Black Widow delivers a swift strike with her electrified gauntlets!"
      },
      {
        id: 1,
        name: "Shadow Strike",
        description: "Exploits enemy weakness for critical damage",
        energyCost: 5,
        cooldown: 2,
        baseDamage: 120,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        targeting: "enemy",
        narration: "Moving like a shadow, Black Widow strikes at a vital point!"
      },
      {
        id: 2,
        name: "Espionage",
        description: "Reveals enemy weaknesses, increasing team damage",
        energyCost: 3,
        cooldown: 3,
        baseDamage: 0,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        applyDebuff: {
          type: "weaken",
          duration: 2,
          value: 20
        },
        targeting: "enemy",
        narration: "Black Widow analyzes the enemy, identifying and exposing critical weaknesses!"
      },
      {
        id: 3,
        name: "Acrobatic Evasion",
        description: "Increases dodge chance and counterattack probability",
        energyCost: 4,
        cooldown: 3,
        baseDamage: 0,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        applyBuff: {
          type: "speed",
          duration: 2,
          value: 25
        },
        targeting: "self",
        narration: "Black Widow flips into a defensive stance, her movements becoming nearly impossible to track!"
      }
    ],
    description: "Elite spy and assassin Natasha Romanoff uses her training and gadgets to outmaneuver opponents."
  },
  {
    id: "thor",
    name: "Thor",
    class: "Blaster",
    archetype: "Asgardian",
    maxHp: 400,
    epMax: 10,
    epRegen: 4,
    baseSpeed: 70,
    skills: [
      {
        id: 0,
        name: "Mjolnir Strike",
        description: "Hammers enemy with Mjolnir",
        energyCost: 3,
        cooldown: 0,
        baseDamage: 80,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        targeting: "enemy",
        narration: "Thor swings Mjolnir with godly strength, crushing his opponent!"
      },
      {
        id: 1,
        name: "Lightning Storm",
        description: "Calls down lightning to strike all enemies",
        energyCost: 6,
        cooldown: 3,
        baseDamage: 150,
        healing: 0,
        isAoe: true,
        isMultiTarget: false,
        targeting: "all_enemies",
        narration: "Thunder rumbles as Thor raises Mjolnir to the sky, calling down a devastating lightning storm!"
      },
      {
        id: 2,
        name: "God of Thunder",
        description: "Channels lightning to empower attacks",
        energyCost: 4,
        cooldown: 3,
        baseDamage: 0,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        applyBuff: {
          type: "strengthen",
          duration: 3,
          value: 25
        },
        targeting: "self",
        narration: "Lightning courses through Thor's body as he embraces his power as the God of Thunder!"
      },
      {
        id: 3,
        name: "Asgardian Resilience",
        description: "Channels Asgardian power to recover strength",
        energyCost: 5,
        cooldown: 4,
        baseDamage: 0,
        healing: 120,
        isAoe: false,
        isMultiTarget: false,
        targeting: "self",
        narration: "Thor calls upon his Asgardian heritage, his wounds healing with divine energy!"
      }
    ],
    description: "Asgardian god of thunder Thor wields the enchanted hammer Mjolnir to command lightning and storms."
  },
  {
    id: "spider-man",
    name: "Spider-Man",
    class: "Speedster",
    archetype: "Agile Hero",
    maxHp: 320,
    epMax: 9,
    epRegen: 3,
    baseSpeed: 95,
    skills: [
      {
        id: 0,
        name: "Web Shot",
        description: "Immobilizes enemy with webbing",
        energyCost: 2,
        cooldown: 0,
        baseDamage: 55,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        applyDebuff: {
          type: "slow",
          duration: 2,
          value: 30
        },
        targeting: "enemy",
        narration: "Spider-Man fires a precise web shot, tangling his opponent's movements!"
      },
      {
        id: 1,
        name: "Spider Strike",
        description: "Acrobatic combination of rapid attacks",
        energyCost: 4,
        cooldown: 2,
        baseDamage: 100,
        healing: 0,
        isAoe: false,
        isMultiTarget: true,
        targeting: "enemy",
        narration: "With incredible agility, Spider-Man delivers a lightning-fast series of strikes!"
      },
      {
        id: 2,
        name: "Spider Sense",
        description: "Enhanced reflexes improve evasion",
        energyCost: 3,
        cooldown: 3,
        baseDamage: 0,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        applyBuff: {
          type: "speed",
          duration: 2,
          value: 30
        },
        targeting: "self",
        narration: "Spider-Man's senses sharpen dramatically, allowing him to anticipate every attack!"
      },
      {
        id: 3,
        name: "Web Swing Kick",
        description: "Swings in for a powerful kick to multiple enemies",
        energyCost: 5,
        cooldown: 3,
        baseDamage: 85,
        healing: 0,
        isAoe: false,
        isMultiTarget: true,
        targeting: "all_enemies",
        narration: "Spider-Man swings across the battlefield, delivering a devastating aerial assault!"
      }
    ],
    description: "Peter Parker uses his spider powers and scientific genius to protect the innocent as Spider-Man."
  },
  {
    id: "doctor-strange",
    name: "Doctor Strange",
    class: "Controller",
    archetype: "Mystic Master",
    maxHp: 350,
    epMax: 12,
    epRegen: 5,
    baseSpeed: 65,
    skills: [
      {
        id: 0,
        name: "Eldritch Bolt",
        description: "Mystical energy attack",
        energyCost: 3,
        cooldown: 0,
        baseDamage: 70,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        targeting: "enemy",
        narration: "Doctor Strange conjures glowing sigils, releasing a bolt of eldritch energy!"
      },
      {
        id: 1,
        name: "Mirror Dimension",
        description: "Traps enemy in alternate dimension",
        energyCost: 5,
        cooldown: 3,
        baseDamage: 60,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        applyDebuff: {
          type: "stun",
          duration: 2
        },
        targeting: "enemy",
        narration: "Reality warps as Doctor Strange opens a gateway to the Mirror Dimension!"
      },
      {
        id: 2,
        name: "Time Manipulation",
        description: "Resets cooldowns for allies",
        energyCost: 7,
        cooldown: 4,
        baseDamage: 0,
        healing: 50,
        isAoe: false,
        isMultiTarget: false,
        targeting: "all_allies",
        narration: "Doctor Strange manipulates the flow of time, green energy swirling from the Eye of Agamotto!"
      },
      {
        id: 3,
        name: "Seven Rings of Raggadorr",
        description: "Creates powerful shields around all allies",
        energyCost: 6,
        cooldown: 3,
        baseDamage: 0,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        applyBuff: {
          type: "shield",
          duration: 2,
          value: 30
        },
        targeting: "all_allies",
        narration: "Mystical rings of golden energy encircle each ally as Doctor Strange invokes ancient protection spells!"
      }
    ],
    description: "As Earth's Sorcerer Supreme, Doctor Stephen Strange defends our dimension from mystical threats."
  },
  {
    id: "scarlet-witch",
    name: "Scarlet Witch",
    class: "Controller",
    archetype: "Chaos Magic User",
    maxHp: 320,
    epMax: 11,
    epRegen: 4,
    baseSpeed: 70,
    skills: [
      {
        id: 0,
        name: "Chaos Bolt",
        description: "Unpredictable magical attack",
        energyCost: 3,
        cooldown: 0,
        baseDamage: 75,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        targeting: "enemy",
        narration: "Scarlet energy crackles around Wanda's fingers before launching toward her target!"
      },
      {
        id: 1,
        name: "Hex Field",
        description: "Creates field of probability-altering energy",
        energyCost: 5,
        cooldown: 3,
        baseDamage: 60,
        healing: 0,
        isAoe: true,
        isMultiTarget: false,
        applyDebuff: {
          type: "weaken",
          duration: 2,
          value: 25
        },
        targeting: "all_enemies",
        narration: "Reality distorts as Scarlet Witch spreads her hands, scarlet energy washing over her enemies!"
      },
      {
        id: 2,
        name: "Mind Warp",
        description: "Controls enemy to attack their allies",
        energyCost: 6,
        cooldown: 3,
        baseDamage: 0,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        applyDebuff: {
          type: "stun",
          duration: 1
        },
        targeting: "enemy",
        narration: "Scarlet Witch's eyes glow red as she reaches into her enemy's mind, bending their will to hers!"
      },
      {
        id: 3,
        name: "Chaos Shield",
        description: "Probability manipulation protects allies",
        energyCost: 4,
        cooldown: 3,
        baseDamage: 0,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        applyBuff: {
          type: "shield",
          duration: 2,
          value: 25
        },
        targeting: "all_allies",
        narration: "Scarlet energy flows from Wanda's hands, creating a protective barrier that bends reality itself!"
      }
    ],
    description: "Wanda Maximoff manipulates chaos magic and probability, making her one of the most powerful Avengers."
  },
  {
    id: "hawkeye",
    name: "Hawkeye",
    class: "Blaster",
    archetype: "Marksman",
    maxHp: 300,
    epMax: 8,
    epRegen: 3,
    baseSpeed: 75,
    skills: [
      {
        id: 0,
        name: "Precision Shot",
        description: "Carefully aimed arrow for high accuracy",
        energyCost: 2,
        cooldown: 0,
        baseDamage: 70,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        targeting: "enemy",
        narration: "With perfect form, Hawkeye draws and releases an arrow that finds its mark!"
      },
      {
        id: 1,
        name: "Explosive Arrow",
        description: "Arrow with explosive tip damages area",
        energyCost: 5,
        cooldown: 2,
        baseDamage: 90,
        healing: 0,
        isAoe: true,
        isMultiTarget: false,
        targeting: "all_enemies",
        narration: "Hawkeye's specialized arrow detonates on impact, sending enemies flying!"
      },
      {
        id: 2,
        name: "Trick Arrows",
        description: "Multiple arrows with various effects",
        energyCost: 4,
        cooldown: 3,
        baseDamage: 60,
        healing: 0,
        isAoe: false,
        isMultiTarget: true,
        applyDebuff: {
          type: "slow",
          duration: 2,
          value: 20
        },
        targeting: "enemy",
        narration: "A quick-fire sequence of specialized arrows each finds their mark with uncanny precision!"
      },
      {
        id: 3,
        name: "Hawkeye's Focus",
        description: "Enhanced concentration improves critical hit chance",
        energyCost: 3,
        cooldown: 3,
        baseDamage: 0,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        applyBuff: {
          type: "strengthen",
          duration: 2,
          value: 30
        },
        targeting: "self",
        narration: "Hawkeye takes a deep breath, his focus narrowing to pinpoint precision!"
      }
    ],
    description: "Clint Barton never misses with his bow and arsenal of specialized arrows."
  },
  {
    id: "ant-man",
    name: "Ant-Man",
    class: "Speedster",
    archetype: "Size-Shifter",
    maxHp: 320,
    epMax: 9,
    epRegen: 4,
    baseSpeed: 80,
    skills: [
      {
        id: 0,
        name: "Shrink Strike",
        description: "Shrinks to avoid defenses then strikes",
        energyCost: 2,
        cooldown: 0,
        baseDamage: 60,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        targeting: "enemy",
        narration: "Ant-Man shrinks down to microscopic size before delivering a powerful blow from within!"
      },
      {
        id: 1,
        name: "Giant Slam",
        description: "Grows to giant size for massive attack",
        energyCost: 5,
        cooldown: 3,
        baseDamage: 110,
        healing: 0,
        isAoe: true,
        isMultiTarget: false,
        targeting: "all_enemies",
        narration: "Suddenly growing to immense size, Ant-Man creates a shockwave as he slams the ground!"
      },
      {
        id: 2,
        name: "Ant Command",
        description: "Orders swarm of ants to distract enemies",
        energyCost: 3,
        cooldown: 2,
        baseDamage: 40,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        applyDebuff: {
          type: "slow",
          duration: 2,
          value: 25
        },
        targeting: "all_enemies",
        narration: "At Ant-Man's command, thousands of ants swarm across the battlefield causing confusion!"
      },
      {
        id: 3,
        name: "Quantum Dodge",
        description: "Uses Pym particles to phase and avoid attacks",
        energyCost: 4,
        cooldown: 3,
        baseDamage: 0,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        applyBuff: {
          type: "speed",
          duration: 2,
          value: 35
        },
        targeting: "self",
        narration: "Ant-Man's form blurs as he rapidly shifts between sizes, becoming nearly impossible to hit!"
      }
    ],
    description: "Scott Lang uses Pym particles to change size, increasing strength or becoming nearly invisible."
  },
  {
    id: "falcon",
    name: "Falcon",
    class: "Speedster",
    archetype: "Aerial Tactician",
    maxHp: 310,
    epMax: 8,
    epRegen: 4,
    baseSpeed: 85,
    skills: [
      {
        id: 0,
        name: "Wing Strike",
        description: "Swoops in for a quick attack",
        energyCost: 2,
        cooldown: 0,
        baseDamage: 65,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        targeting: "enemy",
        narration: "Falcon dives from above, his wings' cutting edge slicing through the enemy's defenses!"
      },
      {
        id: 1,
        name: "Aerial Bombardment",
        description: "Drops explosives on enemies from above",
        energyCost: 5,
        cooldown: 3,
        baseDamage: 95,
        healing: 0,
        isAoe: true,
        isMultiTarget: false,
        targeting: "all_enemies",
        narration: "Soaring overhead, Falcon releases a barrage of explosive projectiles on enemies below!"
      },
      {
        id: 2,
        name: "Reconnaissance",
        description: "Scans battlefield providing tactical advantage",
        energyCost: 3,
        cooldown: 3,
        baseDamage: 0,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        applyBuff: {
          type: "strengthen",
          duration: 2,
          value: 20
        },
        targeting: "all_allies",
        narration: "Falcon climbs high, his advanced goggles scanning the battlefield for tactical advantages!"
      },
      {
        id: 3,
        name: "Evasive Maneuvers",
        description: "Uses flight capabilities to avoid attacks",
        energyCost: 4,
        cooldown: 2,
        baseDamage: 0,
        healing: 20,
        isAoe: false,
        isMultiTarget: false,
        applyBuff: {
          type: "speed",
          duration: 2,
          value: 25
        },
        targeting: "self",
        narration: "With incredible aerial agility, Falcon performs a series of complex maneuvers that are nearly impossible to track!"
      }
    ],
    description: "Sam Wilson uses his mechanical wings and combat training to soar above battlefields and provide air support."
  },
  {
    id: "vision",
    name: "Vision",
    class: "Controller",
    archetype: "Synthetic Being",
    maxHp: 380,
    epMax: 11,
    epRegen: 4,
    baseSpeed: 75,
    skills: [
      {
        id: 0,
        name: "Solar Beam",
        description: "Focuses energy from Mind Stone",
        energyCost: 3,
        cooldown: 0,
        baseDamage: 75,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        targeting: "enemy",
        narration: "The Mind Stone in Vision's forehead glows brightly as a beam of concentrated energy shoots forth!"
      },
      {
        id: 1,
        name: "Density Assault",
        description: "Increases density for powerful attack",
        energyCost: 4,
        cooldown: 2,
        baseDamage: 100,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        targeting: "enemy",
        narration: "Vision increases his molecular density to tremendous levels before delivering a devastating blow!"
      },
      {
        id: 2,
        name: "Phasing Strike",
        description: "Phases through defenses to attack",
        energyCost: 5,
        cooldown: 3,
        baseDamage: 110,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        targeting: "enemy",
        narration: "Vision becomes intangible, passing through solid matter before solidifying inside the enemy's defenses!"
      },
      {
        id: 3,
        name: "Synthetic Recovery",
        description: "Self-repairs damaged systems",
        energyCost: 6,
        cooldown: 3,
        baseDamage: 0,
        healing: 130,
        isAoe: false,
        isMultiTarget: false,
        targeting: "self",
        narration: "Vision's synthetic cells rapidly reorganize as he systematically repairs damage to his systems!"
      }
    ],
    description: "The synthetic being Vision combines the power of the Mind Stone with advanced vibranium technology."
  },
  {
    id: "winter-soldier",
    name: "Winter Soldier",
    class: "Blaster",
    archetype: "Super Soldier",
    maxHp: 370,
    epMax: 8,
    epRegen: 3,
    baseSpeed: 70,
    skills: [
      {
        id: 0,
        name: "Precision Fire",
        description: "Carefully aimed shot",
        energyCost: 2,
        cooldown: 0,
        baseDamage: 70,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        targeting: "enemy",
        narration: "Winter Soldier takes careful aim and fires a perfectly placed shot!"
      },
      {
        id: 1,
        name: "Metal Arm Strike",
        description: "Powerful melee attack with bionic arm",
        energyCost: 4,
        cooldown: 2,
        baseDamage: 95,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        targeting: "enemy",
        narration: "The Winter Soldier's metal arm whirs with mechanical power as he delivers a crushing blow!"
      },
      {
        id: 2,
        name: "Suppressive Fire",
        description: "Fires multiple shots to pin down enemies",
        energyCost: 5,
        cooldown: 3,
        baseDamage: 80,
        healing: 0,
        isAoe: true,
        isMultiTarget: false,
        applyDebuff: {
          type: "slow",
          duration: 2,
          value: 20
        },
        targeting: "all_enemies",
        narration: "A hail of bullets forces enemies to take cover as Winter Soldier provides suppressive fire!"
      },
      {
        id: 3,
        name: "Combat Readiness",
        description: "Enhanced focus improves combat performance",
        energyCost: 3,
        cooldown: 3,
        baseDamage: 0,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        applyBuff: {
          type: "strengthen",
          duration: 2,
          value: 25
        },
        targeting: "self",
        narration: "Winter Soldier's eyes narrow as his enhanced mind calculates every possible combat variable!"
      }
    ],
    description: "Former assassin Bucky Barnes combines enhanced physical abilities with expert marksmanship and a bionic arm."
  },
  {
    id: "rocket-raccoon",
    name: "Rocket Raccoon",
    class: "Blaster",
    archetype: "Weapons Expert",
    maxHp: 280,
    epMax: 9,
    epRegen: 4,
    baseSpeed: 80,
    skills: [
      {
        id: 0,
        name: "Plasma Pistol",
        description: "Quick shot from custom weapon",
        energyCost: 2,
        cooldown: 0,
        baseDamage: 65,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        targeting: "enemy",
        narration: "Rocket draws his custom plasma pistol with lightning speed and fires a sizzling bolt!"
      },
      {
        id: 1,
        name: "Heavy Artillery",
        description: "Oversized weapon deals massive damage",
        energyCost: 5,
        cooldown: 3,
        baseDamage: 120,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        targeting: "enemy",
        narration: "Grinning wickedly, Rocket hefts an impossibly large weapon and unleashes devastating firepower!"
      },
      {
        id: 2,
        name: "Cluster Bombs",
        description: "Scatters explosive devices across battlefield",
        energyCost: 6,
        cooldown: 3,
        baseDamage: 100,
        healing: 0,
        isAoe: true,
        isMultiTarget: false,
        targeting: "all_enemies",
        narration: "\"Fire in the hole!\" Rocket cackles as he tosses handfuls of miniature bombs that explode in brilliant flashes!"
      },
      {
        id: 3,
        name: "Combat Ingenuity",
        description: "Quick repairs and weapon modifications",
        energyCost: 4,
        cooldown: 3,
        baseDamage: 0,
        healing: 60,
        isAoe: false,
        isMultiTarget: false,
        applyBuff: {
          type: "strengthen",
          duration: 2,
          value: 20
        },
        targeting: "self",
        narration: "Rocket rapidly tinkers with his weaponry, making split-second modifications for maximum effectiveness!"
      }
    ],
    description: "Don't call him a raccoon! This brilliant technician and weapons expert packs serious firepower."
  },
  {
    id: "groot",
    name: "Groot",
    class: "Tank",
    archetype: "Flora Colossus",
    maxHp: 480,
    epMax: 10,
    epRegen: 3,
    baseSpeed: 50,
    skills: [
      {
        id: 0,
        name: "Branch Bash",
        description: "Extends limbs to strike enemy",
        energyCost: 2,
        cooldown: 0,
        baseDamage: 65,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        targeting: "enemy",
        narration: "\"I am Groot!\" His arm extends impossibly far, smashing into the enemy with wooden force!"
      },
      {
        id: 1,
        name: "Entangle",
        description: "Roots enemies in place",
        energyCost: 4,
        cooldown: 3,
        baseDamage: 50,
        healing: 0,
        isAoe: true,
        isMultiTarget: false,
        applyDebuff: {
          type: "slow",
          duration: 2,
          value: 40
        },
        targeting: "all_enemies",
        narration: "Groot's fingers extend into the ground, wooden tendrils erupting beneath enemies to entangle them!"
      },
      {
        id: 2,
        name: "Protective Shield",
        description: "Creates wooden barrier to protect allies",
        energyCost: 5,
        cooldown: 3,
        baseDamage: 0,
        healing: 0,
        isAoe: false,
        isMultiTarget: false,
        applyBuff: {
          type: "shield",
          duration: 2,
          value: 35
        },
        targeting: "all_allies",
        narration: "\"I... AM... GROOT!\" He forms his body into an expansive wooden shield, protecting his allies from harm!"
      },
      {
        id: 3,
        name: "Regenerative Growth",
        description: "Rapidly grows new wood to heal damage",
        energyCost: 6,
        cooldown: 3,
        baseDamage: 0,
        healing: 140,
        isAoe: false,
        isMultiTarget: false,
        targeting: "self",
        narration: "Splinters of old wood fall away as fresh growth rapidly replaces Groot's damaged parts!"
      }
    ],
    description: "The sentient tree Groot can control his growth, extending limbs or regenerating damage while protecting friends."
  }
];

export const getHeroById = (id: string): Hero | undefined => {
  return heroes.find(hero => hero.id === id);
};

export const getAllHeroes = (): Hero[] => {
  return heroes;
};

export const getHeroClasses = (): { name: string, description: string }[] => {
  return [
    { name: "Tank", description: "High HP, defensive skills" },
    { name: "Blaster", description: "High damage output" },
    { name: "Support", description: "Healing and buffs" },
    { name: "Controller", description: "Crowd control, debuffs" },
    { name: "Speedster", description: "Fast attacks, evasion" }
  ];
};
