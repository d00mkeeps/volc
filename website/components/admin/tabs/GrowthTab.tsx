"use client";

import React from "react";
import HighchartsWrapper from "../HighchartsWrapper";
import { Users, UserPlus, Mail, Percent } from "lucide-react";

interface GrowthTabProps {
  data: {
    kpis: {
      total_registered_users: number;
      signups_last_30d: number;
      total_waitlist_leads: number;
      conversion_rate_percent: number;
    };
    growth_timeline: {
      date: string;
      new_users: number;
      new_waitlist: number;
      cumulative_users: number;
      cumulative_waitlist: number;
    }[];
  };
}

export default function GrowthTab({ data }: GrowthTabProps) {
  const { kpis, growth_timeline } = data;

  // 1. Cumulative Growth Spline
  const trajectoryOptions: Highcharts.Options = {
    chart: { type: "spline", height: 320 },
    title: { text: "Cumulative Growth Trajectory (Last 30 Days)" },
    xAxis: {
      categories: growth_timeline.map((item) => item.date.slice(5)),
      tickInterval: 4,
    },
    yAxis: {
      title: { text: "Total Accounts" },
      min: 0,
    },
    series: [
      {
        name: "Registered Users",
        type: "spline",
        data: growth_timeline.map((item) => item.cumulative_users),
        color: "#f84f3e",
      },
      {
        name: "Waitlist Leads",
        type: "spline",
        data: growth_timeline.map((item) => item.cumulative_waitlist),
        color: "#38bdf8",
      },
    ],
  };

  // 2. Daily Acquisition Stacked Column
  const dailyOptions: Highcharts.Options = {
    chart: { type: "column", height: 320 },
    title: { text: "Daily Acquisition Split (New Users vs. Waitlist)" },
    plotOptions: {
      column: {
        stacking: "normal",
      },
    },
    xAxis: {
      categories: growth_timeline.map((item) => item.date.slice(5)),
      tickInterval: 4,
    },
    yAxis: {
      title: { text: "New Additions" },
      min: 0,
    },
    series: [
      {
        name: "New Registered Users",
        type: "column",
        data: growth_timeline.map((item) => item.new_users),
        color: "#f84f3e",
      },
      {
        name: "New Waitlist Emails",
        type: "column",
        data: growth_timeline.map((item) => item.new_waitlist),
        color: "#a855f7",
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Registered Users</span>
            <Users className="h-4 w-4 text-[#f84f3e]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{kpis.total_registered_users.toLocaleString()}</p>
          <span className="text-xs text-neutral-500">Active app profiles</span>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Signups (30d)</span>
            <UserPlus className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">+{kpis.signups_last_30d.toLocaleString()}</p>
          <span className="text-xs text-emerald-400/80">New users this month</span>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Waitlist Leads</span>
            <Mail className="h-4 w-4 text-purple-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{kpis.total_waitlist_leads.toLocaleString()}</p>
          <span className="text-xs text-neutral-500">Landing page captures</span>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Lead Conversion</span>
            <Percent className="h-4 w-4 text-sky-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{kpis.conversion_rate_percent}%</p>
          <span className="text-xs text-neutral-500">Visitor-to-user ratio</span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 backdrop-blur-md">
          <HighchartsWrapper options={trajectoryOptions} />
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 backdrop-blur-md">
          <HighchartsWrapper options={dailyOptions} />
        </div>
      </div>
    </div>
  );
}
