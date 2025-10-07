import React from 'react';
import { Content } from '@/services/api/content';
interface NewsCardProps {
    content: Content;
    viewMode?: 'grid' | 'list';
    showActions?: boolean;
    onBookmark?: (content: Content) => void;
    onShare?: (content: Content) => void;
    className?: string;
}
export declare const NewsCard: React.FC<NewsCardProps>;
export default NewsCard;
