/** Quick-insert symbols (no template fields). */
export const MATH_SYMBOL_GROUPS = [
  {
    id: 'greek',
    label: 'Greek',
    symbols: [
      { label: 'α', latex: '$\\alpha$' },
      { label: 'β', latex: '$\\beta$' },
      { label: 'γ', latex: '$\\gamma$' },
      { label: 'δ', latex: '$\\delta$' },
      { label: 'θ', latex: '$\\theta$' },
      { label: 'λ', latex: '$\\lambda$' },
      { label: 'μ', latex: '$\\mu$' },
      { label: 'π', latex: '$\\pi$' },
      { label: 'σ', latex: '$\\sigma$' },
      { label: 'φ', latex: '$\\phi$' },
      { label: 'ω', latex: '$\\omega$' },
      { label: 'Δ', latex: '$\\Delta$' },
      { label: 'Σ', latex: '$\\Sigma$' },
      { label: 'Ω', latex: '$\\Omega$' },
    ],
  },
  {
    id: 'operators',
    label: 'Operators',
    symbols: [
      { label: '±', latex: '$\\pm$' },
      { label: '×', latex: '$\\times$' },
      { label: '÷', latex: '$\\div$' },
      { label: '≠', latex: '$\\neq$' },
      { label: '≤', latex: '$\\leq$' },
      { label: '≥', latex: '$\\geq$' },
      { label: '≈', latex: '$\\approx$' },
      { label: '∞', latex: '$\\infty$' },
      { label: '→', latex: '$\\rightarrow$' },
      { label: '⇌', latex: '$\\rightleftharpoons$' },
    ],
  },
  {
    id: 'calc',
    label: 'Calculus',
    symbols: [
      { label: '∫', latex: '$\\int$' },
      { label: '∑', latex: '$\\sum$' },
      { label: '∏', latex: '$\\prod$' },
      { label: '√', latex: '$\\sqrt{x}$' },
      { label: 'lim', latex: '$\\lim$' },
      { label: '∂', latex: '$\\partial$' },
      { label: '∇', latex: '$\\nabla$' },
    ],
  },
  {
    id: 'chem',
    label: 'Chemistry',
    symbols: [
      { label: 'H₂O', latex: '$\\ce{H2O}$' },
      { label: 'CO₂', latex: '$\\ce{CO2}$' },
      { label: 'Na⁺', latex: '$\\ce{Na+}$' },
      { label: 'Cl⁻', latex: '$\\ce{Cl-}$' },
      { label: '⇌', latex: '$\\ce{A <=> B}$' },
      { label: 'Δ', latex: '$\\Delta$' },
    ],
  },
];

/** Templates with fill-in fields. */
export const MATH_TEMPLATES = [
  {
    id: 'frac',
    label: 'Fraction',
    fields: [
      { key: 'num', placeholder: 'numerator' },
      { key: 'den', placeholder: 'denominator' },
    ],
    build: ({ num, den }) => `$\\frac{${num || 'a'}}{${den || 'b'}}$`,
  },
  {
    id: 'sqrt',
    label: 'Square root',
    fields: [{ key: 'x', placeholder: 'expression' }],
    build: ({ x }) => `$\\sqrt{${x || 'x'}}$`,
  },
  {
    id: 'power',
    label: 'Superscript',
    fields: [
      { key: 'base', placeholder: 'base' },
      { key: 'exp', placeholder: 'exponent' },
    ],
    build: ({ base, exp }) => `$${base || 'x'}^{${exp || '2'}}$`,
  },
  {
    id: 'sub',
    label: 'Subscript',
    fields: [
      { key: 'base', placeholder: 'base' },
      { key: 'sub', placeholder: 'subscript' },
    ],
    build: ({ base, sub }) => `$${base || 'x'}_{${sub || '1'}}$`,
  },
  {
    id: 'sum',
    label: 'Summation',
    fields: [
      { key: 'i', placeholder: 'index' },
      { key: 'lo', placeholder: 'lower' },
      { key: 'hi', placeholder: 'upper' },
      { key: 'expr', placeholder: 'expression' },
    ],
    build: ({ i, lo, hi, expr }) => `$\\sum_{${lo || 'i=1'}}^{${hi || 'n'}} ${expr || 'x_i'}$`,
  },
  {
    id: 'ce',
    label: 'Chemical formula',
    fields: [{ key: 'formula', placeholder: 'e.g. H2O, CO2' }],
    build: ({ formula }) => `$\\ce{${formula || 'H2O'}}$`,
  },
];
