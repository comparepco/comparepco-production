"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, Car, Calendar, Users, FileText, Shield } from "lucide-react";
import MetricsCard from "@/components/analytics/MetricsCard";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Overview {
  vehicles: number;
  availableVehicles: number;
  maintenanceVehicles: number;
  bookings: number;
  activeBookings: number;
  staff: number;
  documents: number;
  drivers: number;
}

export default function PartnerAdvancedAnalytics() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<Overview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (user?.id) {
      loadStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const getPartnerId = async (): Promise<string | null> => {
    if (!user) return null;

    if (user.role === "PARTNER_STAFF") {
      const { data, error } = await supabase
        .from("partner_staff")
        .select("partner_id")
        .eq("user_id", user.id)
        .single();
      if (error) return null;
      return data?.partner_id || null;
    }

    // PARTNER
    const { data, error } = await supabase
      .from("partners")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (error) return null;
    return data?.id || null;
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      const partnerId = await getPartnerId();
      if (!partnerId) throw new Error("Partner not found");

      const [vehicleCountRes, availableRes, maintenanceRes, bookingsRes, activeBookingsRes, staffRes, docsRes] =
        await Promise.all([
          supabase.from("vehicles").select("id", { count: "exact", head: true }).eq("partner_id", partnerId),
          supabase
            .from("vehicles")
            .select("id", { count: "exact", head: true })
            .eq("partner_id", partnerId)
            .eq("status", "available"),
          supabase
            .from("vehicles")
            .select("id", { count: "exact", head: true })
            .eq("partner_id", partnerId)
            .eq("status", "maintenance"),
          supabase.from("bookings").select("id", { count: "exact", head: true }).eq("partner_id", partnerId),
          supabase
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .eq("partner_id", partnerId)
            .in("status", ["active", "in_progress"]),
          supabase.from("partner_staff").select("id", { count: "exact", head: true }).eq("partner_id", partnerId),
          supabase.from("documents").select("id", { count: "exact", head: true }).eq("partner_id", partnerId),
        ]);

      const vehicles = vehicleCountRes.count || 0;
      const availableVehicles = availableRes.count || 0;
      const maintenanceVehicles = maintenanceRes.count || 0;
      const bookings = bookingsRes.count || 0;
      const activeBookings = activeBookingsRes.count || 0;
      const staff = staffRes.count || 0;
      const documents = docsRes.count || 0;

      // drivers – unique driver_id from bookings
      const { data: driverRows, error: driversErr } = await supabase
        .from("bookings")
        .select("driver_id", { head: false })
        .eq("partner_id", partnerId);
      const drivers = driverRows ? new Set(driverRows.map((r: any) => r.driver_id)).size : 0;
      if (driversErr) console.error(driversErr);

      setStats({
        vehicles,
        availableVehicles,
        maintenanceVehicles,
        bookings,
        activeBookings,
        staff,
        documents,
        drivers,
      });
    } catch (error) {
      console.error("Error loading stats", error);
      toast({ title: "Error", description: "Could not load analytics", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">Loading analytics…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />Advanced Analytics
          </h1>
          <Button variant="outline" className="flex items-center space-x-2" onClick={loadStats}>
            <RefreshCw className="w-4 h-4" /> <span>Refresh</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricsCard title="Vehicles" value={stats.vehicles} icon={<Car className="w-6 h-6" />} color="blue" detail={`${stats.availableVehicles} available`} />
          <MetricsCard title="Bookings" value={stats.bookings} icon={<Calendar className="w-6 h-6" />} color="purple" detail={`${stats.activeBookings} active`} />
          <MetricsCard title="Drivers" value={stats.drivers} icon={<Users className="w-6 h-6" />} color="green" detail="unique" />
          <MetricsCard title="Documents" value={stats.documents} icon={<FileText className="w-6 h-6" />} color="yellow" detail="all docs" />
          <MetricsCard title="Staff" value={stats.staff} icon={<Shield className="w-6 h-6" />} color="red" detail="partner team" />
        </div>

        {/* Additional detailed analytics placeholders */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            Payment analytics and deeper time-series charts will appear here.
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 