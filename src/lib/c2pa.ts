// Detects whether an image file carries a C2PA manifest (Content Credentials).
//
// C2PA keeps its manifest in a JUMBF box: APP11 segments in JPEG, a caBX chunk
// in PNG, a C2PA chunk in WebP. All of them hold a JUMBF description labelled
// "c2pa". This only checks for that marker and does not validate the signature,
// so the UI says "attached", never "verified". Full validation with the c2pa
// SDK is a follow-up.

function indexOf(haystack: Uint8Array, needle: number[], from = 0): number {
  outer: for (let i = from; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return i;
  }
  return -1;
}

const JUMB = [0x6a, 0x75, 0x6d, 0x62]; // "jumb"
const C2PA = [0x63, 0x32, 0x70, 0x61]; // "c2pa"
const CABX = [0x63, 0x61, 0x42, 0x58]; // "caBX" PNG chunk type

export function hasContentCredentials(bytes: Uint8Array): boolean {
  const jumb = indexOf(bytes, JUMB);
  if (jumb !== -1 && indexOf(bytes, C2PA, jumb) !== -1) return true;
  const cabx = indexOf(bytes, CABX);
  return cabx !== -1 && indexOf(bytes, C2PA, cabx) !== -1;
}

// Checks the first bytes so a renamed file can't pose as an image.
export function sniffImageType(bytes: Uint8Array): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'image/gif';
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return 'image/webp';
  return null;
}
