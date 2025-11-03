declare module '@toast-ui/editor' {
  export interface EditorOptions {
    el: HTMLElement;
    height?: string;
    initialEditType?: 'markdown' | 'wysiwyg';
    previewStyle?: 'tab' | 'vertical';
    initialValue?: string;
    placeholder?: string;
    events?: {
      change?: () => void;
      [key: string]: any;
    };
    [key: string]: any;
  }

  export default class Editor {
    constructor(options: EditorOptions);
    getMarkdown(): string;
    getHTML(): string;
    setMarkdown(markdown: string, cursorToEnd?: boolean): void;
    setHTML(html: string, cursorToEnd?: boolean): void;
    insertText(text: string): void;
    focus(): void;
    blur(): void;
    destroy(): void;
    hide(): void;
    show(): void;
    reset(): void;
    moveCursorToStart(): void;
    moveCursorToEnd(): void;
  }
}

declare module '@toast-ui/editor/dist/toastui-editor-viewer' {
  export interface ViewerOptions {
    el: HTMLElement;
    initialValue?: string;
    [key: string]: any;
  }

  export default class Viewer {
    constructor(options: ViewerOptions);
    setMarkdown(markdown: string): void;
    destroy(): void;
  }
}
