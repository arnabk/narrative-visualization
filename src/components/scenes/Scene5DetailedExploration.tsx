import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { CarData } from '../CarsNarrative';

interface Scene5DetailedExplorationProps {
  data: CarData[];
  selectedManufacturer: string | null;
  selectedYear: number | null;
  selectedOrigin: string | null;
  onBack: () => void;
  onReset: () => void;
  onManufacturerSelect: (manufacturer: string | null) => void;
  onYearSelect: (year: number | null) => void;
  onOriginSelect: (origin: string | null) => void;
}

const Scene5DetailedExploration: React.FC<Scene5DetailedExplorationProps> = ({
  data,
  selectedManufacturer,
  selectedYear,
  selectedOrigin,
  onBack,
  onReset,
  onManufacturerSelect,
  onYearSelect,
  onOriginSelect
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [filteredData, setFilteredData] = useState<CarData[]>(data);
  const [viewMode, setViewMode] = useState<'scatter' | 'parallel' | 'radar'>('scatter');

  // Apply filters
  useEffect(() => {
    let filtered = data;
    
    if (selectedManufacturer) {
      filtered = filtered.filter(car => car.Name.startsWith(selectedManufacturer));
    }
    
    if (selectedYear) {
      filtered = filtered.filter(car => car.Year && car.Year.toString().startsWith(selectedYear.toString()));
    }
    
    if (selectedOrigin) {
      filtered = filtered.filter(car => car.Origin === selectedOrigin);
    }
    
    setFilteredData(filtered);
  }, [data, selectedManufacturer, selectedYear, selectedOrigin]);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    // If no filtered data, show empty chart
    if (!filteredData.length) {
      const svg = d3.select(svgRef.current);
      const margin = { top: 40, right: 40, bottom: 60, left: 60 };
      const width = 1400 - margin.left - margin.right;
      const height = 500 - margin.top - margin.bottom;

      const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Add empty state message
      g.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("fill", "#666")
        .text("No data matches the current filters");

      return;
    }

    const svg = d3.select(svgRef.current);
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const width = 1400 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const renderScatterPlot = (g: d3.Selection<SVGGElement, unknown, null, undefined>, width: number, height: number) => {
      // Create scales
      const xScale = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.Horsepower) || 0])
        .range([0, width]);

      const yScale = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.Miles_per_Gallon) || 0])
        .range([height, 0]);

      const colorScale = d3.scaleOrdinal()
        .domain(Array.from(new Set(data.map(d => d.Origin))))
        .range(d3.schemeCategory10);

      const sizeScale = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.Weight_in_lbs) || 0])
        .range([3, 12]);

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
        .data(filteredData)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.Horsepower))
        .attr("cy", d => yScale(d.Miles_per_Gallon))
        .attr("r", d => sizeScale(d.Weight_in_lbs))
        .attr("fill", d => colorScale(d.Origin) as string)
        .attr("opacity", 0.7)
        .on("mouseover", function(this: SVGCircleElement, event: MouseEvent, d: CarData) {
          d3.select(this).attr("opacity", 1).attr("stroke", "#333").attr("stroke-width", 2);
          
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
            Weight: ${d.Weight_in_lbs} lbs<br/>
            Origin: ${d.Origin}<br/>
            Year: ${d.Year}
          `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function(this: SVGCircleElement) {
          d3.select(this).attr("opacity", 0.7).attr("stroke", "none");
          d3.selectAll(".tooltip").remove();
        });

      // Add legend inside the chart area (top-right corner)
      const legend = g.append("g")
        .attr("transform", `translate(${width - 100}, 20)`);

      const allOrigins = Array.from(new Set(data.map(d => d.Origin)));
      const filteredOrigins = Array.from(new Set(filteredData.map(d => d.Origin)));
      
      allOrigins.forEach((origin, i) => {
        const isPresent = filteredOrigins.includes(origin);
        const legendRow = legend.append("g")
          .attr("transform", `translate(0, ${i * 20})`);
        
        legendRow.append("rect")
          .attr("width", 12)
          .attr("height", 12)
          .attr("fill", colorScale(origin) as string)
          .attr("stroke", "#333")
          .attr("stroke-width", 0.5)
          .attr("opacity", isPresent ? 1 : 0.3);
        
        legendRow.append("text")
          .attr("x", 18)
          .attr("y", 8)
          .attr("text-anchor", "start")
          .attr("fill", "#000")
          .style("font-size", "12px")
          .attr("opacity", isPresent ? 1 : 0.5)
          .text(origin);
      });
    };

    const renderParallelCoordinates = (g: d3.Selection<SVGGElement, unknown, null, undefined>, width: number, height: number) => {
      const dimensions = ['Miles_per_Gallon', 'Horsepower', 'Weight_in_lbs', 'Acceleration'];
      const margin = { top: 20, right: 20, bottom: 20, left: 20 };
      const chartWidth = width - margin.left - margin.right;
      const chartHeight = height - margin.top - margin.bottom;

      const xScale = d3.scalePoint()
        .domain(dimensions)
        .range([0, chartWidth]);

      const yScales = dimensions.map(dim => 
        d3.scaleLinear()
          .domain(d3.extent(filteredData, d => d[dim as keyof CarData] as number) as [number, number])
          .range([chartHeight, 0])
      );

      const colorScale = d3.scaleOrdinal()
        .domain(Array.from(new Set(data.map(d => d.Origin))))
        .range(d3.schemeCategory10);

      // Add axes
      dimensions.forEach((dim, i) => {
        g.append("g")
          .attr("transform", `translate(${xScale(dim)},0)`)
          .call(d3.axisLeft(yScales[i]))
          .append("text")
          .attr("fill", "#000")
          .attr("transform", "rotate(-90)")
          .attr("y", -10)
          .attr("text-anchor", "end")
          .text(dim.replace(/_/g, ' '));
      });

      // Add lines
      g.selectAll("path")
        .data(filteredData)
        .enter()
        .append("path")
        .attr("d", d => {
          const points = dimensions.map((dim, i) => {
            const x = xScale(dim) || 0;
            const y = yScales[i](d[dim as keyof CarData] as number);
            return `${x},${y}`;
          });
          return `M${points.join('L')}`;
        })
        .attr("fill", "none")
        .attr("stroke", d => colorScale(d.Origin) as string)
        .attr("stroke-width", 1)
        .attr("opacity", 0.6);
    };

    const renderRadarChart = (g: d3.Selection<SVGGElement, unknown, null, undefined>, width: number, height: number) => {
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 2 - 40;

      const metrics = ['Miles_per_Gallon', 'Horsepower', 'Weight_in_lbs', 'Acceleration'];
      const angleStep = (2 * Math.PI) / metrics.length;

      // Calculate averages for each metric
      const averages = metrics.map(metric => 
        d3.mean(filteredData, d => d[metric as keyof CarData] as number) || 0
      );

      // Normalize values to 0-1 scale
      const maxValues = metrics.map(metric => 
        d3.max(filteredData, d => d[metric as keyof CarData] as number) || 0
      );
      const normalizedValues = averages.map((avg, i) => avg / maxValues[i]);

      // Draw radar grid
      for (let i = 1; i <= 5; i++) {
        const currentRadius = (radius * i) / 5;
        g.append("circle")
          .attr("cx", centerX)
          .attr("cy", centerY)
          .attr("r", currentRadius)
          .attr("fill", "none")
          .attr("stroke", "#ddd")
          .attr("stroke-width", 1);
      }

      // Draw axis lines
      metrics.forEach((metric, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        g.append("line")
          .attr("x1", centerX)
          .attr("y1", centerY)
          .attr("x2", x)
          .attr("y2", y)
          .attr("stroke", "#ddd")
          .attr("stroke-width", 1);

        // Add metric labels
        g.append("text")
          .attr("x", x + 10 * Math.cos(angle))
          .attr("y", y + 10 * Math.sin(angle))
          .attr("text-anchor", "middle")
          .style("font-size", "12px")
          .text(metric.replace(/_/g, ' '));
      });

      // Draw radar polygon
      const points = normalizedValues.map((value, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const r = radius * value;
        return `${centerX + r * Math.cos(angle)},${centerY + r * Math.sin(angle)}`;
      }).join(' ');

      g.append("polygon")
        .attr("points", points)
        .attr("fill", "rgba(70, 130, 180, 0.3)")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2);

      // Add value labels
      normalizedValues.forEach((value, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const r = radius * value;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);

        g.append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", 4)
          .attr("fill", "steelblue");

        g.append("text")
          .attr("x", x + 15 * Math.cos(angle))
          .attr("y", y + 15 * Math.sin(angle))
          .attr("text-anchor", "middle")
          .style("font-size", "10px")
          .text(averages[i].toFixed(1));
      });
    };

    if (viewMode === 'scatter') {
      renderScatterPlot(g, width, height);
    } else if (viewMode === 'parallel') {
      renderParallelCoordinates(g, width, height);
    } else if (viewMode === 'radar') {
      renderRadarChart(g, width, height);
    }

  }, [filteredData, viewMode, data, selectedManufacturer, selectedYear, selectedOrigin]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Detailed Exploration
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          Explore the filtered dataset with multiple visualization types. 
          Use different views to gain deeper insights into the car data.
        </p>
      </div>

      {/* Single Line Controls */}
      <div className="flex items-center justify-center gap-4 p-4">
        {/* Filter Dropdowns */}
        <div className="flex gap-3">
          {/* Manufacturer Dropdown */}
          <div className="relative">
            <select
              value={selectedManufacturer || ''}
              onChange={(e) => onManufacturerSelect(e.target.value || null)}
              className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-100 transition-colors"
            >
              <option value="">Manufacturer</option>
              {Array.from(new Set(data.map(car => car.Name.split(' ')[0])))
                .sort()
                .map(manufacturer => (
                  <option key={manufacturer} value={manufacturer}>
                    {manufacturer}
                  </option>
                ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Year Dropdown */}
          <div className="relative">
            <select
              value={selectedYear || ''}
              onChange={(e) => onYearSelect(e.target.value ? parseInt(e.target.value) : null)}
              className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-100 transition-colors"
            >
              <option value="">Year</option>
              {Array.from(new Set(data.map(car => car.Year.toString().split('-')[0])))
                .sort((a, b) => parseInt(a) - parseInt(b))
                .map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Origin Dropdown */}
          <div className="relative">
            <select
              value={selectedOrigin || ''}
              onChange={(e) => onOriginSelect(e.target.value || null)}
              className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-100 transition-colors"
            >
              <option value="">Origin</option>
              {Array.from(new Set(data.map(car => car.Origin)))
                .sort()
                .map(origin => (
                  <option key={origin} value={origin}>
                    {origin}
                  </option>
                ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* View Mode Selection */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('scatter')}
            className={`px-3 py-2 rounded-lg transition-colors text-sm ${
              viewMode === 'scatter' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Scatter Plot
          </button>
          <button
            onClick={() => setViewMode('parallel')}
            className={`px-3 py-2 rounded-lg transition-colors text-sm ${
              viewMode === 'parallel' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Parallel Coordinates
          </button>
          <button
            onClick={() => setViewMode('radar')}
            className={`px-3 py-2 rounded-lg transition-colors text-sm ${
              viewMode === 'radar' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Radar Chart
          </button>
        </div>

        {/* Clear All Button */}
        {(selectedManufacturer || selectedYear || selectedOrigin) && (
          <button
            onClick={() => {
              onManufacturerSelect(null);
              onYearSelect(null);
              onOriginSelect(null);
            }}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
          >
            Clear all
          </button>
        )}

        {/* Results Count */}
        <div className="text-sm text-gray-500">
          {filteredData.length} of {data.length} cars
        </div>
      </div>

      {/* Main Visualization */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          {viewMode === 'scatter' && 'Horsepower vs MPG (Size = Weight)'}
          {viewMode === 'parallel' && 'Parallel Coordinates View'}
          {viewMode === 'radar' && 'Average Metrics Radar Chart'}
        </h3>
        <p className="text-gray-600 mb-4">
          {viewMode === 'scatter' && 'Explore the relationship between engine power, fuel efficiency, and vehicle weight'}
          {viewMode === 'parallel' && 'Compare multiple dimensions simultaneously'}
          {viewMode === 'radar' && 'View average performance across all metrics'}
        </p>
        <svg
          ref={svgRef}
          width="1400"
          height="500"
          className="mx-auto border border-gray-200 rounded-lg"
        />
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{filteredData.length}</div>
          <div className="text-sm text-gray-600">Total Cars</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">
            {d3.mean(filteredData, d => d.Miles_per_Gallon)?.toFixed(1)}
          </div>
          <div className="text-sm text-gray-600">Avg MPG</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-600">
            {d3.mean(filteredData, d => d.Horsepower)?.toFixed(1)}
          </div>
          <div className="text-sm text-gray-600">Avg Horsepower</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">
            {d3.mean(filteredData, d => d.Weight_in_lbs)?.toFixed(0)}
          </div>
          <div className="text-sm text-gray-600">Avg Weight (lbs)</div>
        </div>
      </div>

      {/* Top Performers */}
      {filteredData.length > 0 && (
        <div className="bg-yellow-50 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Top Performers</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h5 className="font-semibold text-green-700 mb-2">Most Efficient</h5>
              <div className="text-sm">
                {filteredData
                  .sort((a, b) => b.Miles_per_Gallon - a.Miles_per_Gallon)
                  .slice(0, 3)
                  .map((car, i) => (
                    <div key={i} className="mb-1">
                      {car.Name} ({car.Miles_per_Gallon} MPG)
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <h5 className="font-semibold text-red-700 mb-2">Most Powerful</h5>
              <div className="text-sm">
                {filteredData
                  .sort((a, b) => b.Horsepower - a.Horsepower)
                  .slice(0, 3)
                  .map((car, i) => (
                    <div key={i} className="mb-1">
                      {car.Name} ({car.Horsepower} HP)
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <h5 className="font-semibold text-blue-700 mb-2">Fastest Acceleration</h5>
              <div className="text-sm">
                {filteredData
                  .sort((a, b) => a.Acceleration - b.Acceleration)
                  .slice(0, 3)
                  .map((car, i) => (
                    <div key={i} className="mb-1">
                      {car.Name} ({car.Acceleration}s)
                    </div>
                  ))}
              </div>
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
          ← Back to Efficiency Analysis
        </button>
        <button
          onClick={onReset}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Start Over
        </button>
      </div>
    </div>
  );
};

export default Scene5DetailedExploration; 