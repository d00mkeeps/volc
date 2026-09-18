"use client";

import React from "react";
import HighchartsWrapper from "../HighchartsWrapper";
import { Dumbbell, Calendar, Flame, Target } from "lucide-react";

interface WorkoutsTabProps {
  data: {
    kpis: {
      total_workouts: number;
      workouts_this_week: number;
      total_exercises_logged: number;
      top_target_muscle: string;
    };
    hourly_timeline: { hour: string; count: number }[];
    daily_timeline: { date: string; count: number }[];
    muscle_distribution: { muscle: string; count: number }[];
  };
}

export default function WorkoutsTab({ data }: WorkoutsTabProps) {
  const { kpis, hourly_timeline, daily_timeline, muscle_distribution } = data;

  // 1. Hourly Chart (24h)
  const hourlyOptions: Highcharts.Options = {
    chart: { type: "areaspline", height: 300 },
    title: { text: "Hourly Workout Sessions (Last 24 Hours)" },
    xAxis: {
      categories: hourly_timeline.map((item) => item.hour),
      tickInterval: 3,
    },
    yAxis: {
      title: { text: "Sessions Started" },
      min: 0,
    },
    series: [
      {
        name: "Workouts",
        type: "areaspline",
        data: hourly_timeline.map((item) => item.count),
        color: "#f84f3e",
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, "rgba(248, 79, 62, 0.4)"],
            [1, "rgba(248, 79, 62, 0.0)"],
          ],
        },
      },
    ],
  };

  // 2. Daily Workouts Trend (30d)
  const dailyOptions: Highcharts.Options = {
    chart: { type: "column", height: 300 },
    title: { text: "Daily Workout Volume (Last 30 Days)" },
    xAxis: {
      categories: daily_timeline.map((item) => item.date.slice(5)),
      tickInterval: 4,
    },
    yAxis: {
      title: { text: "Total Completed" },
      min: 0,
    },
    series: [
      {
        name: "Completed Workouts",
        type: "column",
        data: daily_timeline.map((item) => item.count),
        color: "#38bdf8",
      },
    ],
  };

  // 3. Muscle Focus Distribution
  const muscleOptions: Highcharts.Options = {
    chart: { type: "bar", height: 320 },
    title: { text: "Target Muscle Group Breakdown" },
    xAxis: {
      categories: muscle_distribution.map((item) => item.muscle),
    },
    yAxis: {
      title: { text: "Sets Logged" },
      min: 0,
    },
    series: [
      {
        name: "Total Sets",
        type: "bar",
        data: muscle_distribution.map((item) => item.count),
        color: "#10b981",
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Total Workouts</span>
            <Dumbbell className="h-4 w-4 text-[#f84f3e]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{kpis.total_workouts.toLocaleString()}</p>
          <span className="text-xs text-neutral-500">All-time logged</span>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Workouts (7d)</span>
            <Calendar className="h-4 w-4 text-sky-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{kpis.workouts_this_week.toLocaleString()}</p>
          <span className="text-xs text-sky-400/80">Active this week</span>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Exercises Logged</span>
            <Flame className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{kpis.total_exercises_logged.toLocaleString()}</p>
          <span className="text-xs text-neutral-500">Across all sessions</span>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Top Focus Group</span>
            <Target className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{kpis.top_target_muscle}</p>
          <span className="text-xs text-neutral-500">Highest set frequency</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 backdrop-blur-md">
          <HighchartsWrapper options={hourlyOptions} />
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 backdrop-blur-md">
          <HighchartsWrapper options={dailyOptions} />
        </div>
      </div>

      {/* Bottom Muscle Distribution */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 backdrop-blur-md">
        <HighchartsWrapper options={muscleOptions} />
      </div>
    </div>
  );
}
