import { expect, test, type Page } from '@playwright/test'

async function signIn(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Username', { exact: true }).fill('admin')
  await page.getByLabel('Password', { exact: true }).fill('isolated-admin-browser-password')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(/dashboard/)
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible()
  return { Authorization: 'Bearer ' + await page.evaluate(() => localStorage.getItem('sem5_token')) }
}

test('built SPA deep links, real authentication and API traffic use one origin', async ({ page }) => {
  const apiOrigins = new Set<string>()
  page.on('request', request => { const url = new URL(request.url()); if (url.pathname.startsWith('/api/')) apiOrigins.add(url.origin) })
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/login/)
  const invalid = await page.request.post('/api/auth/login', { form: { username: 'admin', password: 'invalid' } })
  expect(invalid.status()).toBe(401)
  await signIn(page)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible()
  expect([...apiOrigins]).toEqual(['http://127.0.0.1:5190'])
  const missing = await page.request.get('/api/does-not-exist')
  expect(missing.status()).toBe(404)
  expect(missing.headers()['content-type']).toContain('application/json')
})

test('built client works with persistent uploaded rows, scoped CSV and role isolation', async ({ page }) => {
  const headers = await signIn(page)
  const upload = await page.request.post('/api/datasets/upload', { headers, multipart: {
    name: 'Isolated production-client fixture',
    file: { name: 'sales.csv', mimeType: 'text/csv', buffer: Buffer.from('date,product,quantity,price,revenue\n2025-01-01,Book,2,100,200\n2025-01-02,Pen,4,200,800\n') },
  } })
  expect(upload.status()).toBe(201)
  const id = (await upload.json()).dataset_id
  const scoped = { ...headers, 'X-Dataset-ID': id }
  const overview = await page.request.get('/api/analytics/overview', { headers: scoped })
  expect(overview.status()).toBe(200)
  const csv = await page.request.get('/api/reports/export?report=dataset_rows', { headers: scoped })
  expect(csv.status()).toBe(200)
  expect(await csv.text()).toContain('Book')
  const token = await page.request.post('/api/auth/login', { form: { username: 'analyst', password: 'isolated-analyst-browser-password' } })
  const analystHeaders = { Authorization: 'Bearer ' + (await token.json()).access_token }
  expect((await page.request.get('/api/admin/system/status', { headers: analystHeaders })).status()).toBe(403)
  expect((await page.request.get('/api/datasets/' + id, { headers: analystHeaders })).status()).toBe(403)
  const listing = await page.request.get('/api/datasets', { headers })
  expect((await listing.json()).datasets.some((dataset: { dataset_id: string }) => dataset.dataset_id === id)).toBe(true)
})

test('same-origin APIs load real model artifacts and return real finite forecasts', async ({ page }) => {
  const headers = await signIn(page)
  const list = await page.request.get('/api/datasets', { headers })
  const reference = (await list.json()).datasets.find((dataset: { read_only: boolean }) => dataset.read_only)
  expect(reference).toBeTruthy()
  const scoped = { ...headers, 'X-Dataset-ID': reference.dataset_id }
  const response = await page.request.get('/api/ml/forecast?target=orders&periods=7', { headers: scoped })
  expect(response.status()).toBe(200)
  const result = await response.json()
  expect(result.status).toBe('available')
  expect(result.forecast).toHaveLength(7)
  expect(result.forecast.every((point: { orders: number }) => Number.isFinite(point.orders))).toBe(true)
  expect((await page.request.get('/health/ready')).status()).toBe(200)
})
