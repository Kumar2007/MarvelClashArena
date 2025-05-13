import React from 'react';

interface HeroBattleCardProps {
  name: string;
  currentHp: number;
  maxHp: number;
  currentEp: number;
  maxEp: number;
  position: 'front' | 'back';
  isAlive: boolean;
  isEnemy?: boolean;
  effects?: {
    type: string;
    duration: number;
    value?: number;
  }[];
  onClick?: () => void;
}

const HeroBattleCard: React.FC<HeroBattleCardProps> = ({
  name,
  currentHp,
  maxHp,
  currentEp,
  maxEp,
  position,
  isAlive,
  isEnemy = false,
  effects = [],
  onClick
}) => {
  // Calculate health percentage
  const healthPercent = (currentHp / maxHp) * 100;
  
  return (
    <div 
      className={`flex justify-between items-center bg-[hsl(var(--terminal-bg))]/60 p-2 rounded 
      ${!isAlive ? 'opacity-50' : ''} 
      ${onClick ? 'cursor-pointer hover:bg-[hsl(var(--terminal-bg))]/80' : ''}`}
      onClick={isAlive && onClick ? onClick : undefined}
    >
      {!isEnemy && (
        <div className="flex-shrink-0 mr-2">
          <div className={`w-1 h-full ${isAlive ? 'bg-[hsl(var(--terminal-green))]' : 'bg-[hsl(var(--terminal-red))]'} rounded`}></div>
        </div>
      )}
      
      <div className="flex-grow">
        <div className="flex justify-between">
          <span className={`font-bold ${isEnemy ? 'text-[hsl(var(--terminal-red))]' : 'text-[hsl(var(--terminal-cyan))]'}`}>
            {name}
          </span>
          <span className="text-xs">
            EP: {currentEp}/{maxEp}
          </span>
        </div>
        
        <div className="w-full bg-[hsl(var(--terminal-bg))] h-1.5 rounded-full mt-1">
          <div 
            className="bg-[hsl(var(--terminal-red))] h-full rounded-full" 
            style={{ width: `${healthPercent}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-xs mt-0.5">
          <span>
            HP: {isEnemy && currentHp < maxHp ? '~' : ''}{currentHp}/{maxHp}
          </span>
          <span className={position === 'front' ? 'text-[hsl(var(--terminal-purple))]' : 'text-[hsl(var(--terminal-blue))]'}>
            {position === 'front' ? 'FRONT' : 'BACK'}
          </span>
        </div>
        
        {effects.length > 0 && (
          <div className="flex gap-1 mt-1">
            {effects.map((effect, index) => (
              <span 
                key={index}
                className={`text-xs px-1 rounded ${getEffectClass(effect.type)}`}
                title={`${effect.type} (${effect.duration} turns${effect.value ? `, ${effect.value}` : ''})`}
              >
                {getEffectShortName(effect.type)}
              </span>
            ))}
          </div>
        )}
      </div>
      
      {isEnemy && (
        <div className="flex-shrink-0 ml-2">
          <div className={`w-1 h-full ${isAlive ? 'bg-[hsl(var(--terminal-green))]' : 'bg-[hsl(var(--terminal-red))]'} rounded`}></div>
        </div>
      )}
    </div>
  );
};

// Helper functions for effect styling
function getEffectClass(type: string): string {
  switch (type) {
    case 'shield':
    case 'strengthen':
    case 'speed':
    case 'regen':
      return 'bg-[hsl(var(--terminal-blue))]/20 text-[hsl(var(--terminal-blue))]';
    case 'stun':
    case 'burn':
    case 'bleed':
    case 'slow':
    case 'weaken':
      return 'bg-[hsl(var(--terminal-red))]/20 text-[hsl(var(--terminal-red))]';
    default:
      return 'bg-[hsl(var(--terminal-text))]/20 text-[hsl(var(--terminal-text))]';
  }
}

function getEffectShortName(type: string): string {
  switch (type) {
    case 'shield': return 'SHD';
    case 'strengthen': return 'STR';
    case 'speed': return 'SPD';
    case 'regen': return 'REG';
    case 'stun': return 'STN';
    case 'burn': return 'BRN';
    case 'bleed': return 'BLD';
    case 'slow': return 'SLW';
    case 'weaken': return 'WKN';
    default: return type.substring(0, 3).toUpperCase();
  }
}

export default HeroBattleCard;
