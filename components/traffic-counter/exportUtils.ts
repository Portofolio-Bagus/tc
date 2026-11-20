import { Session, Intersection, SubVehicle, DirectionCount } from "./types";
import {
  formatDateIndonesian,
  getIntervalTimeLabel,
  getAllVehicles,
} from "./helpers";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";
import * as XLSX from "xlsx";

function buildSimpangSheet(
  XLSX: any,
  session: Session,
  intersection: Intersection,
) {
  const rows: any[][] = [];
  let r = 0;

  rows.push([
    `Nama Surveyor : ${session.observer}                          Cuaca : ${session.weather}`,
  ]);
  r++;
  rows.push([
    `Hari, Tanggal : ${formatDateIndonesian(session.startTime)}                          Arah Arus : ${session.flowDirections}`,
  ]);
  r++;
  rows.push([
    `Jalan : ${session.roadName}                          Pendekat : ${intersection.pendekat}`,
  ]);
  r++;
  rows.push([""]);
  r++;

  const interData = session.data[intersection.id] || {};
  const totalInterval = session.totalIntervals || 0;
  const catOrder = session.categories;

  const colMap: {
    catIndex: number;
    vehicleIndex: number;
    vehicle: SubVehicle;
  }[] = [];
  for (let ci = 0; ci < catOrder.length; ci++) {
    const v = catOrder[ci].vehicles;
    for (let vi = 0; vi < v.length; vi++) {
      colMap.push({ catIndex: ci, vehicleIndex: vi, vehicle: v[vi] });
    }
  }

  const totalCols = 1 + colMap.length * 3;

  const groupHeaderRow = r;
  const groupRow: any[] = ["Waktu"];
  for (let ci = 0; ci < catOrder.length; ci++) {
    const vLen = catOrder[ci].vehicles.length * 3;
    for (let vi = 0; vi < vLen; vi++) {
      if (vi === 0) groupRow.push(catOrder[ci].name);
      else groupRow.push("");
    }
  }
  rows.push(groupRow);
  r++;

  const subHeaderRow = r;
  const subRow: any[] = [""];
  for (const col of colMap) {
    subRow.push(col.vehicle.name, "", "");
  }
  rows.push(subRow);
  r++;

  const dirRow: any[] = [""];
  for (const col of colMap) {
    dirRow.push("Masuk Kiri", "Lurus", "Masuk Kanan");
  }
  rows.push(dirRow);
  r++;

  for (let i = 0; i < totalInterval; i++) {
    const intervalData = interData[String(i)] || {};
    const timeLabel = getIntervalTimeLabel(
      session.startTime,
      i,
      session.intervalMinutes,
    );
    const row: any[] = [timeLabel];

    for (const col of colMap) {
      const count = (intervalData[col.vehicle.id] as DirectionCount) || {
        left: 0,
        straight: 0,
        right: 0,
      };
      row.push(count.left, count.straight, count.right);
    }

    rows.push(row);
    r++;
  }

  const totalRow: any[] = ["Total"];
  for (const col of colMap) {
    let tl = 0,
      ts = 0,
      tr = 0;
    for (let i = 0; i < totalInterval; i++) {
      const intervalData = interData[String(i)] || {};
      const count = (intervalData[col.vehicle.id] as DirectionCount) || {
        left: 0,
        straight: 0,
        right: 0,
      };
      tl += count.left;
      ts += count.straight;
      tr += count.right;
    }
    totalRow.push(tl, ts, tr);
  }
  rows.push(totalRow);
  r++;

  rows.push([""]);
  r++;
  rows.push([""]);
  r++;

  const profilHeaderRow = r;
  rows.push(["Profil Ruas Jalan"]);
  r++;

  const profilTableRow = r;
  rows.push([
    "Nama Ruas Jalan",
    "",
    "Lebar Jalan (m)",
    "",
    "Median Jalan (m)",
    "",
    "Trotoar (m)",
    "",
    "Saluran Air (m)",
  ]);
  r++;

  rows.push([""]);
  r++;
  rows.push(["*lampirkan foto ruas jalan horizontal"]);
  r++;
  rows.push([""]);
  r++;
  rows.push([""]);
  r++;

  const ketersediaanHeaderRow = r;
  rows.push(["Ketersediaan Angkutan Umum"]);
  r++;

  const ketersediaanTableRow = r;
  rows.push([
    "Jurusan Angkutan Umum",
    "",
    "",
    "Kapasitas",
    "Rata2 jml angkot/jam",
    "",
    "Rata2 jml penumpang/jam",
  ]);
  r++;

  rows.push([""]);
  r++;
  rows.push([
    "*jumlah angkutan umum dari awal mulai traffic counting - selesai",
  ]);
  r++;
  rows.push(["*lampirkan foto angkutan umum"]);
  r++;

  const ws = XLSX.utils.aoa_to_sheet(rows);

  const merges: any[] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: totalCols - 1 } },
  ];

  let colCursor = 1;
  for (let ci = 0; ci < catOrder.length; ci++) {
    const vLen = catOrder[ci].vehicles.length * 3;
    if (vLen > 1) {
      merges.push({
        s: { r: groupHeaderRow, c: colCursor },
        e: { r: groupHeaderRow, c: colCursor + vLen - 1 },
      });
    }
    for (let vi = 0; vi < catOrder[ci].vehicles.length; vi++) {
      merges.push({
        s: { r: subHeaderRow, c: colCursor },
        e: { r: subHeaderRow, c: colCursor + 2 },
      });
      colCursor += 3;
    }
  }

  merges.push(
    { s: { r: profilHeaderRow, c: 0 }, e: { r: profilHeaderRow, c: 8 } },
    { s: { r: profilTableRow, c: 1 }, e: { r: profilTableRow, c: 2 } },
    { s: { r: profilTableRow, c: 3 }, e: { r: profilTableRow, c: 4 } },
    { s: { r: profilTableRow, c: 5 }, e: { r: profilTableRow, c: 6 } },
    { s: { r: profilTableRow, c: 7 }, e: { r: profilTableRow, c: 8 } },
    {
      s: { r: ketersediaanHeaderRow, c: 0 },
      e: { r: ketersediaanHeaderRow, c: 6 },
    },
    {
      s: { r: ketersediaanTableRow, c: 1 },
      e: { r: ketersediaanTableRow, c: 2 },
    },
    {
      s: { r: ketersediaanTableRow, c: 4 },
      e: { r: ketersediaanTableRow, c: 5 },
    },
    {
      s: { r: ketersediaanTableRow, c: 6 },
      e: { r: ketersediaanTableRow, c: 6 },
    },
  );

  ws["!merges"] = merges;

  const cols: any[] = [{ wch: 14 }];
  for (let i = 0; i < colMap.length * 3; i++) {
    cols.push({ wch: 8 });
  }
  ws["!cols"] = cols;

  return ws;
}

