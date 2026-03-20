import { describe, it, expect } from 'vitest';
import { escapeHtml, stripHtml, sanitizeText, sanitizeFields } from '@/lib/sanitize';

describe('escapeHtml', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
    );
  });

  it('escapes ampersands', () => {
    expect(escapeHtml('foo & bar')).toBe('foo &amp; bar');
  });

  it('escapes backticks and single quotes', () => {
    expect(escapeHtml("`test'value`")).toBe('&#96;test&#x27;value&#96;');
  });

  it('returns empty string unchanged', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('returns safe string unchanged', () => {
    expect(escapeHtml('Hello World 123')).toBe('Hello World 123');
  });
});

describe('stripHtml', () => {
  it('removes HTML tags', () => {
    expect(stripHtml('<b>bold</b> text')).toBe('bold text');
  });

  it('removes nested tags', () => {
    expect(stripHtml('<div><p>nested</p></div>')).toBe('nested');
  });

  it('removes script tags', () => {
    expect(stripHtml('<script>alert(1)</script>clean')).toBe('alert(1)clean');
  });
});

describe('sanitizeText', () => {
  it('returns null for null', () => {
    expect(sanitizeText(null)).toBeNull();
  });

  it('returns undefined for undefined', () => {
    expect(sanitizeText(undefined)).toBeUndefined();
  });

  it('trims whitespace, strips HTML, and escapes', () => {
    expect(sanitizeText('  <b>test</b> & value  ')).toBe('test &amp; value');
  });
});

describe('sanitizeFields', () => {
  it('sanitizes specified fields only', () => {
    const input = { name: '<b>John</b>', age: 30, notes: '<script>x</script>' };
    const result = sanitizeFields(input, ['name' as keyof typeof input]);
    expect(result.name).toBe('John');
    expect(result.notes).toBe('<script>x</script>'); // untouched
    expect(result.age).toBe(30);
  });

  it('sanitizes all string fields when no fields specified', () => {
    const input = { a: '<b>x</b>', b: '<i>y</i>', c: 42 };
    const result = sanitizeFields(input);
    expect(result.a).toBe('x');
    expect(result.b).toBe('y');
    expect(result.c).toBe(42);
  });

  it('does not mutate original object', () => {
    const input = { name: '<b>test</b>' };
    const result = sanitizeFields(input);
    expect(input.name).toBe('<b>test</b>');
    expect(result.name).toBe('test');
  });
});
