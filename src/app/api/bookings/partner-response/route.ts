import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { bookingId, partnerId, action, rejectionReason, overrideInsurance } = await req.json();

    if (!bookingId || !partnerId || !action) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be accept or reject' }, { status: 400 });
    }

    // Get booking data
    const { data: bookingData, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !bookingData) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const currentTime = new Date();

    // Verify partner ownership
    if (bookingData.partner_id !== partnerId) {
      return NextResponse.json({ error: 'Unauthorized - not your booking' }, { status: 403 });
    }

    // Check if booking is still pending partner approval
    if (bookingData.status !== 'pending_partner_approval') {
      return NextResponse.json({ error: `Booking is no longer pending approval. Current status: ${bookingData.status}` }, { status: 400 });
    }

    // Get partner data for history logging
    const { data: partnerData, error: partnerError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', partnerId)
      .single();

    const partnerName = partnerData?.company_name || partnerData?.company || partnerData?.full_name || partnerData?.name || partnerData?.email || 'Partner';

    // Calculate response time
    const responseTime = currentTime.getTime() - new Date(bookingData.created_at).getTime();

    const updateData: any = {
      updated_at: currentTime.toISOString(),
      partner_response_time: responseTime
    };

    let historyEntry: any;
    let notificationTitle: string;
    let notificationMessage: string;
    let newStatus: string;

    if (action === 'accept') {
      // Determine if insurance still required after acceptance
      if (bookingData.insurance_required && !bookingData.driver_insurance_valid) {
        newStatus = 'pending_insurance_upload';
      } else {
        newStatus = 'partner_accepted';
      }

      updateData.status = newStatus;
      updateData.partner_accepted_at = currentTime.toISOString();

      // Upsert driver in partner_drivers subcollection for easy lookup
      if (bookingData.driver_id) {
        const { error: driverUpsertError } = await supabaseAdmin
          .from('partner_drivers')
          .upsert({
            partner_id: partnerId,
            driver_id: bookingData.driver_id,
            full_name: bookingData.driver?.full_name || bookingData.driver_name || 'Unknown',
            email: bookingData.driver?.email || bookingData.driver_email || '',
            phone: bookingData.driver?.phone || bookingData.driver_phone || '',
            verified: bookingData.driver?.verified ?? bookingData.driver_verified ?? false,
            first_booking_at: currentTime.toISOString(),
            updated_at: currentTime.toISOString()
          });

        if (driverUpsertError) {
          console.error('Error upserting driver:', driverUpsertError);
        }
      }

      // Upsert global drivers collection for partner driver list
      if (bookingData.driver_id) {
        const { error: globalDriverError } = await supabaseAdmin
          .from('drivers')
          .upsert({
            id: bookingData.driver_id,
            partner_id: partnerId,
            name: bookingData.driver?.full_name || bookingData.driver_name || 'Unknown',
            email: bookingData.driver?.email || bookingData.driver_email || '',
            phone: bookingData.driver?.phone || bookingData.driver_phone || '',
            status: 'active',
            total_bookings: 1,
            updated_at: currentTime.toISOString(),
            first_booking_at: currentTime.toISOString()
          });

        if (globalDriverError) {
          console.error('Error upserting global driver:', globalDriverError);
        }
      }

      historyEntry = {
        booking_id: bookingId,
        action: 'partner_accepted',
        performed_by: partnerId,
        performed_by_type: 'partner',
        details: {
          response_time_ms: responseTime,
          partner_name: partnerName,
          override_insurance: !!overrideInsurance
        },
        description: `Booking accepted by partner ${partnerName}`,
        created_at: currentTime.toISOString()
      };

      if (overrideInsurance === true) {
        updateData.driver_insurance_valid = true;
        updateData.driver_insurance_status = 'approved';
      }

      if (newStatus === 'pending_insurance_upload') {
        notificationTitle = 'Insurance Required';
        notificationMessage = `Your booking for ${bookingData.car?.make} ${bookingData.car?.model} has been accepted, but you must upload a valid insurance certificate before pickup.`;
      } else {
        notificationTitle = 'Booking Accepted';
        notificationMessage = `Your booking for ${bookingData.car?.make} ${bookingData.car?.model} has been accepted by the partner. Please review and sign the rental agreement.`;

        // Check if booking can be automatically activated
        const canAutoActivate = (
          ['completed', 'paid', 'confirmed'].includes(bookingData.payment_status) &&
          (!bookingData.insurance_required || bookingData.driver_insurance_valid || bookingData.partner_provides_insurance) &&
          (!bookingData.requires_document_verification || bookingData.all_documents_approved)
        );

        if (canAutoActivate) {
          // Auto-activate the booking
          newStatus = 'active';
          updateData.status = 'active';
          updateData.activated_at = currentTime.toISOString();
          updateData.activated_by = partnerId;
          updateData.activated_by_type = 'partner';
          updateData.activated_trigger = 'auto_on_acceptance';

          notificationTitle = 'Booking Active - Ready for Collection!';
          notificationMessage = `Your booking for ${bookingData.car?.make} ${bookingData.car?.model} has been accepted and is now active! You can collect the vehicle from the partner.`;
        }
      }

      // Auto-release vehicle documents to partner if payment is confirmed
      if (bookingData.payment_status === 'completed' || bookingData.payment_confirmed) {
        try {
          // Get vehicle documents
          const { data: vehicleData, error: vehicleError } = await supabaseAdmin
            .from('vehicles')
            .select('*')
            .eq('id', bookingData.car_id)
            .single();

          if (!vehicleError && vehicleData) {
            const vehicleDocuments = vehicleData.documents || {};

            // Filter approved documents only
            const approvedDocuments: Record<string, any> = {};
            const documentTypes = ['mot', 'private_hire_license', 'insurance', 'logbook', 'roadTax'];
            
            documentTypes.forEach(docType => {
              const doc = vehicleDocuments[docType];
              if (doc && doc.status === 'approved' && doc.url) {
                approvedDocuments[docType] = {
                  type: docType,
                  url: doc.url,
                  expiry_date: doc.expiry_date || doc.expiryDate || null,
                  uploaded_at: doc.uploaded_at || doc.uploadedAt || null,
                  status: doc.status
                };
              }
            });

            // Add vehicle documents to booking update
            updateData.vehicle_documents_accessible = true;
            updateData.vehicle_documents_released_at = currentTime.toISOString();
            updateData.vehicle_documents = approvedDocuments;
            updateData.partner_can_access_vehicle_docs = true;
          }
        } catch (error) {
          console.error('Error releasing vehicle documents:', error);
          // Don't fail the booking acceptance if document release fails
        }
      }

    } else {
      // reject
      newStatus = 'partner_rejected';
      updateData.status = newStatus;
      updateData.partner_rejected_at = currentTime.toISOString();
      updateData.rejection_reason = rejectionReason || 'No reason provided';

      // Update vehicle status back to available
      if (bookingData.car_id) {
        const { error: vehicleUpdateError } = await supabaseAdmin
          .from('vehicles')
          .update({
            status: 'available',
            current_booking_id: null,
            updated_at: currentTime.toISOString()
          })
          .eq('id', bookingData.car_id);

        if (vehicleUpdateError) {
          console.error('Error updating vehicle status:', vehicleUpdateError);
        }
      }

      // Refund logic for rejected bookings
      // 1. Refund deposit if paid
      if (bookingData.deposit?.amount && bookingData.deposit.amount > 0 && bookingData.deposit.status === 'paid') {
        const { error: depositRefundError } = await supabaseAdmin
          .from('payment_instructions')
          .insert({
            booking_id: bookingId,
            driver_id: bookingData.driver_id,
            partner_id: partnerId,
            vehicle_reg: bookingData.car?.registration_number || bookingData.vehicle_reg || '',
            amount: bookingData.deposit.amount,
            type: 'refund',
            method: 'deposit',
            status: 'pending',
            reason: `Refund for rejected booking (deposit): ${rejectionReason || 'No reason provided'}`,
            created_at: currentTime.toISOString(),
            updated_at: currentTime.toISOString()
          });

        if (depositRefundError) {
          console.error('Error creating deposit refund instruction:', depositRefundError);
        }
      }

      // 2. Refund actual received weekly payments
      const { data: paymentInstructions, error: paymentError } = await supabaseAdmin
        .from('payment_instructions')
        .select('amount, status')
        .eq('booking_id', bookingId)
        .in('status', ['completed', 'received']);

      if (!paymentError && paymentInstructions) {
        const actualPaid = paymentInstructions.reduce((sum, instruction) => {
          return sum + (instruction.status === 'completed' || instruction.status === 'received' ? instruction.amount : 0);
        }, 0);

        if (actualPaid > 0) {
          const { error: weeklyRefundError } = await supabaseAdmin
            .from('payment_instructions')
            .insert({
              booking_id: bookingId,
              driver_id: bookingData.driver_id,
              partner_id: partnerId,
              vehicle_reg: bookingData.car?.registration_number || bookingData.vehicle_reg || '',
              amount: actualPaid,
              type: 'refund',
              method: 'weekly',
              status: 'pending',
              reason: `Refund for rejected booking (weekly paid): ${rejectionReason || 'No reason provided'}`,
              created_at: currentTime.toISOString(),
              updated_at: currentTime.toISOString()
            });

          if (weeklyRefundError) {
            console.error('Error creating weekly refund instruction:', weeklyRefundError);
          }
        }
      }

      historyEntry = {
        booking_id: bookingId,
        action: 'partner_rejected',
        performed_by: partnerId,
        performed_by_type: 'partner',
        details: {
          response_time_ms: responseTime,
          partner_name: partnerName,
          rejection_reason: rejectionReason || 'No reason provided'
        },
        description: `Booking rejected by partner ${partnerName}${rejectionReason ? `: ${rejectionReason}` : ''}`,
        created_at: currentTime.toISOString()
      };

      notificationTitle = 'Booking Rejected';
      notificationMessage = `Your booking for ${bookingData.car?.make} ${bookingData.car?.model} has been rejected by the partner.${rejectionReason ? ` Reason: ${rejectionReason}` : ''} Refund(s) will be processed.`;
    }

    // Update the booking
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }

    // Add to booking history
    if (historyEntry) {
      const { error: historyError } = await supabaseAdmin
        .from('booking_history')
        .insert(historyEntry);

      if (historyError) {
        console.error('Error adding to booking history:', historyError);
      }
    }

    // Send notification to driver
    const { error: driverNotificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        type: action === 'accept' ? 'booking_accepted' : 'booking_rejected',
        recipient_id: bookingData.driver_id,
        recipient_type: 'driver',
        title: notificationTitle,
        message: notificationMessage,
        data: {
          booking_id: bookingId
        },
        created_at: currentTime.toISOString(),
        priority: action === 'accept' ? 'high' : 'medium'
      });

    if (driverNotificationError) {
      console.error('Error creating driver notification:', driverNotificationError);
    }

    // Send notification to admin
    const { error: adminNotificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        type: `booking_${action}ed_admin`,
        title: `Booking ${action === 'accept' ? 'Accepted' : 'Rejected'}`,
        message: `Partner ${partnerName} has ${action}ed booking for ${bookingData.car?.make} ${bookingData.car?.model}`,
        data: {
          booking_id: bookingId,
          partner_name: partnerName
        },
        created_at: currentTime.toISOString(),
        priority: 'medium'
      });

    if (adminNotificationError) {
      console.error('Error creating admin notification:', adminNotificationError);
    }

    // Remove the scheduled task since partner has responded
    const { error: taskError } = await supabaseAdmin
      .from('scheduled_tasks')
      .update({
        status: 'completed',
        completed_at: currentTime.toISOString()
      })
      .eq('booking_id', bookingId)
      .eq('type', 'check_partner_acceptance')
      .eq('status', 'pending');

    if (taskError) {
      console.error('Error updating scheduled task:', taskError);
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      message: `Booking ${action}ed successfully`,
      response_time: Math.round(responseTime / 1000 / 60) // in minutes
    });

  } catch (error: any) {
    console.error('Partner response error:', error);
    return NextResponse.json({ error: 'Failed to process partner response' }, { status: 500 });
  }
}
