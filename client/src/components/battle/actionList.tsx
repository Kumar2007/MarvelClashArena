import React from 'react';

interface Skill {
  id: number;
  name: string;
  energyCost: number;
  cooldown: number;
  remainingCooldown: number;
  canUse: boolean;
  targeting: string;
}

interface Hero {
  heroId: string;
  name: string;
  skills: Skill[];
}

interface ActionListProps {
  availableActions: Hero[];
  onUseSkill: (heroId: string, skillId: number) => void;
}

const ActionList: React.FC<ActionListProps> = ({ availableActions, onUseSkill }) => {
  return (
    <div className="bg-[hsl(var(--terminal-bg))]/30 p-3 rounded-lg">
      <div className="text-[hsl(var(--terminal-blue))] font-bold mb-2">AVAILABLE ACTIONS:</div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        {availableActions.map((hero) => (
          <div key={hero.heroId} className="p-2 bg-[hsl(var(--terminal-bg))]/20 rounded">
            <div className="text-[hsl(var(--terminal-yellow))] mb-1">{hero.name}:</div>
            <div className="space-y-1">
              {hero.skills.map((skill) => (
                <div 
                  key={skill.id} 
                  className={`flex justify-between ${!skill.canUse ? 'opacity-50' : ''}`}
                >
                  <span className="cursor-pointer hover:text-[hsl(var(--terminal-yellow))]" onClick={() => skill.canUse && onUseSkill(hero.heroId, skill.id)}>
                    {skill.id + 1}. {skill.name}
                  </span>
                  <span className={skill.canUse ? 'text-[hsl(var(--terminal-green))]' : 'text-[hsl(var(--terminal-red))]'}>
                    {skill.remainingCooldown > 0 
                      ? `COOLDOWN: ${skill.remainingCooldown}` 
                      : `EP: ${skill.energyCost}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-2 text-xs">
        <div>Type <span className="text-[hsl(var(--terminal-yellow))]">use [hero] [skill] [target]</span> (e.g., use ironman 1 captainamerica)</div>
        <div>Type <span className="text-[hsl(var(--terminal-yellow))]">swap [position] [hero]</span> to change positions (e.g., swap front blackwidow)</div>
      </div>
    </div>
  );
};

export default ActionList;
