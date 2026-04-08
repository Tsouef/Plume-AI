import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SitePermissionSection } from './SitePermissionSection'
import '../../../shared/i18n/i18n'

// Mock chrome.tabs.query
const mockChrome = {
  tabs: {
    query: vi.fn(),
  },
}
vi.stubGlobal('chrome', mockChrome)

describe('SitePermissionSection', () => {
  beforeEach(() => {
    mockChrome.tabs.query.mockResolvedValue([{ url: 'https://github.com/foo' }])
  })

  it('shows lock icon and siteNotEnabled when domain is not trusted', async () => {
    render(<SitePermissionSection trustedDomains={[]} onGrant={vi.fn()} onRevoke={vi.fn()} />)
    expect(await screen.findByText('Site not enabled')).toBeInTheDocument()
    expect(screen.getByText('github.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enable here/i })).toBeInTheDocument()
  })

  it('shows active state when domain is trusted', async () => {
    render(
      <SitePermissionSection trustedDomains={['github.com']} onGrant={vi.fn()} onRevoke={vi.fn()} />
    )
    expect(await screen.findByText('Extension active on this site')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /disable/i })).toBeInTheDocument()
  })

  it('calls onGrant with hostname when Enable is clicked', async () => {
    const onGrant = vi.fn()
    render(<SitePermissionSection trustedDomains={[]} onGrant={onGrant} onRevoke={vi.fn()} />)
    await userEvent.click(await screen.findByRole('button', { name: /enable here/i }))
    expect(onGrant).toHaveBeenCalledWith('github.com')
  })

  it('calls onRevoke with hostname when Disable is clicked', async () => {
    const onRevoke = vi.fn()
    render(
      <SitePermissionSection
        trustedDomains={['github.com']}
        onGrant={vi.fn()}
        onRevoke={onRevoke}
      />
    )
    await userEvent.click(await screen.findByRole('button', { name: /disable/i }))
    expect(onRevoke).toHaveBeenCalledWith('github.com')
  })

  it('renders nothing when tab url is unavailable', async () => {
    mockChrome.tabs.query.mockResolvedValue([{ url: 'chrome://extensions' }])
    const { container } = render(
      <SitePermissionSection trustedDomains={[]} onGrant={vi.fn()} onRevoke={vi.fn()} />
    )
    // Wait for async effect then check nothing rendered
    await new Promise((r) => setTimeout(r, 50))
    expect(container.firstChild).toBeNull()
  })
})
