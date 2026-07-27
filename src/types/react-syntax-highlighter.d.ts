declare module 'react-syntax-highlighter' {
  import * as React from 'react';

  export interface SyntaxHighlighterProps {
    children: string;
    language?: string;
    style?: { [key: string]: React.CSSProperties };
    customStyle?: React.CSSProperties;
    showLineNumbers?: boolean;
    wrapLongLines?: boolean;
  }

  export const Prism: React.FC<SyntaxHighlighterProps>;
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
  export const oneDark: { [key: string]: React.CSSProperties };
}
