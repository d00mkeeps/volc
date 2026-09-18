"use client";

import React, { useEffect, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

// Apply Volc Dark Theme to Highcharts
const darkTheme: Highcharts.Options = {
  chart: {
    backgroundColor: "transparent",
    style: {
      fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    },
  },
  title: {
    style: {
      color: "#f3f4f6",
      fontWeight: "600",
      fontSize: "14px",
    },
    align: "left",
  },
  subtitle: {
    style: {
      color: "#9ca3af",
      fontSize: "12px",
    },
    align: "left",
  },
  xAxis: {
    gridLineColor: "rgba(255, 255, 255, 0.05)",
    lineColor: "rgba(255, 255, 255, 0.1)",
    tickColor: "rgba(255, 255, 255, 0.1)",
    labels: {
      style: {
        color: "#9ca3af",
        fontSize: "11px",
      },
    },
  },
  yAxis: {
    gridLineColor: "rgba(255, 255, 255, 0.06)",
    title: {
      style: {
        color: "#9ca3af",
        fontSize: "11px",
      },
    },
    labels: {
      style: {
        color: "#9ca3af",
        fontSize: "11px",
      },
    },
  },
  tooltip: {
    backgroundColor: "rgba(24, 18, 17, 0.95)",
    borderColor: "rgba(248, 79, 62, 0.4)",
    borderRadius: 8,
    shadow: true,
    style: {
      color: "#f3f4f6",
      fontSize: "12px",
    },
  },
  legend: {
    itemStyle: {
      color: "#d1d5db",
      fontWeight: "500",
      fontSize: "12px",
    },
    itemHoverStyle: {
      color: "#ffffff",
    },
  },
  credits: {
    enabled: false,
  },
  colors: ["#f84f3e", "#38bdf8", "#10b981", "#a855f7", "#f59e0b", "#ec4899"],
};

if (typeof window !== "undefined") {
  Highcharts.setOptions(darkTheme);
}

export default function HighchartsWrapper(props: HighchartsReact.Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-72 w-full items-center justify-center rounded-xl bg-neutral-900/30 text-xs text-neutral-500 animate-pulse">
        Initializing Highcharts...
      </div>
    );
  }

  return <HighchartsReact highcharts={Highcharts} {...props} />;
}
