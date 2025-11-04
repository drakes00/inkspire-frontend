import { Component, ElementRef, Input, Output, EventEmitter, AfterViewInit, OnDestroy, ViewChild, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import Editor from '@toast-ui/editor';

@Component({
  selector: 'app-markdown-editor',
  templateUrl: './markdown-editor.component.html',
  styleUrls: ['./markdown-editor.component.css'],
  standalone: true,
})
export class MarkdownEditorComponent implements AfterViewInit, OnDestroy, OnInit, OnChanges {
  @ViewChild('editor') private editorRef!: ElementRef;
  @Input() content: string = '';
  @Output() contentChange = new EventEmitter<string>();

  private editor!: Editor;
  private themeObserver!: MutationObserver;

  ngOnChanges(changes: SimpleChanges) {
    if (this.editor && changes['content']) {
      const currentValue = changes['content'].currentValue;
      if (currentValue !== this.editor.getMarkdown()) {
        this.editor.setMarkdown(currentValue);
      }
    }
  }

  ngOnInit() {
    // Observer les changements de classe sur le body
    this.themeObserver = new MutationObserver(() => {
      if (this.editor) {
        this.updateEditorTheme();
      }
    });

    this.themeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  ngAfterViewInit() {
    const isDarkMode = document.body.classList.contains('dark-theme');

    this.editor = new Editor({
      el: this.editorRef.nativeElement,
      height: '80vh',
      initialEditType: 'markdown',
      previewStyle: 'tab',
      initialValue: this.content,
      hideModeSwitch: true,
      usageStatistics: false,
      theme: isDarkMode ? 'dark' : 'light',
      events: {
        change: () => {
          this.contentChange.emit(this.editor.getMarkdown());
        }
      }
    });
  }

  private updateEditorTheme() {
    const isDarkMode = document.body.classList.contains('dark-theme');

    // Toast UI Editor n'a pas de méthode setTheme(),
    // donc on doit recréer l'éditeur ou utiliser CSS
    const currentContent = this.editor.getMarkdown();
    this.editor.destroy();

    this.editor = new Editor({
      el: this.editorRef.nativeElement,
      height: '80vh',
      initialEditType: 'markdown',
      previewStyle: 'tab',
      initialValue: currentContent,
      hideModeSwitch: true,
      usageStatistics: false,
      theme: isDarkMode ? 'dark' : 'light',
      events: {
        change: () => {
          this.contentChange.emit(this.editor.getMarkdown());
        }
      }
    });
  }

  ngOnDestroy() {
    this.themeObserver?.disconnect();
    this.editor?.destroy();
  }
}
