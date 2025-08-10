"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

/**
 * This lightweight page exists purely as a bridge for deep-links coming from
 * notifications (e.g. `/partner/bookings/abc123`).
 *
 * On mount, it redirects to either the partner payments dashboard or the bookings list,
 * depending on the current hash.
 */
export default function PartnerBookingRedirect() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id as string | undefined;

  useEffect(() => {
    if (!id) return;

    // Capture current hash (e.g. #payments)
    const hash = window.location.hash?.replace(/^#/, "");

    if (hash === "payments") {
      // Go to partner payments dashboard and reveal the booking
      router.replace(`/partner/payments?bookingId=${id}`);
    } else {
      // Default behaviour – open bookings list & drawer
      router.replace(`/partner/bookings?bookingId=${id}` + (hash ? `#${hash}` : ""));
    }
  }, [id, router]);

  // Lightweight spinner while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <span className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></span>
      <span className="ml-3 text-gray-600">Redirecting…</span>
    </div>
  );
} 