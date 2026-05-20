const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Short room code for QR / guest join URL (no ambiguous O/0/I/1). */
export function generateRoomCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export function normalizeRoomCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}
