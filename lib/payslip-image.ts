import { createCanvas, SKRSContext2D } from "@napi-rs/canvas";

export interface PayslipData {
  name: string;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
  salaryType: "weekly" | "daily";
  baseAmount: number;
  workDaysCount: number | null;
  overtimeCount: number;
  overtimeAmount: number;
  kasbonDeduction: number;
  totalAmount: number;
}

function formatRupiah(n: number): string {
  return `Rp${Math.round(n).toLocaleString("id-ID")}`;
}

function formatDate(d: string): string {
  return new Date(`${d}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function roundRect(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function generatePayslipImage(data: PayslipData): Promise<Buffer> {
  const width = 640;
  const height = 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // background
  ctx.fillStyle = "#f4f4f5";
  ctx.fillRect(0, 0, width, height);

  const pad = 28;
  const cardX = pad;
  const cardY = pad;
  const cardW = width - pad * 2;
  const cardH = height - pad * 2;

  ctx.fillStyle = "#ffffff";
  roundRect(ctx, cardX, cardY, cardW, cardH, 20);
  ctx.fill();
  ctx.strokeStyle = "#e4e4e7";
  ctx.lineWidth = 1;
  roundRect(ctx, cardX, cardY, cardW, cardH, 20);
  ctx.stroke();

  const left = cardX + 36;
  const right = cardX + cardW - 36;
  let y = cardY + 56;

  ctx.fillStyle = "#18181b";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText("Slip Gaji", left, y);

  y += 30;
  ctx.font = "18px sans-serif";
  ctx.fillStyle = "#3f3f46";
  ctx.fillText(data.name, left, y);

  y += 24;
  ctx.font = "13px sans-serif";
  ctx.fillStyle = "#a1a1aa";
  ctx.fillText(
    `Periode ${formatDate(data.periodStart)} - ${formatDate(data.periodEnd)}`,
    left,
    y,
  );

  y += 30;
  ctx.strokeStyle = "#e4e4e7";
  ctx.beginPath();
  ctx.moveTo(left, y);
  ctx.lineTo(right, y);
  ctx.stroke();

  y += 36;

  const row = (label: string, value: string, opts?: { bold?: boolean; color?: string }) => {
    ctx.font = "15px sans-serif";
    ctx.fillStyle = "#52525b";
    ctx.fillText(label, left, y);

    ctx.font = opts?.bold ? "bold 15px sans-serif" : "15px sans-serif";
    ctx.fillStyle = opts?.color ?? "#18181b";
    ctx.textAlign = "right";
    ctx.fillText(value, right, y);
    ctx.textAlign = "left";

    y += 30;
  };

  if (data.salaryType === "weekly") {
    row("Gaji Mingguan", formatRupiah(data.baseAmount));
  } else {
    row(`Gaji Harian (${data.workDaysCount ?? 0} hari kerja)`, formatRupiah(data.baseAmount));
  }

  row(`Lembur (${data.overtimeCount}x)`, `+ ${formatRupiah(data.overtimeAmount)}`, {
    color: "#059669",
  });

  if (data.kasbonDeduction > 0) {
    row("Potongan Kasbon", `- ${formatRupiah(data.kasbonDeduction)}`, { color: "#dc2626" });
  }

  y += 8;
  ctx.strokeStyle = "#e4e4e7";
  ctx.beginPath();
  ctx.moveTo(left, y);
  ctx.lineTo(right, y);
  ctx.stroke();

  y += 42;
  ctx.font = "16px sans-serif";
  ctx.fillStyle = "#3f3f46";
  ctx.fillText("Total diterima", left, y);

  ctx.font = "bold 28px sans-serif";
  ctx.fillStyle = "#059669";
  ctx.textAlign = "right";
  ctx.fillText(formatRupiah(data.totalAmount), right, y);
  ctx.textAlign = "left";

  return canvas.encode("png");
}