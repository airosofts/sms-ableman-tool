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
    const params = new URLSearchParams({
      'filter[record_type]': 'messaging',
      'filter[direction]': 'outbound',
      'page[size]': '250',
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

    const delivered = records.filter((r) => r.status === 'delivered').length
    const failed = records.filter((r) =>
      ['failed', 'undelivered', 'delivery_failed'].includes(r.status)
    ).length
    const sent = records.filter((r) => r.status === 'sent').length
    const total = records.length
    const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0

    return NextResponse.json({
      success: true,
      stats: { total, delivered, failed, sent, deliveryRate },
      records: records.slice(0, 100),
      meta: data.meta,
    })
  } catch (error: any) {
    console.error('Deliverability API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
