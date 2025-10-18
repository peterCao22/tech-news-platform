/**
 * Rich Text Editor Component
 * 富文本编辑器组件（使用 React Quill）
 * Story 3.3: Manual Content Management
 */

'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// 动态导入 ReactQuill 以避免 SSR 问题
const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded" />,
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  readOnly?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = '输入内容...',
  height = '400px',
  readOnly = false,
}) => {
  // Quill 工具栏配置
  const modules = useMemo(
    () => ({
      toolbar: readOnly
        ? false
        : [
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['blockquote', 'code-block'],
            [{ align: [] }],
            ['link', 'image'],
            ['clean'],
          ],
      clipboard: {
        matchVisual: false,
      },
    }),
    [readOnly]
  );

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'blockquote',
    'code-block',
    'align',
    'link',
    'image',
  ];

  return (
    <div className="rich-text-editor-wrapper">
      <style jsx global>{`
        .quill {
          background: white;
          border-radius: 0.375rem;
        }
        .ql-toolbar {
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
        }
        .ql-container {
          border-bottom-left-radius: 0.375rem;
          border-bottom-right-radius: 0.375rem;
          border: 1px solid #e5e7eb;
          border-top: none;
          font-size: 14px;
          min-height: ${height};
        }
        .ql-editor {
          min-height: ${height};
          padding: 12px 15px;
        }
        .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
        .ql-snow .ql-picker {
          font-size: 14px;
        }
      `}</style>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
      />
    </div>
  );
};

export default RichTextEditor;

