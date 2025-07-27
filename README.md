# The Evolution of Automobiles - Narrative Visualization

A comprehensive narrative visualization exploring the cars dataset, built with React, TypeScript, and D3.js. This project presents a drill-down story structure that guides users through different aspects of automotive data analysis.

## Features

### 🚗 **Drill-Down Story Structure**
- **Scene 1: Overview** - Introduction to the dataset with key statistics and scatter plot
- **Scene 2: Manufacturer Analysis** - Compare fuel efficiency across different car manufacturers
- **Scene 3: Year Trends** - Explore how car performance evolved over time
- **Scene 4: Regional Efficiency** - Analyze efficiency patterns by geographic region
- **Scene 5: Detailed Exploration** - Advanced visualizations with multiple view modes

### 📊 **Interactive Visualizations**
- **Scatter Plots** - Explore relationships between horsepower, MPG, and weight
- **Bar Charts** - Compare manufacturers and regions
- **Line Charts** - Track trends over time
- **Parallel Coordinates** - Multi-dimensional data exploration
- **Radar Charts** - Average performance metrics visualization

### 🎯 **Narrative Elements**
- **Scenes** - Structured progression through the story
- **Annotations** - Highlight key insights and patterns
- **Parameters** - State management for filters and selections
- **Triggers** - Interactive elements that drive the narrative

### 🎨 **Design Features**
- Clean, modern UI with Tailwind CSS
- Responsive design for different screen sizes
- Interactive tooltips and hover effects
- Color-coded regions and categories
- Smooth transitions between scenes

## Technical Implementation

### **Scenes**
Each scene follows a consistent template with:
- Clear narrative progression
- Interactive visualizations
- Contextual annotations
- Navigation controls

### **Annotations**
- Highlight specific data points and trends
- Provide contextual information
- Reinforce key insights
- Guide user attention

### **Parameters**
- `currentScene` - Controls which scene is displayed
- `selectedManufacturer` - Filters data by manufacturer
- `selectedYear` - Filters data by year
- `selectedOrigin` - Filters data by region

### **Triggers**
- Button clicks for navigation
- Interactive chart elements
- Filter selections
- View mode toggles

## Data Source

The visualization uses the cars dataset from Vega datasets:
- **Source**: https://raw.githubusercontent.com/vega/vega-datasets/refs/heads/main/data/cars.json
- **Features**: Name, MPG, Cylinders, Displacement, Horsepower, Weight, Acceleration, Year, Origin
- **Records**: 406 cars from 1970-1982

## Key Insights

1. **Performance vs Efficiency Trade-off**: Strong negative correlation between horsepower and fuel efficiency
2. **Regional Patterns**: European cars tend to be more fuel-efficient
3. **Temporal Trends**: Evolution of automotive technology over the 1970s
4. **Manufacturer Differences**: Varying approaches to performance and efficiency

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- pnpm (recommended) or npm

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd narrative-visualization

# Install dependencies
pnpm install

# Start development server
pnpm start
```

### Build for Production
```bash
# Build the project
pnpm build

# Deploy to GitHub Pages
pnpm deploy
```

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **D3.js** - Data visualization
- **Tailwind CSS** - Styling
- **@d3fc/d3fc-annotation** - Annotation support

## Project Structure

```
src/
├── components/
│   ├── CarsNarrative.tsx          # Main narrative component
│   └── scenes/
│       ├── Scene1Overview.tsx     # Dataset overview
│       ├── Scene2ManufacturerAnalysis.tsx
│       ├── Scene3YearTrends.tsx
│       ├── Scene4EfficiencyAnalysis.tsx
│       └── Scene5DetailedExploration.tsx
├── types/
│   └── d3fc-annotation.d.ts       # Type declarations
└── App.tsx                        # Root component
```

## Narrative Structure

This visualization follows a **drill-down story** pattern:

1. **Overview** - Present the big picture and key statistics
2. **Manufacturer Analysis** - Allow exploration by car manufacturer
3. **Year Trends** - Show temporal patterns and evolution
4. **Regional Analysis** - Explore geographic differences
5. **Detailed Exploration** - Provide advanced filtering and multiple visualization types

Each scene builds upon the previous one, allowing users to explore different aspects of the data while maintaining narrative coherence.

## Live Demo

The visualization is deployed at: [https://arnab.github.io/narrative-visualization](https://arnab.github.io/narrative-visualization)

## License

This project is created for educational purposes as part of a data visualization course assignment. 