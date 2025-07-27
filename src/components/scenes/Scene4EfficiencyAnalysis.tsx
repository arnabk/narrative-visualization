import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { CarData } from '../CarsNarrative';

interface Scene4EfficiencyAnalysisProps {
  data: CarData[];
  selectedOrigin: string | null;
  onOriginSelect: (origin: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const Scene4EfficiencyAnalysis: React.FC<Scene4EfficiencyAnalysisProps> = ({
  data,
  selectedOrigin,
  onOriginSelect,
  onNext,
  onBack
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [origins, setOrigins] = useState<string[]>([]);

  useEffect(() => {
    if (!data.length) return;
    // Get unique origins
    const originSet = new Set(data.map(car => car.Origin));
    setOrigins(Array.from(originSet).sort());
  }, [data]);

  useEffect(() => {
    if (!origins.length || !svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current);
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const width = 1000 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Calculate statistics by origin
    const originStats = origins.map(origin => {
      const originCars = data.filter(car => car.Origin === origin);
      return {
        origin,
        avgMPG: d3.mean(originCars, d => d.Miles_per_Gallon) || 0,
        avgHorsepower: d3.mean(originCars, d => d.Horsepower) || 0,
        avgWeight: d3.mean(originCars, d => d.Weight_in_lbs) || 0,
        avgAcceleration: d3.mean(originCars, d => d.Acceleration) || 0,
        count: originCars.length
      };
    });

    // Sort by average MPG
    originStats.sort((a, b) => b.avgMPG - a.avgMPG);

    // Create scales
    const xScale = d3.scaleBand()
      .domain(originStats.map(d => d.origin))
      .range([0, width])
      .padding(0.2);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(originStats, d => d.avgMPG) || 0])
      .range([height, 0]);

    const colorScale = d3.scaleOrdinal()
      .domain(Array.from(new Set(data.map(d => d.Origin))))
      .range(d3.schemeCategory10);

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    g.append("g")
      .call(d3.axisLeft(yScale))
      .append("text")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .text("Average MPG");

    // Add bars
    g.selectAll("rect")
      .data(originStats)
      .enter()
      .append("rect")
      .attr("x", d => xScale(d.origin) || 0)
      .attr("y", d => yScale(d.avgMPG))
      .attr("width", xScale.bandwidth())
      .attr("height", d => height - yScale(d.avgMPG))
      .attr("fill", d => colorScale(d.origin) as string)
      .attr("opacity", d => selectedOrigin ? (d.origin === selectedOrigin ? 1 : 0.3) : 0.8)
      .on("click", function(event, d) {
        onOriginSelect(d.origin);
      })
      .on("mouseover", function(this: SVGRectElement, event: MouseEvent, d: any) {
        d3.select(this).attr("opacity", 1);
        
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
          <strong>${d.origin}</strong><br/>
          Average MPG: ${d.avgMPG.toFixed(1)}<br/>
          Average HP: ${d.avgHorsepower.toFixed(1)}<br/>
          Average Weight: ${d.avgWeight.toFixed(0)} lbs<br/>
          Number of cars: ${d.count}
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function(this: SVGRectElement) {
        d3.select(this).attr("opacity", selectedOrigin ? 0.3 : 0.8);
        d3.selectAll(".tooltip").remove();
      });

    // Add value labels on bars
    g.selectAll("text")
      .data(originStats)
      .enter()
      .append("text")
      .attr("x", d => (xScale(d.origin) || 0) + xScale.bandwidth() / 2)
      .attr("y", d => yScale(d.avgMPG) - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text(d => d.avgMPG.toFixed(1));

    // Add 3D annotation for selected origin
    if (selectedOrigin) {
      const selected = originStats.find(d => d.origin === selectedOrigin);
      if (selected) {
        const annotationGroup = g.append("g");
        
        const barX = (xScale(selected.origin) || 0) + xScale.bandwidth() / 2;
        const barY = yScale(selected.avgMPG);
        
        // Add 3D annotation box with integrated shadow
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

  }, [data, origins, selectedOrigin, onOriginSelect]);

  // Filter data for selected origin
  const selectedOriginData = selectedOrigin 
    ? data.filter(car => car.Origin === selectedOrigin)
    : [];

  // Create efficiency vs performance scatter plot
  const EfficiencyScatter = () => {
    const scatterRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
      if (!data.length || !scatterRef.current) return;

      // Clear previous content
      d3.select(scatterRef.current).selectAll("*").remove();

      const svg = d3.select(scatterRef.current);
      const margin = { top: 40, right: 40, bottom: 60, left: 60 };
      const width = 800 - margin.left - margin.right;
      const height = 500 - margin.top - margin.bottom;

      const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Filter data based on selected origin
      const plotData = selectedOrigin ? data.filter(car => car.Origin === selectedOrigin) : data;

      // Create scales
      const xScale = d3.scaleLinear()
        .domain([0, d3.max(plotData, d => d.Horsepower) || 0])
        .range([0, width]);

      const yScale = d3.scaleLinear()
        .domain([0, d3.max(plotData, d => d.Miles_per_Gallon) || 0])
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
        .text("MPG");

      // Add scatter plot points with hover effects
      g.selectAll("circle")
        .data(plotData)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.Horsepower))
        .attr("cy", d => yScale(d.Miles_per_Gallon))
        .attr("r", 6)
        .attr("fill", d => colorScale(d.Origin) as string)
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .attr("opacity", 0.7)
        .style("cursor", "pointer")
        .on("mouseover", function(this: SVGCircleElement, event: MouseEvent, d: any) {
          d3.select(this).attr("r", 8).attr("opacity", 1);
          
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
            .style("box-shadow", "0 4px 12px rgba(0,0,0,0.3)")
            .style("border", "1px solid #333");
          
          tooltip.html(`
            <strong>${d.Name}</strong><br/>
            Horsepower: ${d.Horsepower}<br/>
            MPG: ${d.Miles_per_Gallon}<br/>
            Weight: ${d.Weight_in_lbs} lbs<br/>
            Origin: ${d.Origin}<br/>
            Year: ${d.Year}
          `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function(this: SVGCircleElement) {
          d3.select(this).attr("r", 6).attr("opacity", 0.7);
          d3.selectAll(".tooltip").remove();
        });

      // Add legend for scatter plot (positioned outside chart area like Scene 1)
      const legend = svg.append("g")
        .attr("transform", `translate(${width + margin.left + 30}, ${margin.top})`);
      
      const allOrigins = Array.from(new Set(data.map(d => d.Origin)));
      allOrigins.forEach((origin, i) => {
        const legendItem = legend.append("g")
          .attr("transform", `translate(0, ${i * 25})`);
        
        legendItem.append("circle")
          .attr("r", 6)
          .attr("fill", colorScale(origin) as string)
          .attr("stroke", "white")
          .attr("stroke-width", 2);
        
        legendItem.append("text")
          .attr("x", 15)
          .attr("y", 4)
          .style("font-size", "14px")
          .style("fill", "#333")
          .style("font-weight", "bold")
          .text(origin);
      });

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, origins, selectedOrigin]);

    return (
      <svg
        ref={scatterRef}
        width="1000"
        height="500"
        className="mx-auto border border-gray-200 rounded-lg"
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Regional Efficiency Analysis
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          Compare fuel efficiency across different regions and explore the relationship 
          between performance and efficiency within each region.
        </p>
      </div>

      {/* Origin Selection with Statistics */}
      <div className="flex flex-wrap gap-3 justify-center mb-6">
        <button
          onClick={() => onOriginSelect('')}
          className={`px-4 py-3 rounded-lg transition-colors text-left ${
            !selectedOrigin 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <div className="font-semibold">All Regions</div>
          <div className="text-sm opacity-80">
            {data.length} cars • {d3.mean(data, d => d.Miles_per_Gallon)?.toFixed(1)} MPG avg
          </div>
        </button>
        {origins.map(origin => {
          const originData = data.filter(car => car.Origin === origin);
          const avgMPG = d3.mean(originData, d => d.Miles_per_Gallon) || 0;
          const avgHP = d3.mean(originData, d => d.Horsepower) || 0;
          const count = originData.length;
          
          return (
            <button
              key={origin}
              onClick={() => onOriginSelect(origin)}
              className={`px-4 py-3 rounded-lg transition-colors text-left ${
                selectedOrigin === origin 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <div className="font-semibold">{origin}</div>
              <div className="text-sm opacity-80">
                {count} cars • {avgMPG.toFixed(1)} MPG • {avgHP.toFixed(1)} HP
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Visualization */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Average Fuel Efficiency by Region
        </h3>
        <svg
          ref={svgRef}
          width="1000"
          height="500"
          className="mx-auto border border-gray-200 rounded-lg"
        />
      </div>

      {/* Efficiency vs Performance Analysis */}
      <div className="text-center">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          Efficiency vs Performance
        </h4>
        <p className="text-gray-600 mb-4">
          {selectedOrigin 
            ? `${selectedOrigin} cars: Horsepower vs MPG relationship`
            : 'All cars: Horsepower vs MPG relationship'
          }
        </p>
        <EfficiencyScatter />
      </div>

      {/* Selected Origin Details */}
      {selectedOrigin && selectedOriginData.length > 0 && (
        <div className="bg-blue-50 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            {selectedOrigin} Regional Analysis
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{selectedOriginData.length}</div>
              <div className="text-sm text-gray-600">Total Cars</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {d3.mean(selectedOriginData, d => d.Miles_per_Gallon)?.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Avg MPG</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {d3.mean(selectedOriginData, d => d.Horsepower)?.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Avg Horsepower</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {d3.mean(selectedOriginData, d => d.Weight_in_lbs)?.toFixed(0)}
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
          ← Back to Year Trends
        </button>
        <button
          onClick={onNext}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Detailed Exploration →
        </button>
      </div>
    </div>
  );
};

export default Scene4EfficiencyAnalysis; 