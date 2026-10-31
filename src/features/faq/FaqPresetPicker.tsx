"use client";

import { unusedPresets } from "./presets";

/** "Common questions": tap one to add it to the list (answer typed by the couple). */
export function FaqPresetPicker({ questions, onAdd, disabled, full }: { questions: string[]; onAdd: (question: string) => void; disabled?: boolean; full?: boolean }) {
  const left = unusedPresets(questions);
  if (left.length === 0 || full) return null;
  return (
    <div className="rounded-2xl bg-blush p-3 sm:p-4" data-faq-presets>
      <p className="text-sm font-semibold">Common questions</p>
      <p className="text-xs text-mute">Tap to add, then type your answer.</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {left.map((p) => (
          <li key={p.question}>
            <button type="button" disabled={disabled} onClick={() => onAdd(p.question)}
              className="rounded-full border border-pink/40 bg-white px-3 py-1.5 text-left text-sm hover:border-pink-dark hover:bg-tint disabled:opacity-60">
              <span aria-hidden="true" className="mr-1 text-pink-dark">+</span>{p.question}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
