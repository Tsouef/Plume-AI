/// <reference types="vitest-axe/extend-expect" />

declare global {
  namespace Chai {
    interface Assertion {
      toHaveNoViolations(): void
    }
  }
}

declare module 'vitest' {
  interface Assertion {
    toHaveNoViolations(): void
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void
  }
}

export {}
