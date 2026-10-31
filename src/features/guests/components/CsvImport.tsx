"use client";

import { useState, useTransition } from "react";
import { Alert, Button, Modal } from "@/components/ui";
import type { CsvImportResult, CsvRowError } from "@/lib/api/types";
import { importGuestsAction } from "../actions";

const TEMPLATE = "full_name,email,phone,group,max_plus_ones,notes,rsvp_status,plus_one_count,message\nAsha Menon,asha@example.com,+91 98450 12345,Family,1,,attending,1,\n";

/**
 * Two-step import: "Check file" validates every row (nothing saved); "Import" commits only if the file is
 * clean. Any invalid row blocks the whole import, so nothing is half-imported.
 */
export function CsvImport({ weddingId, open, onClose }: { weddingId: string; open: boolean; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [duplicates, setDuplicates] = useState<"skip" | "update">("skip");
  const [check, setCheck] = useState<CsvImportResult | null>(null);
  const [rowErrors, setRowErrors] = useState<CsvRowError[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState<CsvImportResult | null>(null);
  const [pending, start] = useTransition();

  const reset = () => { setCheck(null); setRowErrors([]); setMessage(null); setDone(null); };

  const send = (dryRun: boolean) => start(async () => {
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    fd.set("dryRun", String(dryRun));
    fd.set("duplicates", duplicates);
    const result = await importGuestsAction(weddingId, fd);
    if (result.ok) {
      setRowErrors([]); setMessage(null);
      if (dryRun) setCheck(result.data); else setDone(result.data);
    } else {
      setCheck(null);
      setMessage(result.error.message);
      setRowErrors(Array.isArray(result.error.details?.rowErrors) ? (result.error.details.rowErrors as CsvRowError[]) : []);
    }
  });

  const templateHref = `data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`;

  return (
    <Modal open={open} onClose={() => { reset(); setFile(null); onClose(); }} title="Import guests from CSV" wide>
      {done ? (
        <div className="space-y-4">
          <Alert tone="success" title="Import complete">
            {done.toCreate} added · {done.toUpdate} updated · {done.skippedDuplicates} duplicates skipped.
          </Alert>
          <div className="flex justify-end"><Button onClick={() => { reset(); setFile(null); onClose(); }}>Done</Button></div>
        </div>
      ) : (
        <div className="space-y-5 text-sm">
          <p className="text-mute">
            Use a UTF-8 CSV with a header row. Only <code>full_name</code> is required. Columns: full_name, email, phone, group,
            max_plus_ones, notes, rsvp_status (attending, not_attending, undecided, pending), plus_one_count, message.{" "}
            <a href={templateHref} download="olava-guest-template.csv" className="font-semibold text-pink-dark underline">Download a template</a>.
          </p>
          <div>
            <label htmlFor="csv-file" className="mb-1.5 block font-semibold">CSV file (max 1 MB, 2,000 rows)</label>
            <input id="csv-file" type="file" accept=".csv,text/csv" onChange={(e) => { setFile(e.target.files?.[0] ?? null); reset(); }}
              className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-tint file:px-4 file:py-2 file:font-semibold" />
          </div>
          <fieldset>
            <legend className="mb-1.5 font-semibold">If a guest already exists (same email or phone)</legend>
            <div className="flex flex-wrap gap-4">
              {(["skip", "update"] as const).map((v) => (
                <label key={v} className="flex items-center gap-2">
                  <input type="radio" name="duplicates" value={v} checked={duplicates === v} onChange={() => { setDuplicates(v); reset(); }} className="accent-pink-dark" />
                  {v === "skip" ? "Skip it (keep my existing details)" : "Update it with the file's details"}
                </label>
              ))}
            </div>
          </fieldset>

          {message ? (
            <Alert tone="error" title={message}>
              {rowErrors.length ? (
                <ul className="mt-2 max-h-56 list-disc space-y-0.5 overflow-y-auto pl-5">
                  {rowErrors.map((e, i) => <li key={i}>{e.row > 0 ? `Row ${e.row}` : "File"}{e.column ? ` (${e.column})` : ""}: {e.message}</li>)}
                </ul>
              ) : null}
            </Alert>
          ) : null}
          {check ? (
            <Alert tone="success" title="File looks good">
              {check.totalRows} rows · {check.toCreate} new · {check.toUpdate} to update · {check.skippedDuplicates} duplicates skipped. Nothing has been saved yet.
            </Alert>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => send(true)} disabled={!file} loading={pending && !check}>Check file</Button>
            <Button onClick={() => send(false)} disabled={!check || pending} loading={pending && Boolean(check)}>Import {check ? check.toCreate + check.toUpdate : ""} guests</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
