export type QuestionGroup = { is_context?: boolean; sub_questions?: QuestionGroup[] };

export function flattenQuestionGroups<T extends QuestionGroup>(groups: T[]): T[] {
  const records: T[] = [];
  const pending = [...groups];
  while (pending.length) {
    const record = pending.shift() as T;
    records.push(record);
    pending.unshift(...((record.sub_questions || []) as T[]));
  }
  return records;
}
