import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { CarData } from '../CarsNarrative';

interface Scene2ManufacturerAnalysisProps {
  data: CarData[];
  selectedManufacturer: string | null;
  onManufacturerSelect: (manufacturer: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const Scene2ManufacturerAnalysis: React.FC<Scene2ManufacturerAnalysisProps> = ({
  data,
  selectedManufacturer,
  onManufacturerSelect,
  onNext,
  onBack
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [manufacturers, setManufacturers] = useState<string[]>([]);

  useEffect(() => {
    if (!data.length) return;

    // Extract manufacturer names from car names
    const manufacturerSet = new Set<string>();
    data.forEach(car => {
      const manufacturer = car.Name.split(' ')[0];
      manufacturerSet.add(manufacturer);
    });
    setManufacturers(Array.from(manufacturerSet).sort());
  }, [data]);

  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current);
    const margin = { top: 60, right: 40, bottom: 80, left: 60 }; // Increased top margin for annotations
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Calculate average MPG by manufacturer
    const manufacturerStats = manufacturers.map(manufacturer => {
      const manufacturerCars = data.filter(car => car.Name.startsWith(manufacturer));
      return {
        manufacturer,
        avgMPG: d3.mean(manufacturerCars, d => d.Miles_per_Gallon) || 0,
        avgHorsepower: d3.mean(manufacturerCars, d => d.Horsepower) || 0,
        count: manufacturerCars.length
      };
    }).filter(stat => stat.count >= 1); // Show all manufacturers with at least 1 car

    // Sort by average MPG
    manufacturerStats.sort((a, b) => b.avgMPG - a.avgMPG);

    // Create scales
    const xScale = d3.scaleBand()
      .domain(manufacturerStats.map(d => d.manufacturer))
      .range([0, width])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(manufacturerStats, d => d.avgMPG) || 0])
      .range([height, 0]);

    // Use consistent color scale with other scenes
    const colorScale = d3.scaleOrdinal()
      .domain(manufacturerStats.map(d => d.manufacturer))
      .range(d3.schemeCategory10);

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    g.append("g")
      .call(d3.axisLeft(yScale))
      .append("text")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .text("Average MPG");

