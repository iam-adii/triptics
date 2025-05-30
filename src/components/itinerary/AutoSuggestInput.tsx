import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Suggestion {
  title: string;
  description: string;
}

interface AutoSuggestInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions: Suggestion[];
  onSuggestionSelect?: (suggestion: Suggestion) => void;
  className?: string;
}

const AutoSuggestInput = forwardRef<HTMLInputElement, AutoSuggestInputProps>(
  ({ value, onChange, placeholder, suggestions, onSuggestionSelect, className }, ref) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState<Suggestion[]>([]);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
    const suggestionContainerRef = useRef<HTMLDivElement>(null);
    
    // Filter suggestions based on input
    useEffect(() => {
      if (!value.trim()) {
        setFilteredSuggestions([]);
        return;
      }
      
      const filtered = suggestions.filter(
        suggestion => suggestion.title.toLowerCase().includes(value.toLowerCase())
      );
      
      setFilteredSuggestions(filtered.slice(0, 5)); // Limit to 5 suggestions
      setActiveSuggestionIndex(0);
    }, [value, suggestions]);

    const handleSuggestionClick = (suggestion: Suggestion) => {
      onChange(suggestion.title);
      if (onSuggestionSelect) {
        onSuggestionSelect(suggestion);
      }
      setShowSuggestions(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      // Handle navigation with keyboard
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter' && showSuggestions && filteredSuggestions.length > 0) {
        e.preventDefault();
        handleSuggestionClick(filteredSuggestions[activeSuggestionIndex]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    };

    // Click outside to close suggestions
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          suggestionContainerRef.current && 
          !suggestionContainerRef.current.contains(event.target as Node)
        ) {
          setShowSuggestions(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    // Scroll active suggestion into view
    useEffect(() => {
      const activeElement = document.getElementById(`suggestion-${activeSuggestionIndex}`);
      if (activeElement) {
        activeElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }, [activeSuggestionIndex]);

    return (
      <div className="relative w-full" ref={suggestionContainerRef}>
        <Input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={className}
          autoComplete="off"
        />
        
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-md bg-popover shadow-lg border border-border text-popover-foreground">
            <ul 
              className="max-h-60 overflow-y-auto rounded-md py-1 text-base"
              role="listbox"
            >
              {filteredSuggestions.map((suggestion, index) => (
                <li
                  key={`${suggestion.title}-${index}`}
                  id={`suggestion-${index}`}
                  className={cn(
                    "cursor-pointer select-none py-2 px-3 text-sm",
                    index === activeSuggestionIndex 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  )}
                  onClick={() => handleSuggestionClick(suggestion)}
                  role="option"
                >
                  <div className="font-medium">{suggestion.title}</div>
                  {suggestion.description && (
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {suggestion.description}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
);

AutoSuggestInput.displayName = "AutoSuggestInput";

export default AutoSuggestInput;