function buildRuasSheet(
  XLSX: any,
  session: Session,
  intersection: Intersection,
) {
  const rows: any[][] = [];
  let r = 0;

  rows.push([
    `Nama Surveyor : ${session.observer}                          Jalan : ${session.roadName}`,
  ]);
  r++;
  rows.push([
    `Hari, Tanggal : ${formatDateIndonesian(session.startTime)}                          Cuaca : ${session.weather}`,
  ]);
  r++;
  rows.push([`Arah Arus : ${session.flowDirections}`]);
  r++;
  rows.push([""]);
  r++;

  const allVehicles = getAllVehicles(session.categories);
  const catOrder = session.categories;

  const groupHeaderRow = r;
  const groupRow: any[] = ["Waktu"];
  for (let ci = 0; ci < catOrder.length; ci++) {
    const vLen = catOrder[ci].vehicles.length;
    for (let vi = 0; vi < vLen; vi++) {
      if (vi === 0) groupRow.push(catOrder[ci].name);
      else groupRow.push("");
    }
  }
  rows.push(groupRow);
  r++;

  const subHeaderRow = r;
  const subRow: any[] = [""];
  for (const v of allVehicles) {
    subRow.push(v.name);
  }
  rows.push(subRow);
  r++;

  const interData = session.data[intersection.id] || {};
  const totalInterval = session.totalIntervals || 0;

  for (let i = 0; i < totalInterval; i++) {
    const intervalData = interData[String(i)] || {};
    const timeLabel = getIntervalTimeLabel(
      session.startTime,
      i,
      session.intervalMinutes,
    );
    const row: any[] = [timeLabel];
    for (const v of allVehicles) {
      row.push((intervalData[v.id] as number) || 0);
    }
    rows.push(row);
    r++;
  }

  const totalRow: any[] = ["Total"];
  for (const v of allVehicles) {
    let sum = 0;
    for (let i = 0; i < totalInterval; i++) {
      sum += ((interData[String(i)] || {})[v.id] as number) || 0;
    }
    totalRow.push(sum);
  }
  rows.push(totalRow);
  r++;

  rows.push([""]);
  r++;
  rows.push(["*lampirkan foto kondisi lalu lintas saat jam puncak"]);
  r++;
  rows.push([
    "*lampirkan juga foto surveyor saat sedang melakukan traffic counting",
  ]);
  r++;
  rows.push([""]);
  r++;

  const profilHeaderRow = r;
  rows.push(["Profil Ruas Jalan"]);
  r++;

  const profilTableRow = r;
  rows.push([
    "Nama Ruas Jalan",
    "",
    "Lebar Jalan (m)",
    "",
    "Median Jalan (m)",
    "",
    "Trotoar (m)",
    "",
    "Saluran Air (m)",
  ]);
  r++;

  rows.push([""]);
  r++;
  rows.push(["*lampirkan foto ruas jalan"]);
  r++;
  rows.push([""]);
  r++;

  const ketersediaanHeaderRow = r;
  rows.push(["Ketersediaan Angkutan Umum"]);
  r++;

  const ketersediaanTableRow = r;
  rows.push(["Jurusan Angkutan Umum", "", "Jumlah"]);
  r++;

  rows.push([""]);
  r++;
  rows.push([
    "*jumlah angkutan umum dari awal mulai traffic counting - selesai",
  ]);
  r++;
  rows.push(["*lampirkan foto angkutan umum"]);
  r++;

  const ws = XLSX.utils.aoa_to_sheet(rows);

  const totalCols = 1 + allVehicles.length;
  const merges: any[] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: totalCols - 1 } },
  ];

  let colCursor = 1;
  for (let ci = 0; ci < catOrder.length; ci++) {
    const vLen = catOrder[ci].vehicles.length;
    if (vLen > 1) {
      merges.push({
        s: { r: groupHeaderRow, c: colCursor },
        e: { r: groupHeaderRow, c: colCursor + vLen - 1 },
      });
    }
    colCursor += vLen;
  }

  merges.push(
    { s: { r: profilHeaderRow, c: 0 }, e: { r: profilHeaderRow, c: 8 } },
    { s: { r: profilTableRow, c: 1 }, e: { r: profilTableRow, c: 2 } },
    { s: { r: profilTableRow, c: 3 }, e: { r: profilTableRow, c: 4 } },
    { s: { r: profilTableRow, c: 5 }, e: { r: profilTableRow, c: 6 } },
    { s: { r: profilTableRow, c: 7 }, e: { r: profilTableRow, c: 8 } },
    {
      s: { r: ketersediaanHeaderRow, c: 0 },
      e: { r: ketersediaanHeaderRow, c: 2 },
    },
    {
      s: { r: ketersediaanTableRow, c: 1 },
      e: { r: ketersediaanTableRow, c: 2 },
    },
  );

  ws["!merges"] = merges;

  const cols: any[] = [{ wch: 14 }];
  for (let i = 0; i < allVehicles.length; i++) {
    cols.push({ wch: 10 });
  }
  ws["!cols"] = cols;

  return ws;
}

