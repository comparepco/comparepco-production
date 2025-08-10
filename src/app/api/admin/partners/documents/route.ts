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

    if (!partnerId) {
      return NextResponse.json({ error: 'Partner ID is required' }, { status: 400 });
    }

    // Fetch documents for the partner
    const { data: documents, error } = await supabase
      .from('documents')
      .select(`
        id,
        name,
        type,
        category,
        file_url,
        file_name,
        file_size,
        mime_type,
        expiry_date,
        notes,
        approval_status,
        approved_at,
        approved_by,
        rejected_at,
        rejected_by,
        rejection_reason,
        created_at,
        uploader_name,
        uploader_email,
        partner_name
      `)
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });

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
    const { documentId, action, reason } = body;

    if (!documentId || !action) {
      return NextResponse.json({ error: 'Document ID and action are required' }, { status: 400 });
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (action === 'approve') {
      updateData.approval_status = 'approved';
      updateData.approved_at = new Date().toISOString();
      updateData.approved_by = 'Admin'; // You can get this from the request context
    } else if (action === 'reject') {
      updateData.approval_status = 'rejected';
      updateData.rejected_at = new Date().toISOString();
      updateData.rejected_by = 'Admin';
      updateData.rejection_reason = reason || 'Document rejected by admin';
    }

    const { error } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', documentId);

    if (error) {
      console.error('Error updating document:', error);
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in documents POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 