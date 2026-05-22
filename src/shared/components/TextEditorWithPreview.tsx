type TextEditorWithPreviewProps = {
  label: string;
  onChange: (value: string) => void;
  previewLabel?: string;
  value: string;
};

export function TextEditorWithPreview({
  label,
  onChange,
  previewLabel = "미리보기",
  value
}: TextEditorWithPreviewProps) {
  return (
    <div className="grid min-w-0 gap-4 min-[1700px]:grid-cols-2">
      <label className="min-w-0">
        <span className="text-sm font-medium text-zinc-800">{label}</span>
        <textarea
          className="mt-2 min-h-56 w-full resize-y rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm leading-6 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-blue-500"
          onChange={(event) => onChange(event.target.value)}
          value={value}
        />
      </label>

      <section
        aria-label={previewLabel}
        className="min-h-56 min-w-0 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3"
      >
        <p className="text-sm font-medium text-zinc-800">{previewLabel}</p>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-700">
          {value}
        </p>
      </section>
    </div>
  );
}
