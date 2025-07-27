import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { CarData } from '../CarsNarrative';

interface Scene3YearTrendsProps {
  data: CarData[];
  selectedYear: number | null;
  onYearSelect: (year: number | null) => void;
  onNext: () => void;
  onBack: () => void;
}

const Scene3YearTrends: React.FC<Scene3YearTrendsProps> = ({
  data,
  selectedYear,
  onYearSelect,
  onNext,
  onBack
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [years, setYears] = useState<number[]>([]);

  useEffect(() => {
    if (!data.length) return;

    // Focus on key periods that tell the story
    const keyYears = [1970, 1974, 1978, 1982]; // Early 70s, Oil Crisis, Late 70s, Early 80s
    setYears(keyYears);
  }, [data]);

  useEffect(() => {
    if (!data.length || !svgRef.current || !years.length) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();
    
    // Also clear any stray tooltips
    d3.selectAll(".tooltip").remove();

    const svg = d3.select(svgRef.current);
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Calculate trends by year - properly aggregate data
    const yearStats = years.map(year => {
      const yearCars = data.filter(car => car.Year && car.Year.toString().startsWith(year.toString()));
      const validMPG = yearCars.filter(car => car.Miles_per_Gallon != null);
      const validHP = yearCars.filter(car => car.Horsepower != null);
      
      return {
        year,
        avgMPG: validMPG.length > 0 ? d3.mean(validMPG, d => d.Miles_per_Gallon) || 0 : 0,
        avgHorsepower: validHP.length > 0 ? d3.mean(validHP, d => d.Horsepower) || 0 : 0,
        count: yearCars.length
      };
    }).filter(stat => stat.count > 0); // Only include years with data

    if (yearStats.length === 0) {
      // Fallback: use all available years if key years don't have data
      const allYears = [...new Set(data.map(car => car.Year ? parseInt(car.Year.toString().split('-')[0]) : null))].filter(year => year !== null).sort();
      const fallbackYears = allYears.slice(0, 4); // Take first 4 years
      setYears(fallbackYears);
      return;
    }

    // Create scales with proper domains
    const xScale = d3.scaleLinear()
      .domain([d3.min(yearStats, d => d.year) ?? 0, d3.max(yearStats, d => d.year) ?? 0])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, (d3.max(yearStats, d => d.avgMPG) ?? 0) * 1.1])
      .range([height, 0]);

    const yScale2 = d3.scaleLinear()
      .domain([0, (d3.max(yearStats, d => d.avgHorsepower) ?? 0) * 1.1])
      .range([height, 0]);

    // Create line generators
    const lineMPG = d3.line<typeof yearStats[0]>()
      .x(d => xScale(d.year))
      .y(d => yScale(d.avgMPG))
      .curve(d3.curveMonotoneX);

    const lineHorsepower = d3.line<typeof yearStats[0]>()
      .x(d => xScale(d.year))
      .y(d => yScale2(d.avgHorsepower))
      .curve(d3.curveMonotoneX);

    // Add axes with proper formatting
    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks(yearStats.length));

    g.append("text")
      .attr("fill", "#000")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Key Periods in Automotive Evolution");

    g.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(yScale).ticks(6));
    
    g.append("text")
      .attr("class", "y-axis-label")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Average MPG");

    // Add right axis for horsepower
    g.append("g")
      .attr("class", "y-axis-right")
      .attr("transform", `translate(${width},0)`)
      .call(d3.axisRight(yScale2).ticks(6));
    
    g.append("text")
      .attr("class", "y-axis-label-right")
      .attr("fill", "#000")
      .attr("transform", `translate(${width + 40}, ${height / 2}) rotate(90)`)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Average Horsepower");

    // Add grid lines
    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickSize(-height).tickFormat(() => ""));

    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(yScale).tickSize(-width).tickFormat(() => ""));

    // Style grid lines
    g.selectAll(".grid line")
      .attr("stroke", "#ddd")
      .attr("stroke-opacity", 0.7);

    // Add MPG line
    g.append("path")
      .datum(yearStats)
      .attr("fill", "none")
      .attr("stroke", "#2E8B57")
      .attr("stroke-width", 3)
      .attr("d", lineMPG);

    // Add Horsepower line
    g.append("path")
      .datum(yearStats)
      .attr("fill", "none")
      .attr("stroke", "#DC143C")
      .attr("stroke-width", 3)
      .attr("d", lineHorsepower);

    // Add interactive data points on top of trend lines
    g.selectAll("circle")
      .data(yearStats)
      .enter()
      .append("circle")
      .attr("cx", d => xScale(d.year))
      .attr("cy", d => yScale(d.avgMPG))
      .attr("r", 5)
      .attr("fill", "#2E8B57")
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("opacity", d => selectedYear ? (d.year === selectedYear ? 1 : 0.4) : 0.8)
      .on("click", function(event, d) {
        onYearSelect(d.year);
      })
      .on("mouseover", function(this: SVGCircleElement, event: MouseEvent, d: any) {
        d3.select(this).attr("r", 7).attr("opacity", 1);
        
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
          .style("box-shadow", "0 2px 8px rgba(0,0,0,0.3)");
        
        tooltip.html(`
          <strong>Year ${d.year}</strong><br/>
          Average MPG: ${d.avgMPG.toFixed(1)}<br/>
          Average HP: ${d.avgHorsepower.toFixed(1)}<br/>
          Cars in dataset: ${d.count}
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function(this: SVGCircleElement, event: MouseEvent, d: any) {
        const opacity = selectedYear ? (d.year === selectedYear ? 1 : 0.4) : 0.8;
        d3.select(this).attr("r", 5).attr("opacity", opacity);
        d3.selectAll(".tooltip").remove();
      });

    // Add legend
    const legend = g.append("g")
      .attr("transform", `translate(${width - 150}, 20)`);

    // MPG legend
    legend.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 20)
      .attr("y2", 0)
      .attr("stroke", "#2E8B57")
      .attr("stroke-width", 3);

    legend.append("text")
      .attr("x", 25)
      .attr("y", 4)
      .attr("text-anchor", "start")
      .style("font-size", "12px")
      .style("fill", "#2E8B57")
      .text("Average MPG");

    // Horsepower legend
    legend.append("line")
      .attr("x1", 0)
      .attr("y1", 20)
      .attr("x2", 20)
      .attr("y2", 20)
      .attr("stroke", "#DC143C")
      .attr("stroke-width", 3);

    legend.append("text")
      .attr("x", 25)
      .attr("y", 24)
      .attr("text-anchor", "start")
      .style("font-size", "12px")
      .style("fill", "#DC143C")
      .text("Average Horsepower");



    // Add subtle background highlights for key periods instead of covering annotations
    const keyPeriods = [
      { year: 1970, label: "Early 70s", color: "rgba(255,255,0,0.1)" },
      { year: 1974, label: "Oil Crisis", color: "rgba(255,0,0,0.1)" },
      { year: 1982, label: "Technology", color: "rgba(0,255,0,0.1)" }
    ];

    keyPeriods.forEach(period => {
      const x = xScale(period.year);
      if (x !== undefined) {
        g.append("rect")
          .attr("x", x - 20)
          .attr("y", 0)
          .attr("width", 40)
          .attr("height", height)
          .attr("fill", period.color)
          .attr("stroke", "none");
      }
    });

    // Add annotation for selected year
    if (selectedYear) {
      const selected = yearStats.find(d => d.year === selectedYear);
      if (selected) {
        const annotationGroup = g.append("g");
        
        // Vertical line for selected year
        annotationGroup.append("line")
          .attr("x1", xScale(selected.year))
          .attr("y1", 0)
          .attr("x2", xScale(selected.year))
          .attr("y2", height)
          .attr("stroke", "#333")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "5,5");
        
        // Highlight selected point
        g.append("circle")
          .attr("cx", xScale(selected.year))
          .attr("cy", yScale(selected.avgMPG))
          .attr("r", 8)
          .attr("fill", "none")
          .attr("stroke", "#333")
          .attr("stroke-width", 3);
      }
    }

  }, [data, years, selectedYear, onYearSelect]);

  // Filter data for selected year
  const selectedYearData = selectedYear 
    ? data.filter(car => car.Year && car.Year.toString().startsWith(selectedYear.toString()))
    : [];

  // Calculate trend direction
  const getTrendDirection = (metric: 'mpg' | 'hp') => {
    if (years.length < 2) return 'stable';
    const yearStats = years.map(year => {
      const yearCars = data.filter(car => car.Year && car.Year.toString().startsWith(year.toString()));
      return {
        year,
        avgMPG: d3.mean(yearCars, d => d.Miles_per_Gallon) || 0,
        avgHorsepower: d3.mean(yearCars, d => d.Horsepower) || 0,
        avgWeight: d3.mean(yearCars, d => d.Weight_in_lbs) || 0,
        count: yearCars.length
      };
    });
    const recent = yearStats[yearStats.length - 1];
    const older = yearStats[yearStats.length - 2];
    const diff = metric === 'mpg' ? recent.avgMPG - older.avgMPG : recent.avgHorsepower - older.avgHorsepower;
    return diff > 0 ? 'increasing' : diff < 0 ? 'decreasing' : 'stable';
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Trends Over Time
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          Explore how key historical events shaped car design and efficiency. 
          The 1973-74 oil crisis dramatically changed automotive priorities.
        </p>
      </div>

      {/* Overall Trend Analysis */}
      <div className="flex justify-center gap-4 mb-4">
        <div className="bg-green-50 px-4 py-2 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {d3.mean(data, d => d.Miles_per_Gallon)?.toFixed(1)} MPG
            </div>
            <div className="text-xs text-gray-600">
              {getTrendDirection('mpg')} trend
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 px-4 py-2 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">
              {d3.mean(data, d => d.Horsepower)?.toFixed(1)} HP
            </div>
            <div className="text-xs text-gray-600">
              {getTrendDirection('hp')} trend
            </div>
          </div>
        </div>
      </div>

      {/* Key Period Selection */}
      <div className="flex flex-wrap gap-3 justify-center mb-6">
        <button
          onClick={() => onYearSelect(null)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            !selectedYear 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Periods
        </button>
        {years.map(year => (
          <button
            key={year}
            onClick={() => onYearSelect(year)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedYear === year 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {year === 1970 ? 'Early 70s' : 
             year === 1974 ? 'Oil Crisis' : 
             year === 1978 ? 'Late 70s' : 
             'Early 80s'}
          </button>
        ))}
      </div>

      {/* Main Visualization */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Fuel Efficiency and Horsepower Trends
        </h3>
        <p className="text-gray-600 mb-4">
          {selectedYear 
            ? `Showing details for ${selectedYear} (${selectedYearData.length} cars)`
            : 'Click on a data point to explore a specific year'
          }
        </p>
        <svg
          ref={svgRef}
          width="800"
          height="500"
          className="mx-auto border border-gray-200 rounded-lg"
        />
        
        {/* Key Periods Legend */}
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-200 rounded"></div>
            <span>Early 70s (Muscle Car Era)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-200 rounded"></div>
            <span>Oil Crisis (1973-74)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-200 rounded"></div>
            <span>Technology Era (1980s)</span>
          </div>
        </div>
      </div>

      {/* Selected Year Details */}
      {selectedYear && selectedYearData.length > 0 && (
        <div className="bg-blue-50 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            {selectedYear} Details
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{selectedYearData.length}</div>
              <div className="text-sm text-gray-600">Total Cars</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {d3.mean(selectedYearData, d => d.Miles_per_Gallon)?.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Avg MPG</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {d3.mean(selectedYearData, d => d.Horsepower)?.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Avg Horsepower</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {d3.mean(selectedYearData, d => d.Weight_in_lbs)?.toFixed(0)}
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
          ← Back to Manufacturers
        </button>
        <button
          onClick={onNext}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Explore Efficiency Analysis →
        </button>
      </div>
    </div>
  );
};

export default Scene3YearTrends; 