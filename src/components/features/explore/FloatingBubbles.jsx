import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import * as d3 from "d3";

export default function FloatingBubbles({ data, height = 500, onBubbleClick, timeframe = '24h', loadingToken = null }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredBubble, setHoveredBubble] = useState(null);
  const [tooltipData, setTooltipData] = useState(null);
  const simulationRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Update dimensions on resize
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: height
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [height]);

  // Apply visual feedback when a bubble is loading
  useEffect(() => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const allBubbles = svg.selectAll("g");
    
    if (loadingToken) {
      // Dim all bubbles except the loading one
      allBubbles.each(function(d) {
        const bubble = d3.select(this);
        if (d.symbol === loadingToken) {
          // Highlight the loading bubble
          bubble.select("circle")
            .style("opacity", 1)
            .style("filter", "brightness(1.5) drop-shadow(0 0 10px rgba(49, 244, 110, 0.6))");
          bubble.select("text")
            .style("opacity", 1);
        } else {
          // Dim other bubbles
          bubble.select("circle")
            .style("opacity", 0.3)
            .style("filter", "brightness(0.5)");
          bubble.selectAll("text")
            .style("opacity", 0.3);
        }
      });
      
      // Slow down simulation
      if (simulationRef.current) {
        simulationRef.current.alphaTarget(0.1).restart();
      }
    } else {
      // Reset all bubbles to normal
      allBubbles.each(function(d) {
        const bubble = d3.select(this);
        bubble.select("circle")
          .style("opacity", 1)
          .style("filter", "brightness(1)");
        bubble.selectAll("text")
          .style("opacity", 1);
      });
      
      // Resume normal simulation speed
      if (simulationRef.current) {
        simulationRef.current.alphaTarget(0);
      }
    }
  }, [loadingToken]);

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current || dimensions.width === 0) return;

    // Clear previous visualization and stop old simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
    }
    d3.select(svgRef.current).selectAll("*").remove();

    const width = dimensions.width;
    const svg = d3.select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", width)
      .attr("height", height);

    // Calculate bubble sizes based on % change (absolute value)
    // Bigger movement = bigger bubble (regardless of direction)
    const priceChanges = data.map(d => Math.abs(d.priceChange));
    const maxChange = Math.max(...priceChanges);
    const minChange = Math.min(...priceChanges);
    
    // Responsive sizing based on viewport
    const isMobile = width < 768;
    const baseMinSize = isMobile ? 20 : 18; // Smaller minimum for better fit
    const sizeRange = isMobile ? 50 : 52; // Wider range for better distribution
    
    const nodes = data.map((d, i) => {
      // Use absolute value of price change for size
      const absChange = Math.abs(d.priceChange);
      
      // Normalize based on the range of changes
      const normalizedValue = maxChange > minChange 
        ? (absChange - minChange) / (maxChange - minChange)
        : 0.5;
      
      // Apply exponential scaling for more dramatic size differences
      // This makes small bubbles much smaller and large ones stand out
      const exponentialValue = Math.pow(normalizedValue, 1.3);
      const radius = baseMinSize + (exponentialValue * sizeRange);
      
      return {
        ...d,
        radius,
        // Spread bubbles across full width (with padding)
        x: radius + Math.random() * (width - radius * 2),
        y: radius + Math.random() * (height - radius * 2),
        vx: (Math.random() - 0.5) * 0.5, // Small initial velocity for liveliness
        vy: (Math.random() - 0.5) * 0.5,
      };
    });

    // Helper function to get color based on price change
    const getBubbleColor = (priceChange) => {
      const isPositive = priceChange >= 0;
      const magnitude = Math.abs(priceChange);

      if (isPositive) {
        // Green shades for positive
        if (magnitude > 20) return { bg: 'rgba(34, 197, 94, 0.25)', border: 'rgb(34, 197, 94)' };
        if (magnitude > 10) return { bg: 'rgba(34, 197, 94, 0.2)', border: 'rgb(34, 197, 94, 0.8)' };
        if (magnitude > 5) return { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgb(34, 197, 94, 0.6)' };
        return { bg: 'rgba(34, 197, 94, 0.1)', border: 'rgb(34, 197, 94, 0.4)' };
      } else {
        // Red shades for negative
        if (magnitude > 20) return { bg: 'rgba(239, 68, 68, 0.25)', border: 'rgb(239, 68, 68)' };
        if (magnitude > 10) return { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgb(239, 68, 68, 0.8)' };
        if (magnitude > 5) return { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgb(239, 68, 68, 0.6)' };
        return { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgb(239, 68, 68, 0.4)' };
      }
    };

    // Create D3 force simulation for gentle bouncing bubbles
    const simulation = d3.forceSimulation(nodes)
      .velocityDecay(0.6) // Much higher decay = calmer movement
      .alphaDecay(0.02) // Slower cooling = smoother settling
      .force("charge", d3.forceManyBody().strength(1)) // Weaker repulsion
      .force("collision", d3.forceCollide().radius(d => d.radius + 3).strength(0.9).iterations(3)) // Strong collision avoidance
      .force("x", d3.forceX(width / 2).strength(0.005)) // Very weak centering
      .force("y", d3.forceY(height / 2).strength(0.005)) // Very weak centering
      .force("boundary", () => {
        nodes.forEach(node => {
          // Keep within bounds with damping
          const padding = 2;
          if (node.x - node.radius < padding) {
            node.x = node.radius + padding;
            node.vx *= -0.5; // Dampen on bounce
          }
          if (node.x + node.radius > width - padding) {
            node.x = width - node.radius - padding;
            node.vx *= -0.5;
          }
          if (node.y - node.radius < padding) {
            node.y = node.radius + padding;
            node.vy *= -0.5;
          }
          if (node.y + node.radius > height - padding) {
            node.y = height - node.radius - padding;
            node.vy *= -0.5;
          }
        });
      });

    simulationRef.current = simulation;

    // Create bubble groups
    const bubbleGroup = svg.selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        if (onBubbleClick) {
          onBubbleClick(d.symbol);
        }
      })
      .on("mouseenter", (event, d) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setHoveredBubble(d.symbol);
        setTooltipData({
          name: d.name,
          symbol: d.symbol,
          rank: d.rank,
          x: d.x,
          y: d.y - d.radius - 10
        });
        
        d3.select(event.currentTarget).select("circle")
          .transition()
          .duration(200)
          .attr("r", d.radius * 1.1)
          .style("filter", "brightness(1.3)");
      })
      .on("mouseleave", (event, d) => {
        setHoveredBubble(null);
        setTooltipData(null);
        
        d3.select(event.currentTarget).select("circle")
          .transition()
          .duration(200)
          .attr("r", d.radius)
          .style("filter", "brightness(1)");
      });

    // Add circles
    bubbleGroup.append("circle")
      .attr("r", d => d.radius)
      .style("fill", d => getBubbleColor(d.priceChange).bg)
      .style("stroke", d => getBubbleColor(d.priceChange).border)
      .style("stroke-width", "2px");

    // Add token symbol text
    // Font size scales proportionally with bubble radius
    bubbleGroup.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", d => d.radius > 40 ? "-0.3em" : "0.1em") // Adjust position based on size
      .style("fill", "white")
      .style("font-size", d => {
        // Scale font proportionally: roughly 0.28x the bubble radius
        const fontSize = Math.max(8, Math.min(20, d.radius * 0.28));
        return `${fontSize}px`;
      })
      .style("font-weight", "700")
      .style("pointer-events", "none")
      .style("user-select", "none")
      .style("text-transform", "uppercase")
      .text(d => d.symbol);

    // Add percentage change text (subtle, smaller) - only for larger bubbles
    bubbleGroup.filter(d => d.radius > 35)
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.1em")
      .style("fill", d => d.priceChange >= 0 ? "rgba(34, 197, 94, 0.9)" : "rgba(239, 68, 68, 0.9)")
      .style("font-size", d => {
        const fontSize = Math.max(6, Math.min(12, d.radius * 0.18));
        return `${fontSize}px`;
      })
      .style("font-weight", "600")
      .style("pointer-events", "none")
      .style("user-select", "none")
      .text(d => {
        const change = d.priceChange;
        return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
      });

    // Animation loop
    simulation.on("tick", () => {
      bubbleGroup.attr("transform", d => `translate(${d.x},${d.y})`);
      
      // Update tooltip position if visible
      if (tooltipData) {
        const node = nodes.find(n => n.symbol === hoveredBubble);
        if (node) {
          setTooltipData(prev => ({
            ...prev,
            x: node.x,
            y: node.y - node.radius - 10
          }));
        }
      }
    });

    // Cleanup
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
      d3.select(svgRef.current).selectAll("*").remove();
    };
  }, [data, dimensions, height, onBubbleClick, timeframe]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: `${height}px`,
        background: 'transparent',
        overflow: 'visible',
        position: 'relative',
      }}
    >
      <svg
        ref={svgRef}
        style={{
          width: '100%',
          height: '100%',
        }}
      />
      
      {/* Tooltip - shown on hover like CryptoBubbles */}
      {tooltipData && (
        <div
          style={{
            position: 'absolute',
            left: `${tooltipData.x}px`,
            top: `${tooltipData.y}px`,
            transform: 'translate(-50%, -100%)',
            background: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 1000,
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          {tooltipData.name} {tooltipData.symbol && `(${tooltipData.symbol.toUpperCase()})`} {tooltipData.rank && `- Rank #${tooltipData.rank}`}
        </div>
      )}
    </div>
  );
}

FloatingBubbles.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      symbol: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
      priceChange: PropTypes.number.isRequired,
      rank: PropTypes.number,
    })
  ),
  height: PropTypes.number,
  onBubbleClick: PropTypes.func,
  timeframe: PropTypes.string,
  loadingToken: PropTypes.string,
};
