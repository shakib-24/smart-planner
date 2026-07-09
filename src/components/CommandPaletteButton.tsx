"use client";

export default function CommandPaletteButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
      aria-label={label}
      title={label}
      className="inline-flex h-9 items-center gap-1 rounded-md border px-2 text-xs hover:bg-accent"
    >
      <kbd className="font-sans">⌘K</kbd>
    </button>
  );
}
