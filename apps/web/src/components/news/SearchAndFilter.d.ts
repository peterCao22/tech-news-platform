import React from 'react';
import { ContentFilter } from '@/services/api/content';
import { Source } from '@/services/api/sources';
interface SearchAndFilterProps {
    filters: ContentFilter;
    sources: Source[];
    onFiltersChange: (filters: ContentFilter) => void;
    onSearch: (query: string) => void;
    onClearSearch: () => void;
    searchQuery: string;
    onSearchQueryChange: (query: string) => void;
    className?: string;
}
export declare const SearchAndFilter: React.FC<SearchAndFilterProps>;
export default SearchAndFilter;
