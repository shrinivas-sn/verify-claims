export interface Claim {
  command: string;
  claimText: string;
  line: number;
}

const CLAIM_COMMENT = /^<!--\s*claim:\s*(.+?)\s*-->$/;
const FENCE = /^(```|~~~)/;

export function parseClaims(markdown: string): Claim[] {
  const lines = markdown.split(/\r\n|\n/);
  const claims: Claim[] = [];
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (FENCE.test(trimmed)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = trimmed.match(CLAIM_COMMENT);
    if (!match) continue;

    let claimText = "";
    for (let j = i + 1; j < lines.length; j++) {
      const next = lines[j].trim();
      if (next !== "") {
        claimText = next;
        break;
      }
    }

    claims.push({ command: match[1], claimText, line: i + 1 });
  }

  return claims;
}
