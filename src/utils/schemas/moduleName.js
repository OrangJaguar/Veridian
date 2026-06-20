export const MODULE_NAME_MIN = 2;
export const MODULE_NAME_MAX = 80;

export function normalizeModuleName(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

export function isValidModuleName(value) {
  const name = normalizeModuleName(value);
  return name.length >= MODULE_NAME_MIN && name.length <= MODULE_NAME_MAX;
}

export function buildModuleNameRules(name, focused) {
  const value = name ?? '';
  const hasInput = value.length > 0;
  const ruleState = (test) => {
    if (!hasInput && !focused) return 'idle';
    return test(value) ? 'pass' : 'fail';
  };
  return [
    {
      label: `${MODULE_NAME_MIN}–${MODULE_NAME_MAX} characters`,
      state: ruleState((v) => {
        const t = v.trim();
        return t.length >= MODULE_NAME_MIN && t.length <= MODULE_NAME_MAX;
      }),
    },
    {
      label: 'Cannot be only spaces',
      state: ruleState((v) => v.trim().length > 0),
    },
  ];
}
