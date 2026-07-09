"use client";

import { useState, type KeyboardEvent, type ChangeEvent } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

export default function TagInput({
  name = "tags",
  defaultTags = [],
  suggestions = [],
}: {
  name?: string;
  defaultTags?: string[];
  suggestions?: string[];
}) {
  const t = useTranslations("tasks");
  const [tags, setTags] = useState<string[]>(defaultTags);
  const [input, setInput] = useState("");

  function addTag(raw: string) {
    const cleaned = raw.trim();
    if (!cleaned) return;
    setTags((prev) => (prev.includes(cleaned) ? prev : [...prev, cleaned]));
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((existing) => existing !== tag));
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (val.includes(",")) {
      const parts = val.split(",");
      const last = parts.pop() ?? "";
      parts.forEach(addTag);
      setInput(last);
    } else {
      setInput(val);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(input);
      setInput("");
    } else if (e.key === "Backspace" && input === "" && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

  function handleBlur() {
    if (input.trim()) {
      addTag(input);
      setInput("");
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(tags)} readOnly />
      <div className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-foreground"
              aria-label={`remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          list="tag-suggestions"
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={t("tagsPlaceholder")}
          className="min-w-[100px] flex-1 border-none bg-transparent text-sm outline-none"
        />
      </div>
      <datalist id="tag-suggestions">
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  );
}
