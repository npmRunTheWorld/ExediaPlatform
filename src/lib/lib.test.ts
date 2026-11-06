import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanPalette, extractPalette, paletteMatches, hexToRgb, rgbToHex } from './color.ts';
import { hasContentCredentials, sniffImageType } from './c2pa.ts';
import { docId, httpUrl, text, category, reportReason } from './validate.ts';

test('hex round trip', () => {
  assert.equal(rgbToHex(hexToRgb('#2340d9')), '#2340d9');
});

test('cleanPalette drops junk, dedupes and caps', () => {
  assert.deepEqual(cleanPalette(['#FFFFFF', '#ffffff', 'red', 5, '#000000"]{', '#123abc'], 6), ['#ffffff', '#123abc']);
  assert.deepEqual(cleanPalette('nope'), []);
  assert.equal(cleanPalette(Array(20).fill(0).map((_, i) => `#0000${String(i).padStart(2, '0')}`), 6).length, 6);
});

test('paletteMatches finds near colors only', () => {
  assert.ok(paletteMatches(['#d03a30'], '#d23b2f'));
  assert.ok(!paletteMatches(['#2f78c4'], '#d23b2f'));
  assert.ok(!paletteMatches(null, '#d23b2f'));
  assert.ok(!paletteMatches(['#d23b2f'], 'red'));
});

test('extractPalette picks the dominant, distinct colors', () => {
  const px = (r: number, g: number, b: number, n: number) => Array(n).fill([r, g, b, 255]).flat();
  const data = new Uint8ClampedArray([...px(200, 30, 30, 70), ...px(30, 30, 200, 25), ...px(201, 31, 31, 5), ...px(0, 0, 0, 0)]);
  const pal = extractPalette(data, 5);
  assert.equal(pal.length, 2);
  assert.ok(paletteMatches([pal[0]], '#c81e1e'));
});

test('C2PA marker detection', () => {
  const enc = (s: string) => [...s].map((c) => c.charCodeAt(0));
  const jpegWith = new Uint8Array([0xff, 0xd8, 0xff, 0xeb, ...enc('xxjumbyyc2pa')]);
  const pngWith = new Uint8Array([0x89, 0x50, 0x4e, 0x47, ...enc('....caBX....c2pa')]);
  const plain = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...enc('c2pa but no box')]);
  assert.ok(hasContentCredentials(jpegWith));
  assert.ok(hasContentCredentials(pngWith));
  assert.ok(!hasContentCredentials(plain));
});

test('image sniffing ignores the file name', () => {
  assert.equal(sniffImageType(new Uint8Array([0xff, 0xd8, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0])), 'image/jpeg');
  assert.equal(sniffImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0])), 'image/png');
  assert.equal(sniffImageType(new TextEncoder().encode('<svg onload=alert(1)>')), null);
});

test('docId blocks GROQ and patch path injection', () => {
  assert.equal(docId('pin-1a2b'), 'pin-1a2b');
  assert.equal(docId('108234987234'), '108234987234');
  assert.equal(docId('x"] || true'), null);
  assert.equal(docId('a'.repeat(129)), null);
  assert.equal(docId(42), null);
});

test('httpUrl only allows http and https', () => {
  assert.equal(httpUrl('https://example.com/a'), 'https://example.com/a');
  assert.equal(httpUrl('javascript:alert(1)'), null);
  assert.equal(httpUrl('not a url'), null);
  assert.equal(httpUrl(''), null);
});

test('text trims, caps and strips control characters', () => {
  assert.equal(text('  hi\u0000 there  ', 100), 'hi there');
  assert.equal(text('abcdef', 3), 'abc');
  assert.equal(text(null, 3), '');
});

test('category and report reason allow lists', () => {
  assert.equal(category('Painting'), 'painting');
  assert.equal(category('weapons'), null);
  assert.equal(reportReason('ai-undeclared'), 'ai-undeclared');
  assert.equal(reportReason('__proto__'), null);
});
