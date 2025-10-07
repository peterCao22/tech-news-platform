import React from 'react';
const SkeletonItem = ({ viewMode }) => {
    if (viewMode === 'list') {
        return (<div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
        <div className="flex gap-4">
          {/* 缩略图骨架 */}
          <div className="flex-shrink-0 w-32 h-24 bg-gray-200 rounded-lg"></div>
          
          {/* 内容骨架 */}
          <div className="flex-1 min-w-0">
            {/* 标题骨架 */}
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
            
            {/* 描述骨架 */}
            <div className="space-y-2 mb-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
            
            {/* 元信息骨架 */}
            <div className="flex gap-4 mb-3">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-4 bg-gray-200 rounded w-12"></div>
            </div>
            
            {/* 标签骨架 */}
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 rounded-full w-16"></div>
              <div className="h-6 bg-gray-200 rounded-full w-20"></div>
              <div className="h-6 bg-gray-200 rounded-full w-14"></div>
            </div>
          </div>
        </div>
      </div>);
    }
    // Grid view skeleton
    return (<div className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse h-full">
      {/* 缩略图骨架 */}
      <div className="w-full h-48 bg-gray-200"></div>
      
      <div className="p-4">
        {/* 标题骨架 */}
        <div className="h-6 bg-gray-200 rounded mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
        
        {/* 描述骨架 */}
        <div className="space-y-2 mb-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
        
        {/* 元信息骨架 */}
        <div className="flex gap-3 mb-3">
          <div className="h-3 bg-gray-200 rounded w-16"></div>
          <div className="h-3 bg-gray-200 rounded w-12"></div>
        </div>
        
        {/* 标签骨架 */}
        <div className="flex gap-1">
          <div className="h-5 bg-gray-200 rounded-full w-12"></div>
          <div className="h-5 bg-gray-200 rounded-full w-16"></div>
        </div>
      </div>
    </div>);
};
export const NewsSkeleton = ({ viewMode = 'grid', count = 6, className = '' }) => {
    return (<div className={className}>
      {viewMode === 'grid' ? (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: count }, (_, index) => (<SkeletonItem key={index} viewMode={viewMode}/>))}
        </div>) : (<div className="space-y-4">
          {Array.from({ length: count }, (_, index) => (<SkeletonItem key={index} viewMode={viewMode}/>))}
        </div>)}
    </div>);
};
export default NewsSkeleton;
