import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { airophone_api_key } = body;

    if (!airophone_api_key) {
      return NextResponse.json(
        { success: false, error: 'Missing Airophone API key' },
        { status: 400 }
      );
    }

    const response = await axios.get(
      'https://ap.airosofts.com/api/external/balance',
      {
        headers: {
          Authorization: `Bearer ${airophone_api_key}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const data = response.data;

    if (data.success) {
      return NextResponse.json({
        success: true,
        message: `Connected! Credits balance: $${data.balance?.toFixed(2) ?? '0.00'}`,
        balance: data.balance,
      });
    }

    return NextResponse.json(
      { success: false, error: data.error || 'Invalid API key' },
      { status: 400 }
    );

  } catch (error: any) {
    if (error.response?.status === 401) {
      return NextResponse.json(
        { success: false, error: 'Invalid Airophone API key' },
        { status: 401 }
      );
    }

    console.error('Error testing Airophone config:', error);
    return NextResponse.json(
      { success: false, error: 'Could not reach Airophone API' },
      { status: 500 }
    );
  }
}