export function buildDokumentasiSheet(XLSX: any, session: Session) {
  const rows: any[][] = [];
  const dayName = formatDateIndonesian(session.startTime).split(",")[0];

  rows.push(["KONDISI LALU LINTAS"]);
  rows.push([dayName]);
  rows.push(["PAGI", "SIANG", "SORE", "MALAM"]);
  rows.push(["", "", "", ""]);
  rows.push([""]);
  rows.push(["ANGKUTAN UMUM/ELF/BIS"]);
  rows.push([""]);
  rows.push(["RUAS JALAN"]);
  rows.push([""]);
  rows.push(["RAMBU / PENERANGAN JALAN"]);
  rows.push([""]);
  rows.push(["SURVEYOR"]);
  rows.push(["PAGI", "SIANG", "SORE", "MALAM"]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  return ws;
}

export async function handleExportXLSX(
  session: Session,
) {
  const wb = XLSX.utils.book_new();

  for (const intersection of session.intersections) {
    let ws;
    if (session.surveyType === "ruas") {
      ws = buildRuasSheet(XLSX, session, intersection);
    } else {
      ws = buildSimpangSheet(XLSX, session, intersection);
    }
    const prefix = session.surveyType === "ruas" ? "Ruas " : "Simpang ";
    const sheetName = (prefix + intersection.name).slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  const dokWs = buildDokumentasiSheet(XLSX, session);
  XLSX.utils.book_append_sheet(wb, dokWs, "Dokumentasi");

  const sessionName = session.name
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, "_");
  const fileName = `Survei_${sessionName || "Survei"}_${new Date().toISOString().slice(0, 10)}.xlsx`;

  if (Capacitor.isNativePlatform()) {
    const base64 = XLSX.write(wb, { bookType: "xlsx", type: "base64" });

    const result = await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Cache,
    });

    await Share.share({
      title: `Export ${session.name}`,
      files: [result.uri],
      dialogTitle: "Simpan atau bagikan file XLSX",
    });
  } else {
    XLSX.writeFile(wb, fileName);
  }
}
