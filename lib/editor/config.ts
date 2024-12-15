import { textblockTypeInputRule } from 'prosemirror-inputrules';
import { Schema } from 'prosemirror-model';
import { schema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import type { Transaction } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { MutableRefObject } from 'react';

import { buildContentFromDocument } from './functions';

const baseNodes = addListNodes(schema.spec.nodes, 'paragraph block*', 'block');

export const documentSchema = new Schema({
  nodes: baseNodes
    .update('paragraph', {
      content: 'inline*',
      group: 'block',
      attrs: { style: { default: null } },
      parseDOM: [{
        tag: 'p',
        getAttrs: (dom) => {
          const element = dom as HTMLElement;
          return { style: element.getAttribute('style') };
        }
      }],
      toDOM: (node) => ['p', { style: node.attrs.style || '' }, 0]
    })
    .update('heading', {
      attrs: { 
        level: { default: 1 },
        style: { default: null }
      },
      content: 'inline*',
      group: 'block',
      defining: true,
      parseDOM: [{
        tag: 'h1',
        attrs: { level: 1 },
        getAttrs: (dom) => ({
          style: (dom as HTMLElement).getAttribute('style')
        })
      }, {
        tag: 'h2',
        attrs: { level: 2 },
        getAttrs: (dom) => ({
          style: (dom as HTMLElement).getAttribute('style')
        })
      }, {
        tag: 'h3',
        attrs: { level: 3 },
        getAttrs: (dom) => ({
          style: (dom as HTMLElement).getAttribute('style')
        })
      }],
      toDOM: (node) => [`h${node.attrs.level}`, { style: node.attrs.style || '' }, 0]
    })
    .update('bullet_list', {
      content: 'list_item+',
      group: 'block',
      attrs: { style: { default: null } },
      parseDOM: [{
        tag: 'ul',
        getAttrs: (dom) => ({
          style: (dom as HTMLElement).getAttribute('style')
        })
      }],
      toDOM: (node) => ['ul', { style: node.attrs.style || '' }, 0]
    })
    .update('list_item', {
      content: 'paragraph block*',
      attrs: { style: { default: null } },
      parseDOM: [{
        tag: 'li',
        getAttrs: (dom) => ({
          style: (dom as HTMLElement).getAttribute('style')
        })
      }],
      toDOM: (node) => ['li', { style: node.attrs.style || '' }, 0]
    })
    .update('code_block', {
      content: 'text*',
      marks: '',
      group: 'block',
      code: true,
      attrs: { style: { default: 'direction: ltr; text-align: left' } },
      parseDOM: [{
        tag: 'pre',
        preserveWhitespace: 'full',
        getAttrs: (dom) => ({
          style: (dom as HTMLElement).getAttribute('style') || 'direction: ltr; text-align: left'
        })
      }],
      toDOM: (node) => ['pre', { style: node.attrs.style || 'direction: ltr; text-align: left' }, ['code', 0]]
    }),
  marks: schema.spec.marks,
});

export function headingRule(level: number) {
  return textblockTypeInputRule(
    new RegExp(`^(#{1,${level}})\\s$`),
    documentSchema.nodes.heading,
    () => ({ level }),
  );
}

export const handleTransaction = ({
  transaction,
  editorRef,
  saveContent,
}: {
  transaction: Transaction;
  editorRef: MutableRefObject<EditorView | null>;
  saveContent: (updatedContent: string, debounce: boolean) => void;
}) => {
  if (!editorRef || !editorRef.current) return;

  const newState = editorRef.current.state.apply(transaction);
  editorRef.current.updateState(newState);

  if (transaction.docChanged && !transaction.getMeta('no-save')) {
    const updatedContent = buildContentFromDocument(newState.doc);

    if (transaction.getMeta('no-debounce')) {
      saveContent(updatedContent, false);
    } else {
      saveContent(updatedContent, true);
    }
  }
};
