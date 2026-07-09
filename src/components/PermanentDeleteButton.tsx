"use client";

import { useTranslations } from "next-intl";
import { permanentlyDeleteTask } from "@/app/actions/tasks";

export default function PermanentDeleteButton({ taskId }: { taskId: string }) {
  const t = useTranslations("tasks");

  return (
    <button
      type="button"
      onClick={() => {
        if (confirm(t("confirmPermanentDelete"))) {
          permanentlyDeleteTask(taskId);
        }
      }}
      className="text-red-500 text-sm hover:underline"
    >
      {t("permanentDelete")}
    </button>
  );
}
