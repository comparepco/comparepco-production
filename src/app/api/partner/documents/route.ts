import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId');
    const userId = searchParams.get('userId');

    if (!partnerId && !userId) {
      return NextResponse.json({ error: 'Missing partnerId or userId' }, { status: 400 });
    }

    let query = supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (partnerId) {
      query = query.eq('partner_id', partnerId);
    } else if (userId) {
      // Get partner ID from user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('partner_id')
        .eq('id', userId)
        .single();

      if (userError || !userData?.partner_id) {
        return NextResponse.json({ error: 'User not found or no partner associated' }, { status: 404 });
      }

      query = query.eq('partner_id', userData.partner_id);
    }

    const { data: documents, error } = await query;

    if (error) {
      console.error('Error fetching documents:', error);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    return NextResponse.json({ documents: documents || [] });
  } catch (error) {
    console.error('Error in documents GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      partner_id,
      uploader_id,
      name,
      type,
      category,
      car_id,
      car_name,
      driver_id,
      driver_name,
      file_name,
      file_url,
      file_size,
      mime_type,
      expiry_date,
      notes,
      uploader_name,
      uploader_email,
      uploader_type,
      partner_name
    } = body;

    // Validate required fields
    if (!partner_id || !uploader_id || !name || !type || !category || !file_name || !file_url || !file_size) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const documentData = {
      partner_id,
      uploader_id,
      name,
      type,
      category,
      car_id: car_id || null,
      car_name: car_name || null,
      driver_id: driver_id || null,
      driver_name: driver_name || null,
      file_name,
      file_url,
      file_size,
      mime_type: mime_type || null,
      expiry_date: expiry_date || null,
      notes: notes || null,
      uploader_name: uploader_name || null,
      uploader_email: uploader_email || null,
      uploader_type: uploader_type || null,
      partner_name: partner_name || null
    };

    const { data: document, error } = await supabase
      .from('documents')
      .insert(documentData)
      .select()
      .single();

    if (error) {
      console.error('Error creating document:', error);
      return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Error in documents POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Convert camelCase to snake_case for database fields
    const snakeCaseUpdates: any = {};
    Object.keys(updates).forEach(key => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      snakeCaseUpdates[snakeKey] = updates[key];
    });

    const { data: document, error } = await supabase
      .from('documents')
      .update(snakeCaseUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating document:', error);
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Error in documents PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting document:', error);
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in documents DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 