    // Create 3D gradient for bars
    const barGradient = svg.append("defs").append("linearGradient")
      .attr("id", "barGradient")
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "0%").attr("y2", "100%");
    
    barGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#FFFFFF")
      .attr("stop-opacity", 0.3);
    
    barGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#000000")
      .attr("stop-opacity", 0.1);
    
    // Add 3D bars with shadows and gradients
    g.selectAll("rect")
      .data(manufacturerStats)
      .enter()
      .append("rect")
      .attr("x", d => xScale(d.manufacturer) || 0)
      .attr("y", d => yScale(d.avgMPG))
      .attr("width", xScale.bandwidth())
      .attr("height", d => height - yScale(d.avgMPG))
      .attr("fill", d => colorScale(d.manufacturer) as string)
      .attr("stroke", d => selectedManufacturer && d.manufacturer === selectedManufacturer ? "#333" : "none")
      .attr("stroke-width", d => selectedManufacturer && d.manufacturer === selectedManufacturer ? 3 : 0)
      .attr("opacity", d => selectedManufacturer ? (d.manufacturer === selectedManufacturer ? 1 : 0.4) : 0.8)
      .style("cursor", "pointer")
      .style("filter", d => selectedManufacturer && d.manufacturer === selectedManufacturer ? 
        "drop-shadow(0 4px 8px rgba(0,0,0,0.2))" : "drop-shadow(0 1px 2px rgba(0,0,0,0.1))")
      .on("click", function(event, d) {
        onManufacturerSelect(d.manufacturer);
      })
      .on("mouseover", function(this: SVGRectElement, event: MouseEvent, d: any) {
        // Don't show tooltip for already selected bar
        if (selectedManufacturer && d.manufacturer === selectedManufacturer) {
          return;
        }
        
        if (!selectedManufacturer || d.manufacturer !== selectedManufacturer) {
          d3.select(this).attr("opacity", 1).attr("stroke", "#333").attr("stroke-width", 2);
        }
        
        // Add tooltip
        const tooltip = d3.select("body").append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("background", "rgba(0,0,0,0.9)")
          .style("color", "white")
          .style("padding", "10px")
          .style("border-radius", "6px")
          .style("font-size", "12px")
          .style("pointer-events", "none")
          .style("box-shadow", "0 2px 8px rgba(0,0,0,0.3)")
          .style("border", "1px solid #333");
        
        tooltip.html(`
          <strong>${d.manufacturer}</strong><br/>
          Average MPG: ${d.avgMPG.toFixed(1)}<br/>
          Average HP: ${d.avgHorsepower.toFixed(1)}<br/>
          Number of cars: ${d.count}<br/>
          <em>Click to select</em>
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function(this: SVGRectElement, event: MouseEvent, d: any) {
        if (!selectedManufacturer || d.manufacturer !== selectedManufacturer) {
          d3.select(this).attr("opacity", 0.4).attr("stroke", "none").attr("stroke-width", 0);
        }
        d3.selectAll(".tooltip").remove();
      });

    // Add value labels on bars
    g.selectAll("text")
      .data(manufacturerStats)
      .enter()
      .append("text")
      .attr("x", d => (xScale(d.manufacturer) || 0) + xScale.bandwidth() / 2)
      .attr("y", d => yScale(d.avgMPG) - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text(d => d.avgMPG.toFixed(1));

    // Add annotation for selected manufacturer
    if (selectedManufacturer) {
      const selected = manufacturerStats.find(d => d.manufacturer === selectedManufacturer);
      if (selected) {
        const annotationGroup = g.append("g");
        
        // Create 3D floating annotation with shadow and depth
        const barX = (xScale(selected.manufacturer) || 0) + xScale.bandwidth() / 2;
        const barY = yScale(selected.avgMPG);
        
        // Add main 3D annotation box with integrated shadow
        const gradient = svg.append("defs").append("linearGradient")
          .attr("id", "annotationGradient")
          .attr("x1", "0%").attr("y1", "0%")
          .attr("x2", "0%").attr("y2", "100%");
        
        gradient.append("stop")
          .attr("offset", "0%")
          .attr("stop-color", "#FF6B6B");
        
        gradient.append("stop")
          .attr("offset", "100%")
          .attr("stop-color", "#E53E3E");
        
        annotationGroup.append("rect")
          .attr("x", barX - 35)
          .attr("y", barY - 40)
          .attr("width", 70)
          .attr("height", 25)
          .attr("fill", "url(#annotationGradient)")
          .attr("rx", 5)
          .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.3))");
        
        // Add 3D text with emboss effect
        annotationGroup.append("text")
          .attr("x", barX)
          .attr("y", barY - 25)
          .attr("text-anchor", "middle")
          .style("font-size", "11px")
          .style("font-weight", "bold")
          .style("fill", "white")
          .style("filter", "drop-shadow(0 1px 2px rgba(0,0,0,0.5))")
          .text(`${selected.avgMPG.toFixed(1)} MPG`);
      }
    }

  }, [data, manufacturers, selectedManufacturer, onManufacturerSelect]);

  // Filter data for selected manufacturer
  const selectedManufacturerData = selectedManufacturer 
    ? data.filter(car => car.Name.startsWith(selectedManufacturer))
    : [];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Manufacturer Analysis
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          Explore how different car manufacturers compare in terms of fuel efficiency. 
          <span className="font-semibold text-blue-600"> Click on any bar below to select a manufacturer</span> and see detailed information.
        </p>
      </div>

      {/* Manufacturer Selection */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        <button
          onClick={() => onManufacturerSelect('')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            !selectedManufacturer 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Manufacturers
        </button>
        {manufacturers.slice(0, 10).map(manufacturer => (
          <button
            key={manufacturer}
            onClick={() => onManufacturerSelect(manufacturer)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedManufacturer === manufacturer 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {manufacturer}
          </button>
        ))}
      </div>

      {/* Main Visualization */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Average Fuel Efficiency by Manufacturer
        </h3>
        <p className="text-gray-600 mb-4">
          {selectedManufacturer 
            ? `Showing details for ${selectedManufacturer} (${selectedManufacturerData.length} cars)`
            : 'Click on a bar to explore a specific manufacturer'
          }
        </p>
        <svg
          ref={svgRef}
          width="800"
          height="500"
          className="mx-auto border border-gray-200 rounded-lg shadow-lg"
        />
      </div>

      {/* Selected Manufacturer Details */}
      {selectedManufacturer && selectedManufacturerData.length > 0 && (
        <div className="bg-blue-50 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            {selectedManufacturer} Details
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{selectedManufacturerData.length}</div>
              <div className="text-sm text-gray-600">Total Cars</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {d3.mean(selectedManufacturerData, d => d.Miles_per_Gallon)?.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Avg MPG</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {d3.mean(selectedManufacturerData, d => d.Horsepower)?.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Avg Horsepower</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {d3.mean(selectedManufacturerData, d => d.Weight_in_lbs)?.toFixed(0)}
              </div>
              <div className="text-sm text-gray-600">Avg Weight (lbs)</div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          ← Back to Overview
        </button>
        <button
          onClick={onNext}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Explore Year Trends →
        </button>
      </div>
    </div>
  );
};

export default Scene2ManufacturerAnalysis; 