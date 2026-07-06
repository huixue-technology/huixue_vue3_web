<template>
  <a-modal
    :open="open"
    title="错题下载"
    width="480px"
    :confirm-loading="downloading"
    ok-text="立即下载"
    cancel-text="取消"
    @ok="handleDownload"
    @cancel="emit('update:open', false)"
  >
    <a-form :label-col="{ span: 5 }" :wrapper-col="{ span: 19 }" style="margin-top: 8px">
      <a-form-item label="包含内容">
        <a-checkbox-group v-model:value="form.includes">
          <a-row :gutter="[0, 8]">
            <a-col :span="8"><a-checkbox value="question">题目</a-checkbox></a-col>
            <a-col :span="8"><a-checkbox value="answer">答案</a-checkbox></a-col>
            <a-col :span="8"><a-checkbox value="analysis">解析</a-checkbox></a-col>
            <a-col :span="12"><a-checkbox value="errorRate">错误率</a-checkbox></a-col>
            <a-col :span="12"><a-checkbox value="studentList">出错学生名单</a-checkbox></a-col>
          </a-row>
        </a-checkbox-group>
      </a-form-item>
    </a-form>

    <a-divider style="margin: 12px 0" />

    <div class="download-tip">
      <span>共 <span class="count">{{ total }}</span> 题将被下载</span>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { message } from "ant-design-vue";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

type WrongQuestionRecord = Record<string, any>;

const props = defineProps<{
  open: boolean;
  total: number;
  questionList?: WrongQuestionRecord[];
  queryParams?: Record<string, any>;
}>();

const emit = defineEmits<{
  (e: "update:open", val: boolean): void;
}>();

const downloading = ref(false);

const form = reactive({
  includes: ["question", "answer", "analysis"] as string[],
});

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  const str = String(value ?? "").trim();
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {}
  return [str];
}

// 将文件路径解析为可 fetch 的 URL（与父组件 fileUrl 逻辑一致）
function resolveUrl(path: string): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path) || path.startsWith("data:") || path.startsWith("/api/tp/file")) return path;
  return `/api/tp/file?path=${encodeURIComponent(path)}`;
}

// 从 URL 推断图片类型
function imageTypeFromUrl(url: string): "png" | "jpg" | "gif" | "bmp" {
  const ext = url.split("?")[0].toLowerCase().split(".").pop();
  if (ext === "jpg" || ext === "jpeg") return "jpg";
  if (ext === "gif") return "gif";
  if (ext === "bmp") return "bmp";
  return "png";
}

interface FetchedImage {
  data: ArrayBuffer;
  width: number;
  height: number;
  type: "png" | "jpg" | "gif" | "bmp";
}

// 拉取图片并获取尺寸，失败返回 null
async function fetchImage(url: string): Promise<FetchedImage | null> {
  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) return null;
    const blob = await res.blob();
    const data = await blob.arrayBuffer();

    const objUrl = URL.createObjectURL(blob);
    const { w, h } = await new Promise<{ w: number; h: number }>((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ w: img.naturalWidth, h: img.naturalHeight });
        URL.revokeObjectURL(objUrl);
      };
      img.onerror = () => {
        resolve({ w: 400, h: 300 });
        URL.revokeObjectURL(objUrl);
      };
      img.src = objUrl;
    });

    // 限制最大宽度 480pt，保持比例
    const MAX_WIDTH = 480;
    const scale = w > MAX_WIDTH ? MAX_WIDTH / w : 1;
    return {
      data,
      width: Math.round(w * scale),
      height: Math.round(h * scale),
      type: imageTypeFromUrl(url),
    };
  } catch {
    return null;
  }
}

type Segment = { type: "text"; content: string } | { type: "image"; url: string };

// 解析 Markdown 文本，提取文字段落和图片 URL
function parseMarkdown(raw: unknown): Segment[] {
  const str = String(raw ?? "").trim();
  if (!str) return [];
  const result: Segment[] = [];
  const pattern = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(str)) !== null) {
    if (match.index > cursor) result.push({ type: "text", content: str.slice(cursor, match.index) });
    result.push({ type: "image", url: resolveUrl(match[2]) });
    cursor = match.index + match[0].length;
  }
  if (cursor < str.length) result.push({ type: "text", content: str.slice(cursor) });
  return result;
}

