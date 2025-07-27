import React, { useState, useEffect } from 'react';
import Scene1Overview from './scenes/Scene1Overview';
import Scene2ManufacturerAnalysis from './scenes/Scene2ManufacturerAnalysis';
import Scene3YearTrends from './scenes/Scene3YearTrends';
import Scene4EfficiencyAnalysis from './scenes/Scene4EfficiencyAnalysis';
import Scene5DetailedExploration from './scenes/Scene5DetailedExploration';

export interface CarData {
  Name: string;
  Miles_per_Gallon: number;
  Cylinders: number;
  Displacement: number;
  Horsepower: number;
  Weight_in_lbs: number;
  Acceleration: number;
  Year: number;
  Origin: string;
}

export interface NarrativeState {
  currentScene: number;
  selectedManufacturer: string | null;
  selectedYear: number | null;
  selectedOrigin: string | null;
  data: CarData[];
  loading: boolean;
}

const CarsNarrative: React.FC = () => {
  const [state, setState] = useState<NarrativeState>({
    currentScene: 1,
    selectedManufacturer: null,
    selectedYear: null,
    selectedOrigin: null,
    data: [],
    loading: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/narrative-visualization/data/cars.json');
        const data: CarData[] = await response.json();
        
        // Clean the data - remove entries with missing values
        const cleanData = data.filter(car => 
          car.Miles_per_Gallon != null && 
          car.Horsepower != null && 
          car.Weight_in_lbs != null &&
          car.Year != null &&
          car.Origin != null
        );
        
        setState(prev => ({
          ...prev,
          data: cleanData,
          loading: false
        }));
      } catch (error) {
        console.error('Error fetching data:', error);
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    fetchData();
  }, []);

  const updateState = (updates: Partial<NarrativeState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const renderScene = () => {
    if (state.loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-gray-600">Loading car data...</div>
        </div>
      );
    }

    switch (state.currentScene) {
      case 1:
        return (
          <Scene1Overview 
            data={state.data}
            onNext={() => updateState({ currentScene: 2 })}
          />
        );
      case 2:
        return (
          <Scene2ManufacturerAnalysis 
            data={state.data}
            selectedManufacturer={state.selectedManufacturer}
            onManufacturerSelect={(manufacturer) => updateState({ selectedManufacturer: manufacturer })}
            onNext={() => updateState({ currentScene: 3 })}
            onBack={() => updateState({ currentScene: 1 })}
          />
        );
      case 3:
        return (
          <Scene3YearTrends 
            data={state.data}
            selectedYear={state.selectedYear}
            onYearSelect={(year) => updateState({ selectedYear: year })}
            onNext={() => updateState({ currentScene: 4 })}
            onBack={() => updateState({ currentScene: 2 })}
          />
        );
      case 4:
        return (
          <Scene4EfficiencyAnalysis 
            data={state.data}
            selectedOrigin={state.selectedOrigin}
            onOriginSelect={(origin) => updateState({ selectedOrigin: origin })}
            onNext={() => updateState({ currentScene: 5 })}
            onBack={() => updateState({ currentScene: 3 })}
          />
        );
      case 5:
        return (
          <Scene5DetailedExploration 
            data={state.data}
            selectedManufacturer={state.selectedManufacturer}
            selectedYear={state.selectedYear}
            selectedOrigin={state.selectedOrigin}
            onBack={() => updateState({ currentScene: 4 })}
            onReset={() => updateState({ 
              currentScene: 1, 
              selectedManufacturer: null, 
              selectedYear: null, 
              selectedOrigin: null 
            })}
            onManufacturerSelect={(manufacturer) => updateState({ selectedManufacturer: manufacturer })}
            onYearSelect={(year) => updateState({ selectedYear: year })}
            onOriginSelect={(origin) => updateState({ selectedOrigin: origin })}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          The Evolution of Automobiles
        </h1>
        <p className="text-lg text-gray-600">
          A narrative exploration of car performance, efficiency, and trends
        </p>
        <div className="flex justify-center mt-4 space-x-2">
          {[1, 2, 3, 4, 5].map((scene) => (
            <button
              key={scene}
              onClick={() => updateState({ currentScene: scene })}
              className={`w-3 h-3 rounded-full transition-colors ${
                state.currentScene === scene 
                  ? 'bg-blue-600' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              title={`Scene ${scene}`}
            />
          ))}
        </div>
      </header>
      
      <main className="bg-white rounded-lg shadow-lg p-6">
        {renderScene()}
      </main>
    </div>
  );
};

export default CarsNarrative; 