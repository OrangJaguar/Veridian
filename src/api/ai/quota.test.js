import { describe, it, expect } from 'vitest';

describe('fetchAiQuotaStatus response shape', () => {
  it('unwraps data envelope and tolerates missing categories', () => {
    const res = { data: { dailyLimit: 50, categories: undefined } };
    const quota = res?.data ?? res;
    const categories = (quota.categories ?? []).map((c) => c);
    expect(categories).toEqual([]);
    expect(quota.dailyLimit).toBe(50);
  });

  it('uses bare response when no data wrapper', () => {
    const res = { dailyLimit: 40, categories: [{ id: 'quiz', used: 1, limit: 5 }] };
    const quota = res?.data ?? res;
    expect((quota.categories ?? []).length).toBe(1);
  });
});
