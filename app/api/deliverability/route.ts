import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')

  const apiKey = process.env.TELNYX_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Telnyx API key not configured' }, { status: 500 })
  }

  try {
    const allRecords: any[] = []
    let page = 1
    let totalPages = 1

    // Paginate through all pages (Telnyx caps at 50 per page)
    do {
      const params = new URLSearchParams({
        'filter[record_type]': 'messaging',
        'filter[direction]': 'outbound',
        'page[size]': '50',
        'page[number]': String(page),
      })

      if (startDate) params.set('filter[created_at][gte]', startDate)
      if (endDate) params.set('filter[created_at][lte]', endDate)

      const response = await fetch(
        `https://api.telnyx.com/v2/detail_records?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        return NextResponse.json(
          { error: err.errors?.[0]?.detail || 'Telnyx API error' },
          { status: response.status }
        )
      }

      const data = await response.json()
      const records: any[] = data.data || []
      allRecords.push(...records)

      totalPages = data.meta?.total_pages ?? 1
      page++

      // Safety cap: max 20 pages (1000 records)
      if (page > 20) break
    } while (page <= totalPages)

    const delivered = allRecords.filter((r) => r.status === 'delivered').length
    const failed = allRecords.filter((r) =>
      ['failed', 'undelivered', 'delivery_failed'].includes(r.status)
    ).length
    const sent = allRecords.filter((r) => r.status === 'sent').length
    const total = allRecords.length
    const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0

    return NextResponse.json({
      success: true,
      stats: { total, delivered, failed, sent, deliveryRate },
      records: allRecords,
    })
  } catch (error: any) {
    console.error('Deliverability API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
