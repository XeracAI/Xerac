'use client'

import {defaultMarkdownSerializer} from 'prosemirror-markdown'
import {DOMParser, type Node} from 'prosemirror-model'
import {Decoration, DecorationSet, type EditorView} from 'prosemirror-view'
import {renderToString} from 'react-dom/server'

import {Markdown} from '@/components/markdown'

import {documentSchema} from './config'
import {createSuggestionWidget, type UISuggestion} from './suggestions'
import {checkEnglishString} from '../utils'

export const buildDocumentFromContent = (content: string) => {
  const parser = DOMParser.fromSchema(documentSchema)
  const stringFromMarkdown = renderToString(<Markdown>{content}</Markdown>)
  const tempContainer = document.createElement('div')
  tempContainer.innerHTML = stringFromMarkdown

  // Process paragraphs, headings, and list items to add direction style
  tempContainer.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, pre, code').forEach((element) => {
    const text = element.textContent || ''
    if (checkEnglishString(text)) {
      element.setAttribute('style', 'direction: ltr; text-align: left')
    }
  })

  return parser.parse(tempContainer)
}

export const buildContentFromDocument = (document: Node) => {
  return defaultMarkdownSerializer.serialize(document)
}

export const createDecorations = (suggestions: Array<UISuggestion>, view: EditorView) => {
  const decorations: Array<Decoration> = []

  for (const suggestion of suggestions) {
    decorations.push(
      Decoration.inline(
        suggestion.selectionStart,
        suggestion.selectionEnd,
        {
          class: 'suggestion-highlight',
        },
        {
          suggestionId: suggestion.id,
          type: 'highlight',
        }
      )
    )

    decorations.push(
      Decoration.widget(
        suggestion.selectionStart,
        (view) => {
          const {dom} = createSuggestionWidget(suggestion, view)
          return dom
        },
        {
          suggestionId: suggestion.id,
          type: 'widget',
        }
      )
    )
  }

  return DecorationSet.create(view.state.doc, decorations)
}
