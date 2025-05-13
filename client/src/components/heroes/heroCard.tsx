import React from 'react';
import { Card } from '@/components/ui/card';

interface HeroCardProps {
  id: string;
  name: string;
  archetype: string;
  heroClass: string;
  hp: number;
  epRegen: number;
  speed: number;
  skills: {
    name: string;
    energyCost: number;
    damage?: number;
    cooldown?: number;
    isAoe?: boolean;
  }[];
  isSelected?: boolean;
  onSelect?: () => void;
}

const HeroCard: React.FC<HeroCardProps> = ({
  id,
  name,
  archetype,
  heroClass,
  hp,
  epRegen,
  speed,
  skills,
  isSelected = false,
  onSelect
}) => {
  // Calculate stat percentages for visualization
  const hpPercent = Math.min(100, (hp / 500) * 100);
  const epPercent = Math.min(100, (epRegen / 5) * 100);
  const speedPercent = Math.min(100, (speed / 100) * 100);

  return (
    <div 
      className={`hero-card bg-[hsl(var(--terminal-bg))]/60 rounded border ${isSelected ? 'border-[hsl(var(--terminal-yellow))]' : 'border-[hsl(var(--terminal-blue))]/30'} 
      overflow-hidden hover:border-[hsl(var(--terminal-yellow))] cursor-pointer transition-all`}
      data-hero-id={id}
      onClick={onSelect}
    >
      <div className="p-3">
        <div className="font-comic text-lg text-[hsl(var(--terminal-yellow))]">{name}</div>
        <div className="text-xs text-[hsl(var(--terminal-cyan))] mb-2">{heroClass} | {archetype}</div>
        
        <div className="text-xs mb-1">HP: {hp}</div>
        <div className="w-full bg-[hsl(var(--terminal-bg))] rounded-full mb-2">
          <div className="hero-stat-bar bg-[hsl(var(--terminal-red))]" style={{ width: `${hpPercent}%` }}></div>
        </div>
        
        <div className="text-xs mb-1">EP Regen: {epRegen}/turn</div>
        <div className="w-full bg-[hsl(var(--terminal-bg))] rounded-full mb-2">
          <div className="hero-stat-bar bg-[hsl(var(--terminal-blue))]" style={{ width: `${epPercent}%` }}></div>
        </div>
        
        <div className="text-xs mb-1">SPD: {speed}</div>
        <div className="w-full bg-[hsl(var(--terminal-bg))] rounded-full mb-2">
          <div className="hero-stat-bar bg-[hsl(var(--terminal-yellow))]" style={{ width: `${speedPercent}%` }}></div>
        </div>
        
        <div className="text-xs text-[hsl(var(--terminal-green))] mt-2">Skills:</div>
        <div className="pl-2 text-xs">
          {skills.map((skill, index) => (
            <div key={index}>
              • {skill.name} (EP: {skill.energyCost}
              {skill.damage ? `, DMG: ${skill.damage}` : ''}
              {skill.cooldown ? `, CD: ${skill.cooldown}` : ''}
              {skill.isAoe ? ', AoE' : ''})
            </div>
          ))}
        </div>
      </div>
      <button className="w-full py-1 bg-[hsl(var(--terminal-blue))]/30 hover:bg-[hsl(var(--terminal-blue))]/60 text-sm">
        {isSelected ? 'Selected' : 'Select'}
      </button>
    </div>
  );
};

export default HeroCard;
