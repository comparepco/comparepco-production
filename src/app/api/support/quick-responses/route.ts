import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');
    const isActive = searchParams.get('is_active');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('quick_responses')
      .select('*')
      .order('title')
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq('category', category);
    }
    if (subcategory) {
      query = query.eq('subcategory', subcategory);
    }
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      quickResponses: data
    });
  } catch (error) {
    console.error('Error fetching quick responses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quick responses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, category, subcategory, tags, created_by } = body;

    if (!title || !content || !category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('quick_responses')
      .insert({
        title,
        content,
        category,
        subcategory,
        tags: tags || [],
        is_active: true,
        created_by
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      quickResponse: data
    });
  } catch (error) {
    console.error('Error creating quick response:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create quick response' },
      { status: 500 }
    );
  }
} 