// 将 Markdown 段落转为 docx Paragraph 数组（含图片）
async function segmentsToParagraphs(segments: Segment[]): Promise<Paragraph[]> {
  const result: Paragraph[] = [];
  for (const seg of segments) {
    if (seg.type === "text") {
      for (const line of seg.content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed) result.push(new Paragraph({ children: [new TextRun({ text: trimmed, size: 24 })] }));
      }
    } else {
      const img = await fetchImage(seg.url);
      if (img) {
        result.push(
          new Paragraph({
            children: [
              new ImageRun({ type: img.type, data: img.data, transformation: { width: img.width, height: img.height } }),
            ],
          })
        );
      }
    }
  }
  return result;
}

function makeLabelParagraph(label: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: `【${label}】`, bold: true, size: 24, color: "1677FF" })],
    spacing: { before: 120, after: 40 },
  });
}

function makeSeparator(): Paragraph {
  return new Paragraph({
    text: "",
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC", space: 0 } },
    spacing: { before: 160, after: 160 },
  });
}

async function buildDocxBlob(list: WrongQuestionRecord[]): Promise<Blob> {
  const children: Paragraph[] = [
    new Paragraph({
      text: "错题汇总",
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
    }),
  ];

  for (let i = 0; i < list.length; i++) {
    const item = list[i];

    children.push(
      new Paragraph({
        text: `第 ${i + 1} 题`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 80 },
      })
    );

    // 题目图片
    if (form.includes.includes("question")) {
      const imageUrls = stringList(item.images).map(resolveUrl).filter(Boolean);
      if (imageUrls.length) {
        children.push(makeLabelParagraph("题目"));
        for (const url of imageUrls) {
          const img = await fetchImage(url);
          if (img) {
            children.push(
              new Paragraph({
                children: [
                  new ImageRun({ type: img.type, data: img.data, transformation: { width: img.width, height: img.height } }),
                ],
              })
            );
          }
        }
      }
    }

    // 答案
    if (form.includes.includes("answer") && item.answer) {
      children.push(makeLabelParagraph("答案"));
      const paras = await segmentsToParagraphs(parseMarkdown(item.answer));
      children.push(...paras);
    }

    // 解析（含内嵌图片）
    if (form.includes.includes("analysis") && item.analysis) {
      children.push(makeLabelParagraph("解析"));
      const paras = await segmentsToParagraphs(parseMarkdown(item.analysis));
      children.push(...paras);
    }

    // 错误率
    if (form.includes.includes("errorRate") && item.wrong_rate != null) {
      const rate = Number(item.wrong_rate);
      const display = Number.isFinite(rate) ? `${(rate * 100).toFixed(1)}%` : String(item.wrong_rate);
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "【错误率】", bold: true, size: 24 }), new TextRun({ text: display, size: 24 })],
          spacing: { before: 80 },
        })
      );
    }

    // 出错学生名单
    if (form.includes.includes("studentList") && Array.isArray(item.wrong_students) && item.wrong_students.length) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: "【出错学生】", bold: true, size: 24 }),
            new TextRun({ text: item.wrong_students.join("、"), size: 24 }),
          ],
          spacing: { before: 80 },
        })
      );
    }

    if (i < list.length - 1) children.push(makeSeparator());
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "宋体", size: 24 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1800, right: 1800 },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}

async function handleDownload() {
  if (!props.total) {
    message.warning("当前无题目可下载，请先完成筛选查询");
    return;
  }
  const list = props.questionList ?? [];
  if (!list.length) {
    message.warning("题目数据未加载，请先点击查询");
    return;
  }

  downloading.value = true;
  try {
    const date = new Date().toLocaleDateString("zh-CN").replace(/\//g, "");
    const blob = await buildDocxBlob(list);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `错题_${date}.docx`;
    a.click();
    URL.revokeObjectURL(url);
    message.success("下载成功");
    emit("update:open", false);
  } catch (e) {
    console.error("Word 导出失败：", e);
    message.error("导出失败，请重试");
  } finally {
    downloading.value = false;
  }
}
</script>

<style scoped lang="less">
.download-tip {
  color: #595959;
  font-size: 13px;
  text-align: center;

  .count {
    color: #1677ff;
    font-weight: 600;
    font-size: 15px;
  }
}
</style>
