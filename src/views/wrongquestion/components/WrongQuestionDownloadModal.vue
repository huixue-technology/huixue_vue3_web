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
            <a-col :span="8"><a-checkbox value="questionsId">题目</a-checkbox></a-col>
            <a-col :span="8"><a-checkbox value="answer">答案</a-checkbox></a-col>
            <a-col :span="8"><a-checkbox value="analysis">解析</a-checkbox></a-col>
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
import { reactive, ref } from "vue";
import { message } from "ant-design-vue";
import { postWrongQuestionDownload } from "@/servers/api/wrongQuestion";

type WrongQuestionRecord = Record<string, any>;

const props = defineProps<{
  open: boolean;
  studentId?: string;
  total: number;
  questionList?: WrongQuestionRecord[];
  queryParams?: Record<string, any>;
}>();

const emit = defineEmits<{
  (e: "update:open", val: boolean): void;
  (e: "download-success", questionIds: number[]): void;
}>();

const downloading = ref(false);

const form = reactive({
  includes: ["questionsId", "answer", "analysis"] as string[],
});

function numberId(value: unknown): number | undefined {
  const num = Number(String(value ?? "").trim());
  return Number.isInteger(num) && num > 0 ? num : undefined;
}

function extractQuestionIds(list: WrongQuestionRecord[]) {
  const ids = list
    .map((item) => numberId(item.question_id ?? item.test_question_id))
    .filter((id): id is number => id !== undefined);
  return Array.from(new Set(ids));
}

function getResponseHeader(response: any, name: string) {
  return response?.headers?.get?.(name) || response?.headers?.[name] || response?.headers?.[name.toLowerCase()] || "";
}

function decodeFilename(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function filenameFromDisposition(disposition: string) {
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeFilename(utf8Match[1].replace(/["']/g, ""));
  const normalMatch = disposition.match(/filename="?([^"]+)"?/i);
  return normalMatch?.[1] ? decodeFilename(normalMatch[1]) : "";
}

function extensionFromType(type: string) {
  if (type.includes("wordprocessingml.document")) return "docx";
  if (type.includes("pdf")) return "pdf";
  if (type.includes("zip")) return "zip";
  return "pdf";
}

function downloadBlob(blob: Blob, filename?: string) {
  const date = new Date().toLocaleDateString("zh-CN").replace(/\//g, "");
  const safeFilename = filename || `错题_${date}.${extensionFromType(blob.type)}`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safeFilename;
  a.click();
  URL.revokeObjectURL(url);
}

async function readBackendError(blob: Blob) {
  if (!blob.type.includes("json") && !blob.type.includes("text")) return "";
  try {
    const data = JSON.parse(await blob.text());
    return data?.msg || data?.message || data?.detail || "";
  } catch {
    return "";
  }
}

async function resolveDownloadError(error: any) {
  const data = error?.data;
  if (data instanceof Blob) {
    const backendMessage = await readBackendError(data);
    if (backendMessage) return backendMessage;
  }
  if (typeof data === "string") return data;
  if (data && typeof data === "object") return data.msg || data.message || data.detail || "";

  const response = error?.response;
  if (response?.clone) {
    try {
      const contentType = response.headers?.get?.("content-type") || "";
      if (contentType.includes("json")) {
        const json = await response.clone().json();
        return json?.msg || json?.message || json?.detail || "";
      }
      const responseText = await response.clone().text();
      if (responseText) return responseText;
    } catch {}
  }

  return error?.message || "";
}

async function handleDownload() {
  if (!props.total) {
    message.warning("当前无题目可下载，请先选择题目");
    return;
  }

  const list = props.questionList ?? [];
  if (!list.length) {
    message.warning("题目数据未加载，请先选择题目");
    return;
  }

  const questionIds = extractQuestionIds(list);
  if (!questionIds.length) {
    message.warning("当前题目缺少 question_id，无法调用后端下载接口");
    return;
  }
  if (questionIds.length < list.length) {
    message.warning(`有 ${list.length - questionIds.length} 道题缺少 question_id，本次只下载可识别的题目`);
  }

  downloading.value = true;
  try {
    const studentId = String(props.studentId ?? "").trim();
    const payload: API.WrongQuestionDownload = {
      question_ids: questionIds,
      is_need_answer: form.includes.includes("answer"),
      is_need_analysis: form.includes.includes("analysis"),
    };
    if (studentId) payload.student_id = studentId;

    const result: any = await postWrongQuestionDownload(
      payload,
      { responseType: "blob", getResponse: true }
    );
    const response: Response | undefined = result?.response;
    let blob: Blob;

    if (result?.data instanceof Blob) {
      blob = result.data;
    } else if (response?.blob) {
      blob = await response.blob();
    } else if (result instanceof Blob) {
      blob = result;
    } else {
      message.error("下载响应异常，无法获取文件数据");
      return;
    }

    const backendError = await readBackendError(blob);
    if (backendError) throw new Error(backendError);

    const filename = filenameFromDisposition(getResponseHeader(response, "content-disposition"));
    downloadBlob(blob, filename);
    message.success("下载成功");
    emit("download-success", questionIds);
    emit("update:open", false);
  } catch (error) {
    console.error("错题下载失败:", error);
    const errorText = await resolveDownloadError(error);
    message.error(errorText || "下载失败，请重试");
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
