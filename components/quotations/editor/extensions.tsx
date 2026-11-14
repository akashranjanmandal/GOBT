"use client";

import { useSyncExternalStore } from "react";
import { Mark, Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from "@tiptap/react";
import type { QuoteData } from "@/lib/quotations/model";
import { PAGE_BREAK_NODE, PRICING_NODE } from "@/lib/quotations/doc";
import { MARK_NODE, markSrc } from "@/lib/quotations/model";
import PricingTables from "../PricingTables";
import { isRed } from "./paste";

/* the only colour allowed: red, for things like the amount in words */
export const Red = Mark.create({
  name: "red",
  parseHTML() {
    return [
      { tag: "span.de-red" },
      { style: "color", getAttrs: (value) => (isRed(String(value)) ? {} : false) },
      { tag: "font[color]", getAttrs: (el) => (isRed((el as HTMLElement).getAttribute("color")) ? {} : false) },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { class: "de-red" }), 0];
  },
});

/* forces the next content onto a new PDF page */
export const PageBreak = Node.create({
  name: PAGE_BREAK_NODE,
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  parseHTML() {
    return [{ tag: "div[data-page-break]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-page-break": "", class: "de-pagebreak", contenteditable: "false" })];
  },
});

/* the price panel's numbers, shared with the block inside the document */
export type PricingStore = {
  get: () => QuoteData;
  subscribe: (cb: () => void) => () => void;
  focusPanel: () => void;
};

function PricingView({ extension, deleteNode, selected }: ReactNodeViewProps) {
  const store = (extension.options as { store: PricingStore }).store;
  const q = useSyncExternalStore(store.subscribe, store.get, store.get);
  return (
    <NodeViewWrapper className={`de-pricing${selected ? " is-selected" : ""}`} data-drag-handle="">
      <div className="de-pricing-bar" contentEditable={false}>
        <span>Price &amp; payment · calculated automatically</span>
        <button type="button" onClick={store.focusPanel}>
          Change prices
        </button>
        <button type="button" onClick={deleteNode} aria-label="Remove the price tables">
          Remove
        </button>
      </div>
      <PricingTables q={q} />
    </NodeViewWrapper>
  );
}

export const Pricing = Node.create<{ store: PricingStore | null }>({
  name: PRICING_NODE,
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addOptions() {
    return { store: null };
  },
  parseHTML() {
    return [{ tag: "div[data-quote-pricing]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-quote-pricing": "" })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(PricingView);
  },
});

/* a saved signature or stamp placed anywhere in the text: left / centre / right, three sizes */
const SIZES = { s: "Small", m: "Medium", l: "Large" } as const;
const ALIGNS = { left: "Left", center: "Centre", right: "Right" } as const;

function MarkView({ node, updateAttributes, deleteNode, selected }: ReactNodeViewProps) {
  const { mark, align, size } = node.attrs as { mark: string; align: keyof typeof ALIGNS; size: keyof typeof SIZES };
  return (
    <NodeViewWrapper className={`de-mark de-mark-${align} de-mark-${size}${selected ? " is-selected" : ""}`} data-drag-handle="">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={markSrc(mark)} alt="Signature or stamp" draggable={false} />
      <span className="de-mark-tools" contentEditable={false}>
        {(Object.keys(ALIGNS) as (keyof typeof ALIGNS)[]).map((a) => (
          <button key={a} type="button" className={align === a ? "is-on" : ""} onClick={() => updateAttributes({ align: a })}>
            {ALIGNS[a]}
          </button>
        ))}
        {(Object.keys(SIZES) as (keyof typeof SIZES)[]).map((z) => (
          <button key={z} type="button" className={size === z ? "is-on" : ""} onClick={() => updateAttributes({ size: z })}>
            {SIZES[z]}
          </button>
        ))}
        <button type="button" onClick={deleteNode}>
          Remove
        </button>
      </span>
    </NodeViewWrapper>
  );
}

export const QuoteMark = Node.create({
  name: MARK_NODE,
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      mark: { default: "default-stamp" },
      align: { default: "right" },
      size: { default: "m" },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-quote-mark]", getAttrs: (el) => ({ mark: (el as HTMLElement).getAttribute("data-quote-mark") }) }];
  },
  renderHTML({ node }) {
    return ["div", { "data-quote-mark": node.attrs.mark }];
  },
  addNodeView() {
    return ReactNodeViewRenderer(MarkView);
  },
});
