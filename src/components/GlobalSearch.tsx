import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search,
  X, 
  User, 
  Package, 
  CreditCard, 
  Users, 
  Map,
  Loader2,
  PackageCheck,
  UserPlus,
  LayoutDashboard,
  Building2
} from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { 
  searchAll, 
  SearchResult,
  SearchResultType,
  getIconForType,
  getTypeDisplayName
} from '@/services/SearchService';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

interface GlobalSearchProps {
  isMobileSidebar?: boolean;
  hideOnMobile?: boolean;
}

export function GlobalSearch({ isMobileSidebar = false, hideOnMobile = false }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Check if mobile on mount and on resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add resize event listener
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Perform search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedQuery.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const searchResults = await searchAll(debouncedQuery);
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (hideOnMobile && isMobile) {
          setIsExpanded(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [hideOnMobile, isMobile]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
        if (hideOnMobile && isMobile) {
          setIsExpanded(true);
        }
      }
      
      // Escape to close search results
      if (event.key === 'Escape') {
        setIsOpen(false);
        if (hideOnMobile && isMobile) {
          setIsExpanded(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [hideOnMobile, isMobile]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  // Handle result selection
  const handleSelectResult = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    if (hideOnMobile && isMobile) {
      setIsExpanded(false);
    }
    navigate(result.url);
  };

  // Toggle search expansion (for mobile)
  const toggleSearchExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  // Get icon for search result type
  const getIcon = (type: SearchResultType) => {
    switch (type) {
      case 'customer':
        return <User className="h-4 w-4" />;
      case 'booking':
        return <PackageCheck className="h-4 w-4" />;
      case 'lead':
        return <UserPlus className="h-4 w-4" />;
      case 'itinerary':
        return <Map className="h-4 w-4" />;
      case 'payment':
        return <CreditCard className="h-4 w-4" />;
      case 'navigation':
        return <LayoutDashboard className="h-4 w-4" />;
      case 'hotel':
        return <Building2 className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  // Get CSS class for search result type
  const getTypeClass = (type: SearchResultType): string => {
    switch (type) {
      case 'customer':
        return 'bg-blue-600';
      case 'booking':
        return 'bg-amber-600';
      case 'lead':
        return 'bg-purple-600';
      case 'itinerary':
        return 'bg-green-600';
      case 'payment':
        return 'bg-sky-600';
      case 'navigation':
        return 'bg-slate-500';
      case 'hotel':
        return 'bg-emerald-600';
      default:
        return 'bg-slate-500';
    }
  };

  // If in mobile view and not expanded, show only search icon (only when hideOnMobile is true)
  if (hideOnMobile && isMobile && !isExpanded) {
    return (
      <div className="relative" ref={searchRef}>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={toggleSearchExpand}
        >
          <Search className="h-5 w-5" />
          <span className="sr-only">Search</span>
        </Button>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "relative",
        isMobileSidebar 
          ? "w-full" 
          : (hideOnMobile && isMobile && isExpanded) 
            ? "w-full min-w-[200px]" 
            : "w-full min-w-[320px] sm:min-w-[400px]"
      )} 
      ref={searchRef}
    >
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>
        
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search... (Ctrl+K)"
          className="w-full h-10 bg-muted/30 hover:bg-muted/50 focus:bg-background pl-9 pr-10 rounded-lg border-[1.5px] border-muted focus-visible:ring-1 focus-visible:ring-emerald-500 transition-colors"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            setIsOpen(true);
            if (hideOnMobile && isMobile) {
              setIsExpanded(true);
            }
          }}
          autoComplete="off"
        />
        
        {query ? (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear</span>
          </Button>
        ) : (hideOnMobile && isMobile) && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground"
            onClick={() => setIsExpanded(false)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        )}

        {/* Keyboard shortcut indicator */}
        {!query && !isMobile && (
          <div className="hidden md:flex absolute right-3 top-1/2 transform -translate-y-1/2 items-center gap-1">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        )}
      </div>

      {/* Search Results */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 w-full rounded-md border bg-background shadow-lg">
          {/* Empty state */}
          {!isLoading && query.length >= 2 && results.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No results found
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="max-h-[400px] overflow-y-auto py-2">
              {results.map((result) => (
                <div
                  key={`${result.type}-${result.id}`}
                  className="flex items-center px-4 py-2.5 cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleSelectResult(result)}
                >
                  <div className={cn("flex-shrink-0 p-1.5 mr-3 rounded-full text-white shadow-sm", getTypeClass(result.type))}>
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{result.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{result.subtitle}</div>
                  </div>
                  <div className="ml-2 text-xs text-muted-foreground px-2 py-1 rounded-full bg-muted">
                    {getTypeDisplayName(result.type)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info text for shorter queries */}
          {query.length < 2 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search
            </div>
          )}
        </div>
      )}
    </div>
  );
} 