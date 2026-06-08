"use client";

import { QRCodeSVG } from "qrcode.react";

export function QrCode({ value, size = 112 }: { value: string; size?: number }) {
  return (
    <div className="inline-flex rounded-md bg-white p-2">
      <QRCodeSVG value={value} size={size} marginSize={1} />
    </div>
  );
}
