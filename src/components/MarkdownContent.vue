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

// 只有 ASCII 的 “.” 和 “)” 会被 Markdown 当成有序列表标记，行首出现时会被重排缩进，需转义；
// 中文顿号“、”、全角句点“．”既不是列表标记，CommonMark 也不会反转义，转义它们反而会残留可见反斜杠
const QUESTION_NUMBER_PATTERN = /^(\s*)(\d{1,2})([.)])(?=\s)/gm;
// 清理历史数据里被错误转义的反斜杠（如 “1\．”“1\、”，全角标点前 marked 不会反转义）
const BROKEN_ESCAPE_PATTERN = /\\+([^\x00-\x7F])/g;

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
    .replace(QUESTION_NUMBER_PATTERN, (_match, indent, number, dot) => `${indent}${number}\\${dot}`)
    .replace(BROKEN_ESCAPE_PATTERN, "$1");

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
  // 覆盖全局 #app 的 text-align: center（Vue 脚手架默认样式），试题文本默认左对齐
  text-align: left;
  word-break: break-word;
  line-height: 1.9;

  :deep(p) {
    margin: 0 0 4px;
  }

  :deep(img) {
    max-width: 100%;
  }

  // 历史落库的公式图缺 width/height：PNG 是 Word 显示尺寸的数倍渲染图，
  // 不兜底会按自然尺寸撑爆行高；按正文字号约束成行内公式高度
  :deep(img[alt="公式"]:not([width]):not([height])) {
    height: 2em;
    width: auto;
    vertical-align: -0.45em;
  }

  // 语文标注：Word 的波浪线/双线/点线/虚线要按原样画出来
  :deep(u.wavy) {
    text-decoration: underline wavy;
    text-decoration-skip-ink: none;
  }

  :deep(u.double) {
    text-decoration: underline double;
  }

  :deep(u.dotted) {
    text-decoration: underline dotted;
  }

  :deep(u.dashed) {
    text-decoration: underline dashed;
  }
}
</style>
