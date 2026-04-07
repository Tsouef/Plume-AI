/// <reference types="vitest-axe/extend-expect" />
import '@testing-library/jest-dom'
import * as axeMatchers from 'vitest-axe/matchers'
import { expect } from 'vitest'
import './shared/i18n/i18n'

expect.extend(axeMatchers)
