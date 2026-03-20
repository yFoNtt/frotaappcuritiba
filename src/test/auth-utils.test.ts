import { describe, it, expect } from 'vitest';
import { getWeakPasswordMessage } from '@/components/auth/utils';

describe('getWeakPasswordMessage', () => {
  it('returns message for pwned/leaked passwords', () => {
    expect(getWeakPasswordMessage({ message: 'Password was found in a data breach' })).toBeTruthy();
    expect(getWeakPasswordMessage({ message: 'weak_password detected' })).toBeTruthy();
    expect(getWeakPasswordMessage({ message: 'pwned password' })).toBeTruthy();
    expect(getWeakPasswordMessage({ message: 'leaked credentials' })).toBeTruthy();
  });

  it('returns message for weak passwords', () => {
    expect(getWeakPasswordMessage({ message: 'Password too short' })).toBeTruthy();
    expect(getWeakPasswordMessage({ message: 'too common' })).toBeTruthy();
    expect(getWeakPasswordMessage({ message: 'weak password' })).toBeTruthy();
  });

  it('returns null for non-password errors', () => {
    expect(getWeakPasswordMessage({ message: 'Invalid email' })).toBeNull();
    expect(getWeakPasswordMessage({ message: 'Network error' })).toBeNull();
    expect(getWeakPasswordMessage({})).toBeNull();
    expect(getWeakPasswordMessage(null)).toBeNull();
  });
});
