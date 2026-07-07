import * as XLSX from "xlsx";

export interface XlsxColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

export function exportToXlsx<T>(filename: string, rows: T[], columns: XlsxColumn<T>[]): void {
  const data = rows.map((row) =>
    Object.fromEntries(columns.map((c) => [c.header, c.value(row) ?? ""])),
  );

  const worksheet = XLSX.utils.json_to_sheet(data, { header: columns.map((c) => c.header) });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");
  XLSX.writeFile(workbook, filename);
}
