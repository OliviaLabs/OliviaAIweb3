import React, { useRef, useEffect } from "react";
import PropTypes from "prop-types";
import * as d3 from "d3";
import { Card, Skeleton } from "@heroui/react";

const BubbleMap = ({ data, bubbleIsLoading }) => {
  const svgRef = useRef(null);
  const rafRef = useRef(null);      // single animation loop id
  const cleanupRef = useRef(null);  // teardown handler

  useEffect(() => {
    if (!svgRef.current) return;

    // cancel previous animation and cleanup if any
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    const parentWidth = svgRef.current.parentElement?.offsetWidth || 800;
    const width = parentWidth;
    const height = 250;

    // Aggregate
    const cashtagCounts = data.reduce((acc, { name, value }) => {
      acc[name] = (acc[name] || 0) + value;
      return acc;
    }, {});
    const bubbleData = Object.entries(cashtagCounts).map(([name, value]) => ({ name, value }));

    const svg = d3.select(svgRef.current).attr("width", width).attr("height", height);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    if (bubbleData.length === 0) {
      g.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", 16)
        .attr("fill", "#fff")
        .text("No data available");
      return;
    }

    // Radius scale with equal-domain guard
    const [vmin, vmax] = d3.extent(bubbleData, d => d.value);
    const minR = 20, maxR = 40;
    const domainMin = vmin ?? 0;
    const domainMax = vmax ?? 1;
    const safeMax = domainMax === domainMin ? domainMin + 1 : domainMax;
    const radiusScale = d3.scaleSqrt().domain([domainMin, safeMax]).range([minR, maxR]);

    // Initial positions (no wobble, straight up)
    const floating = bubbleData.map((d) => ({
      ...d,
      x: Math.random() * (width - 100) + 50,
      y: Math.random() * (height - 100) + 50,
      r: radiusScale(d.value),
      // wobble params set to zero for straight upward motion
      phaseX: 0,
      phaseY: 0,
      speedX: 0,
      speedY: 0,
      ampX: 0,
      ampY: 0,
      dragging: false,
    }));

    const drag = d3.drag()
      .on("start", (event, d) => { d.dragging = true; })
      .on("drag", (event, d) => { d.x = event.x; d.y = event.y; })
      .on("end", (event, d) => { d.dragging = false; });

    const node = g.selectAll("g.bubble")
      .data(floating)
      .enter()
      .append("g")
      .attr("class", "bubble")
      .call(drag)
      .style("cursor", "pointer");

    node.append("circle")
      .attr("r", d => d.r)
      .attr("fill", "#4ED342")
      .attr("fill-opacity", 0.1)
      .attr("stroke", "#4ED342")
      .attr("stroke-opacity", 0.5)
      .attr("stroke-width", 2)
      .on("mouseover", function () {
        d3.select(this).transition().duration(150)
          .attr("fill-opacity", 0.2)
          .attr("stroke-opacity", 1);
      })
      .on("mouseout", function () {
        d3.select(this).transition().duration(150)
          .attr("fill-opacity", 0.1)
          .attr("stroke-opacity", 0.5);
      });

    node.append("text")
      .text(d => `$${d.name}`)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "#fff")
      .attr("pointer-events", "none")
      .attr("font-size", d => Math.min(d.r * 0.6, 16));

    // Animation params
    const SCROLL_PX_PER_60FPS = 0.22; // upward drift per ~60fps frame
    let last = performance.now();

    const tick = () => {
      const now = performance.now();
      const dtMs = Math.min(now - last, 33); // clamp big tab-inactive jumps
      last = now;
      const dtNorm = dtMs / 16.67; // ~60fps units

      floating.forEach((b, i) => {
        if (!b.dragging) {
          // upward drift
          b.y -= SCROLL_PX_PER_60FPS * dtNorm;

          // wrap to bottom
          if (b.y < -b.r) {
            b.y = height + b.r;
            b.x = Math.random() * (width - 100) + 50;
          }
          b.x = Math.max(50, Math.min(width - 50, b.x));

          d3.select(node.nodes()[i]).attr("transform", `translate(${b.x},${b.y})`);
        }
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    // Initial draw
    node.attr("transform", d => `translate(${d.x},${d.y})`);
    rafRef.current = requestAnimationFrame(tick);

    const onResize = () => {
      const pw = svgRef.current?.parentElement?.offsetWidth;
      if (typeof pw === "number") svg.attr("width", pw);
    };
    window.addEventListener("resize", onResize);

    cleanupRef.current = () => {
      window.removeEventListener("resize", onResize);
      svg.selectAll("*").remove();
    };

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      if (cleanupRef.current) cleanupRef.current();
      cleanupRef.current = null;
    };
  }, [data]);

  return (
    <>
      {bubbleIsLoading ? (
        <Card className="w-full h-[200px] space-y-5 p-4 bg-[#3139464f]" radius="lg">
          <Skeleton className="rounded-lg bg-[#3139464f]">
            <div className="max-h-[200px] w-full rounded-lg bg-[#3139464f]" />
          </Skeleton>
        </Card>
      ) : (
        <div className="p-0 m-0 w-full" style={{ display: "flex", justifyContent: "center" }}>
          <svg ref={svgRef} />
        </div>
      )}
    </>
  );
};

BubbleMap.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
  })).isRequired,
  bubbleIsLoading: PropTypes.bool,
};

export default BubbleMap;
