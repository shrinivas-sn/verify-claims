export interface Claim {
  command: string;
  claimText: string;
  line: number;
}

const CLAIM_COMMENT = /^<!--\s*claim:\s*(.+?)\s*-->$/;
const FENCE = /^(`{3,}|~{3,})/;
// Four spaces or a tab starts an indented code block in CommonMark: example text, never a claim.
const INDENTED = /^( {4}|\t)/;

export function parseClaims(markdown: string): Claim[] {
  const lines = markdown.split(/\r\n|\n/);
  const claims: Claim[] = [];
  let openFence = ""; // the ``` or ~~~ run that opened the current fence; "" when outside one

  for (let i = 0; i < lines.length; i++) {
    if (INDENTED.test(lines[i])) continue;
    const trimmed = lines[i].trim();
    const fence = trimmed.match(FENCE)?.[1];

    if (openFence) {
      // CommonMark: only a bare run of the same character, at least as long, closes a fence.
      if (fence && fence[0] === openFence[0] && fence.length >= openFence.length && trimmed === fence) {
        openFence = "";
      }
      continue;
    }
    if (fence) {
      openFence = fence;
      continue;
    }

    const match = trimmed.match(CLAIM_COMMENT);
    if (!match) continue;

    let claimText = "";
    for (let j = i + 1; j < lines.length; j++) {
      const next = lines[j].trim();
      // Several commands stacked above one statement all prove that statement.
      if (next === "" || CLAIM_COMMENT.test(next)) continue;
      claimText = next;
      break;
    }

    claims.push({ command: match[1], claimText, line: i + 1 });
  }

  return claims;
}
