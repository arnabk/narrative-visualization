import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { CarData } from '../CarsNarrative';

interface Scene1OverviewProps {
  data: CarData[];
  onNext: () => void;
}

const Scene1Overview: React.FC<Scene1OverviewProps> = ({ data, onNext }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current);
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.Horsepower) || 0])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.Miles_per_Gallon) || 0])
      .range([height, 0]);

    const colorScale = d3.scaleOrdinal()
      .domain(Array.from(new Set(data.map(d => d.Origin))))
      .range(d3.schemeCategory10);

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .append("text")
      .attr("fill", "#000")
      .attr("x", width / 2)
      .attr("y", 40)
      .attr("text-anchor", "middle")
      .text("Horsepower");

    g.append("g")
      .call(d3.axisLeft(yScale))
      .append("text")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .text("Miles per Gallon");

    // Add scatter plot points
    g.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", d => xScale(d.Horsepower))
      .attr("cy", d => yScale(d.Miles_per_Gallon))
      .attr("r", 4)
      .attr("fill", d => colorScale(d.Origin) as string)
      .attr("opacity", 0.7)
      .on("mouseover", function(this: SVGCircleElement, event: MouseEvent, d: CarData) {
        d3.select(this).attr("r", 6).attr("opacity", 1);
        
        // Add tooltip
        const tooltip = d3.select("body").append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("background", "rgba(0,0,0,0.8)")
          .style("color", "white")
          .style("padding", "8px")
          .style("border-radius", "4px")
          .style("font-size", "12px")
          .style("pointer-events", "none");
        
        tooltip.html(`
          <strong>${d.Name}</strong><br/>
          Horsepower: ${d.Horsepower}<br/>
          MPG: ${d.Miles_per_Gallon}<br/>
          Origin: ${d.Origin}<br/>
          Year: ${d.Year}
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function(this: SVGCircleElement) {
        d3.select(this).attr("r", 4).attr("opacity", 0.7);
        d3.selectAll(".tooltip").remove();
      });

    // Add legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width + margin.left + 10}, ${margin.top})`);

    const origins = Array.from(new Set(data.map(d => d.Origin)));
    origins.forEach((origin, i) => {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 25})`);
      
      legendRow.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", colorScale(origin) as string)
        .attr("stroke", "#333")
        .attr("stroke-width", 0.5);
      
      legendRow.append("text")
        .attr("x", 18)
        .attr("y", 8)
        .attr("text-anchor", "start")
        .style("font-size", "12px")
        .style("fill", "#333")
        .style("font-weight", "500")
        .text(origin);
    });

    // Add subtle background regions to highlight patterns
    const backgroundRegions = [
      {
        x: xScale(0),
        y: yScale(35),
        width: xScale(80) - xScale(0),
        height: yScale(45) - yScale(35),
        color: "rgba(144, 238, 144, 0.1)",
        label: "High Efficiency Region"
      },
      {
        x: xScale(150),
        y: yScale(0),
        width: xScale(220) - xScale(150),
        height: yScale(20) - yScale(0),
        color: "rgba(255, 182, 193, 0.1)",
        label: "High Power Region"
      }
    ];

    backgroundRegions.forEach(region => {
      g.append("rect")
        .attr("x", region.x)
        .attr("y", region.y)
        .attr("width", region.width)
        .attr("height", region.height)
        .attr("fill", region.color)
        .attr("stroke", "none");
    });

    // Add arrow marker
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 8)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#333");

  }, [data]);

  // Calculate summary statistics
  const totalCars = data.length;
  const avgMPG = d3.mean(data, d => d.Miles_per_Gallon)?.toFixed(1) || '0';
  const avgHorsepower = d3.mean(data, d => d.Horsepower)?.toFixed(1) || '0';
  const yearRange = `${d3.min(data, d => d.Year)} - ${d3.max(data, d => d.Year)}`;
  const origins = Array.from(new Set(data.map(d => d.Origin)));

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Welcome to the Cars Dataset
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          This dataset contains information about {totalCars} cars from {yearRange}, 
          including performance metrics, efficiency data, and manufacturing details.
        </p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{totalCars}</div>
          <div className="text-sm text-gray-600">Total Cars</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{avgMPG}</div>
          <div className="text-sm text-gray-600">Avg MPG</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-600">{avgHorsepower}</div>
          <div className="text-sm text-gray-600">Avg Horsepower</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">{origins.length}</div>
          <div className="text-sm text-gray-600">Regions</div>
        </div>
      </div>

      {/* Main Visualization */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Horsepower vs. Fuel Efficiency
        </h3>
        <p className="text-gray-600 mb-4">
          Explore the relationship between engine power and fuel economy across different regions
        </p>
        <svg
          ref={svgRef}
          width="900"
          height="500"
          className="mx-auto border border-gray-200 rounded-lg"
        />
      </div>

      {/* Annotations Section - Required by assignment */}
      <div className="mt-8 bg-gray-50 p-6 rounded-lg">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Key Insights</h4>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
            <h5 className="font-semibold text-blue-700 mb-2">Key Insight</h5>
            <p className="text-gray-700">
              Strong negative correlation: More horsepower typically means lower fuel efficiency. 
              This fundamental trade-off is evident across all regions.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
            <h5 className="font-semibold text-green-700 mb-2">Regional Pattern</h5>
            <p className="text-gray-700">
              European cars tend to be more fuel efficient, clustering in the upper-left region 
              of the chart with higher MPG and lower horsepower.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-center pt-6">
        <button
          onClick={onNext}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Explore by Manufacturer →
        </button>
      </div>
    </div>
  );
};

export default Scene1Overview; 