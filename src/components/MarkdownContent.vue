<template>
  <div class="markdown-content">
    <div @click="handleImageClick" v-html="html"></div>
    <div v-if="preview && previewImages.length" style="display: none" aria-hidden="true">
      <a-image-preview-group
        :preview="{ visible: previewVisible, current: previewCurrent, onVisibleChange: handlePreviewVisibleChange }"
      >
        <a-image v-for="(src, index) in previewImages" :key="`${index}-${src}`" :src="src" />
      </a-image-preview-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import DOMPurify from "dompurify";
import katex from "katex";
import { marked } from "marked";
import "katex/dist/katex.min.css";

const props = defineProps<{
  content?: string | null;
  preview?: boolean;
  resolveImageUrl?: (src: string) => string;
}>();

const previewImages = ref<string[]>([]);
const previewVisible = ref(false);
const previewCurrent = ref(0);
const handlePreviewVisibleChange = (visible: boolean) => {
  previewVisible.value = visible;
};
const handleImageClick = async (event: MouseEvent) => {
  if (
    !props.preview ||
    !(event.target instanceof HTMLImageElement) ||
    !(event.currentTarget instanceof HTMLElement)
  ) return;
  const images = Array.from(event.currentTarget.querySelectorAll("img"));
  previewImages.value = images.map((image) => image.currentSrc || image.src);
  previewCurrent.value = images.indexOf(event.target);
  await nextTick();
  previewVisible.value = true;
};

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
  const sanitized = DOMPurify.sanitize(merged, {
    USE_PROFILES: { html: true, mathMl: true, svg: true },
  });
  const container = document.createElement("div");
  container.innerHTML = sanitized;
  container.querySelectorAll("img").forEach((image) => {
    // 鉴权图片加载后是 blob 地址，在 HTML 清理后替换，避免被过滤。
    const src = image.getAttribute("src");
    if (src && props.resolveImageUrl) image.src = props.resolveImageUrl(src);
    image.setAttribute("loading", "lazy");
    image.setAttribute("decoding", "async");
  });
  return container.innerHTML;
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
