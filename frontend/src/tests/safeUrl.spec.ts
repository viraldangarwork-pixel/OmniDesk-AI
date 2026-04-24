import { describe, expect, it } from 'vitest'
import { safeUrl } from '@/utils/safeUrl'

describe('safeUrl', () => {
  it('passes through http/https URLs', () => {
    expect(safeUrl('https://example.com/path?x=1')).toBe('https://example.com/path?x=1')
    expect(safeUrl('http://example.com')).toBe('http://example.com/')
  })

  it('passes through mailto and tel schemes', () => {
    expect(safeUrl('mailto:hi@example.com')).toMatch(/^mailto:/)
    expect(safeUrl('tel:+15555555')).toMatch(/^tel:/)
  })

  it('rejects javascript: URLs', () => {
    expect(safeUrl('javascript:alert(1)')).toBeNull()
    expect(safeUrl('JAVASCRIPT:alert(1)')).toBeNull()
    expect(safeUrl('  javascript:alert(1)  ')).toBeNull()
  })

  it('rejects data: URLs', () => {
    expect(safeUrl('data:text/html,<script>alert(1)</script>')).toBeNull()
  })

  it('rejects file: and vbscript:', () => {
    expect(safeUrl('file:///etc/passwd')).toBeNull()
    expect(safeUrl('vbscript:msgbox(1)')).toBeNull()
  })

  it('allows relative paths and fragments', () => {
    expect(safeUrl('/dashboard')).toBe('/dashboard')
    expect(safeUrl('./foo')).toBe('./foo')
    expect(safeUrl('../bar')).toBe('../bar')
    expect(safeUrl('#section')).toBe('#section')
  })

  it('returns null for empty / nullish input', () => {
    expect(safeUrl(null)).toBeNull()
    expect(safeUrl(undefined)).toBeNull()
    expect(safeUrl('')).toBeNull()
    expect(safeUrl('   ')).toBeNull()
  })

  it('returns null for malformed URLs', () => {
    expect(safeUrl('http://')).toBeNull()
  })
})
