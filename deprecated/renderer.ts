import * as echarts from "echarts/index";
import resvg from "@resvg/resvg-js";
import day from "dayjs";
import { Monitor_Data } from "./monitor";
import { writeFileSync } from "fs";

export type Chart_Data = {
  title: string;
  subtitle: string;
  data: Monitor_Data[];
};

export const render_chart_to_svg = (data: Chart_Data) => {
  const chart = echarts.init(null, null, {
    renderer: "svg",
    ssr: true,
    width: 1000,
    height: 500,
  });

  const v_min = Math.min(...data.data.map((dataset) => dataset.follower));
  const v_max = Math.max(...data.data.map((dataset) => dataset.follower));

  chart.setOption({
    title: {
      text: data.title,
      subtext: data.subtitle,
      left: "center",
      top: "top",
      textStyle: {
        fontWeight: "bold",
        fontSize: 24,
      },
      subtextStyle: {
        fontWeight: "bold",
        fontSize: 16,
      },
    },
    xAxis: {
      type: "value",
      // interval: 60_000,
      // boundaryGap: true,
      min: "dataMin",
      max: "dataMax",
      axisLabel: {
        fontWeight: "bold",
        fontSize: 14,
        formatter: (value: number) => day(value).format("HH:mm:ss"),
      },
      axisTick: {
        show: true,
        alignWithLabel: true,
      },
    },
    yAxis: {
      type: "value",
      minInterval: 10,
      maxInterval: 10_000,
      min: Math.round(v_min - (v_max - v_min) * 0.1),
      max: Math.round(v_max + (v_max - v_min) * 0.1),
      // boundaryGap: true,
      axisLabel: {
        fontWeight: "bold",
        fontSize: 14,
      },
      axisTick: {
        show: true,
        alignWithLabel: true,
      },
    },
    series: [
      {
        type: "line",
        smooth: true,
        data: data.data.map((dataset) => [dataset.timestamp, dataset.follower]),
        areaStyle: {},
      },
    ],
    animation: false,
  });

  return chart.renderToSVGString();
};

export const render_svg_to_png = async (svg: string) => {
  return (
    await resvg.renderAsync(svg, {
      font: {
        loadSystemFonts: false,
        fontDirs: ["fonts"],
        defaultFontFamily: "Noto Sans SC",
      },
      shapeRendering: 2,
      textRendering: 1,
    })
  ).asPng();
};

export const save_svg = (mid: number, svg: string) => {
  writeFileSync(`outputs/${mid}.svg`, svg, "utf-8");
};

export const save_png = async (mid: number, png: Buffer) => {
  writeFileSync(`outputs/${mid}.png`, png);
};
