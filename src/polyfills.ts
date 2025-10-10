/* MUST be the first thing imported in the app before anything else */

// Adds crypto.getRandomValues on RN
import 'react-native-get-random-values';

// Provides TextEncoder/TextDecoder
import 'fast-text-encoding';

// Optional but useful for libs that expect Buffer
import { Buffer } from 'buffer';

const g: any = (globalThis ?? global ?? window);

// TextEncoder/TextDecoder (Hermes doesn't have them)
try {
  const { TextEncoder, TextDecoder } = require('fast-text-encoding');
  if (!g.TextEncoder) g.TextEncoder = TextEncoder;
  if (!g.TextDecoder) g.TextDecoder = TextDecoder;
} catch { /* ignore */ }

// crypto.getRandomValues (react-native-get-random-values sets window.crypto;
// but we also mirror it on globalThis to be safe)
if (!g.crypto) g.crypto = {};
if (typeof g.crypto.getRandomValues !== 'function') {
  try {
    const { getRandomValues } = require('react-native-get-random-values');
    g.crypto.getRandomValues = getRandomValues;
  } catch { /* ignore */ }
}

// Buffer (some libs expect it)
if (!g.Buffer) g.Buffer = Buffer;
