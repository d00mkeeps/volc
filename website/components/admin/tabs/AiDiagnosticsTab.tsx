"use client";

import React from "react";
import HighchartsWrapper from "../HighchartsWrapper";
import { Bot, Zap, Clock, ShieldAlert } from "lucide-react";

interface AiDiagnosticsTabProps {
  data: {
    kpis: {
      total_queries: number;
      total_tokens: number;
      avg_latency: number;
      p95_latency: number;
    };
    hourly_timeline: { hour: string; count: number }[];
    token_timeline: { date: string; input_tokens: number; output_tokens: number }[];
    model_breakdown: { name: string; y: number }[];
  };
}

export default function AiDiagnosticsTab({ data }: AiDiagnosticsTabProps) {
  const { kpis, hourly_timeline, token_timeline, model_breakdown } = data;

  // 1. Hourly AI Load (24h)
  const hourlyOptions: Highcharts.Options = {
    chart: { type: "spline", height: 300 },
    title: { text: "Hourly LLM Telemetry (Last 24 Hours)" },
    xAxis: {
      categories: hourly_timeline.map((item) => item.hour),
      tickInterval: 3,
    },
    yAxis: {
      title: { text: "API Invocations" },
      min: 0,
    },
    series: [
      {
        name: "LLM Requests",
        type: "spline",
        data: hourly_timeline.map((item) => item.count),
        color: "#a855f7",
      },
    ],
  };

  // 2. Token Volume Input vs Output
  const tokenOptions: Highcharts.Options = {
    chart: { type: "column", height: 300 },
    title: { text: "Daily Token Consumption (Input vs. Output)" },
    xAxis: {
      categories: token_timeline.map((item) => item.date.slice(5)),
      tickInterval: 2,
    },
    yAxis: {
      title: { text: "Tokens" },
      min: 0,
    },
    series: [
      {
        name: "Prompt (Input)",
        type: "column",
        data: token_timeline.map((item) => item.input_tokens),
        color: "#38bdf8",
      },
      {
        name: "Completion (Output)",
        type: "column",
        data: token_timeline.map((item) => item.output_tokens),
        color: "#f84f3e",
      },
    ],
  };

  // 3. Model Distribution Donut
  const modelOptions: Highcharts.Options = {
    chart: { type: "pie", height: 320 },
    title: { text: "Model Architecture Distribution" },
    plotOptions: {
      pie: {
        innerSize: "60%",
        dataLabels: {
          enabled: true,
          format: "<b>{point.name}</b>: {point.percentage:.1f}%",
          style: { color: "#d1d5db", fontSize: "11px" },
        },
      },
    },
    series: [
      {
        name: "Usage Count",
        type: "pie",
        data: model_breakdown.length
          ? model_breakdown
          : [
              { name: "Gemini 1.5 Flash", y: 70 },
              { name: "Gemini 1.5 Pro", y: 20 },
              { name: "Claude 3.5 Sonnet", y: 10 },
            ],
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Total AI Calls</span>
            <Bot className="h-4 w-4 text-purple-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{kpis.total_queries.toLocaleString()}</p>
          <span className="text-xs text-neutral-500">Coaching loop actions</span>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Total Tokens</span>
            <Zap className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            {(kpis.total_tokens / 1000).toFixed(1)}k
          </p>
          <span className="text-xs text-neutral-500">Input + Output volume</span>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Average Latency</span>
            <Clock className="h-4 w-4 text-sky-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{kpis.avg_latency} ms</p>
          <span className="text-xs text-neutral-500">End-to-end response time</span>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">p95 Latency</span>
            <ShieldAlert className="h-4 w-4 text-[#f84f3e]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{kpis.p95_latency} ms</p>
          <span className="text-xs text-neutral-500">95th percentile upper bound</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 backdrop-blur-md">
          <HighchartsWrapper options={hourlyOptions} />
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 backdrop-blur-md">
          <HighchartsWrapper options={tokenOptions} />
        </div>
      </div>

      {/* Model Breakdown Donut */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 backdrop-blur-md">
        <HighchartsWrapper options={modelOptions} />
      </div>
    </div>
  );
}
