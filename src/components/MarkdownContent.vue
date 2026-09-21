<template>
  <div class="markdown-content" v-html="html"></div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import DOMPurify from "dompurify";
import katex from "katex";
import { marked } from "marked";
import "katex/dist/katex.min.css";

const props = defineProps<{ content?: string | null }>();

// 试题文本中的公式以 $$...$$ 包裹（切题接口输出约定）
const MATH_PATTERN = /\$\$([\s\S]+?)\$\$/g;
const PLACEHOLDER_PREFIX = "@@KATEX";
const PLACEHOLDER_PATTERN = /@@KATEX(\d+)@@/g;

// 题号形如 “1.”“16．”，行首出现时会被 Markdown 当成有序列表导致整段缩进，需转义
const QUESTION_NUMBER_PATTERN = /^(\s*)(\d{1,2})([.、．])(?=\s*\S)/gm;

// 先把公式抽成占位符（避免 marked 破坏 LaTeX 语法），解析 Markdown 后再换回渲染结果
const renderRichText = (source?: string | null): string => {
  const text = String(source ?? "");
  if (!text.trim()) return "";

  const mathBlocks: string[] = [];
  const withPlaceholders = text
    .replace(MATH_PATTERN, (match, tex) => {
      try {
        mathBlocks.push(
          katex.renderToString(tex, { displayMode: false, throwOnError: false, strict: false })
        );
        return `${PLACEHOLDER_PREFIX}${mathBlocks.length - 1}@@`;
      } catch {
        return match;
      }
    })
    .replace(QUESTION_NUMBER_PATTERN, (_match, indent, number, dot) => `${indent}${number}\\${dot}`);

  const markdownHtml = marked.parse(withPlaceholders, { breaks: true, gfm: true }) as string;
  const merged = markdownHtml.replace(PLACEHOLDER_PATTERN, (_match, index) =>
    mathBlocks[Number(index)] ?? ""
  );
  // KaTeX 会输出 MathML 与 SVG 片段，需放开对应白名单
  return DOMPurify.sanitize(merged, {
    USE_PROFILES: { html: true, mathMl: true, svg: true },
  });
};

const html = computed(() => renderRichText(props.content));
</script>

<style scoped lang="less">
.markdown-content {
  word-break: break-word;
  line-height: 1.9;

  :deep(p) {
    margin: 0 0 4px;
  }

  :deep(img) {
    max-width: 100%;
  }
}
</style>
