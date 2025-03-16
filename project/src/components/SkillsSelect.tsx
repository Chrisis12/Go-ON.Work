import React, { useState, useRef } from 'react';
import { AVAILABLE_SKILLS } from '../constants/skills';
import { useFloating, useInteractions, useClick, useRole, useDismiss, FloatingFocusManager, FloatingPortal } from '@floating-ui/react';
import { Search, X, Check } from 'lucide-react';

interface SkillsSelectProps {
  selectedSkills: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function SkillsSelect({ 
  selectedSkills, 
  onChange,
  placeholder = 'Select skills...',
  className = ''
}: SkillsSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const { refs, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
  });

  const click = useClick(context);
  const role = useRole(context);
  const dismiss = useDismiss(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    role,
    dismiss,
  ]);

  const filteredSkills = AVAILABLE_SKILLS.filter(skill =>
    skill.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSkill = (skill: string) => {
    const newSkills = selectedSkills.includes(skill)
      ? selectedSkills.filter(s => s !== skill)
      : [...selectedSkills, skill];
    onChange(newSkills);
  };

  const handleClear = () => {
    onChange([]);
    setSearch('');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div
        ref={refs.setReference}
        {...getReferenceProps()}
        className={`cursor-pointer relative ${className}`}
      >
        <div className="min-h-[42px] w-full rounded-lg border border-gray-300 px-3 py-2 bg-white">
          {selectedSkills.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedSkills.map(skill => (
                <span
                  key={skill}
                  className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        {selectedSkills.length > 0 && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        )}
      </div>

      {isOpen && (
        <FloatingPortal>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999]">
            <FloatingFocusManager context={context} modal={false}>
              <div
                ref={refs.setFloating}
                {...getFloatingProps()}
                className="fixed inset-x-0 bottom-0 top-20 mx-auto max-w-lg bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col z-[9999]"
              >
                <div className="p-4 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      ref={searchRef}
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search skills..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-2">
                    {filteredSkills.map(skill => (
                      <label
                        key={skill}
                        className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                      >
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            checked={selectedSkills.includes(skill)}
                            onChange={() => toggleSkill(skill)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                        <span className="ml-3 text-gray-700">{skill}</span>
                        {selectedSkills.includes(skill) && (
                          <Check className="ml-auto h-4 w-4 text-blue-600" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="p-4 border-t bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {selectedSkills.length} selected
                    </span>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </FloatingFocusManager>
          </div>
        </FloatingPortal>
      )}
    </div>
  );
}