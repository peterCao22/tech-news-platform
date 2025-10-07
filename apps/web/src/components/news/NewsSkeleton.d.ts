import React from 'react';
interface NewsSkeletonProps {
    viewMode?: 'grid' | 'list';
    count?: number;
    className?: string;
}
export declare const NewsSkeleton: React.FC<NewsSkeletonProps>;
export default NewsSkeleton;
