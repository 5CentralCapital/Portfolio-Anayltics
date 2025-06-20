import React, { useState, useEffect } from "react";
import { X, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: string;
}

interface OnboardingTourProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to 5Central Capital!",
    description: "Let's take a quick tour to help you get started with our real estate investment platform.",
    target: "",
    position: "bottom"
  },
  {
    id: "dashboard",
    title: "Entity Dashboard",
    description: "This is your main dashboard where you can view portfolio metrics, manage entities, and track performance.",
    target: "[data-tour='dashboard']",
    position: "bottom"
  },
  {
    id: "navigation",
    title: "Navigation Menu",
    description: "Use these tabs to navigate between different sections: Dashboard, Asset Management, Deal Analyzer, and more.",
    target: "[data-tour='navigation']",
    position: "bottom"
  },
  {
    id: "kpi-bar",
    title: "Key Performance Indicators",
    description: "Monitor your portfolio's key metrics including AUM, units, properties, and monthly cash flow at a glance.",
    target: "[data-tour='kpi-bar']",
    position: "bottom"
  },
  {
    id: "entities",
    title: "Entity Management",
    description: "View and manage your different entities, their properties, and financial performance here.",
    target: "[data-tour='entities']",
    position: "top"
  },
  {
    id: "deal-analyzer",
    title: "Deal Analyzer",
    description: "Use our comprehensive deal analyzer to evaluate potential investments and run financial scenarios.",
    target: "[data-tour='deal-analyzer-tab']",
    position: "bottom"
  },
  {
    id: "asset-management",
    title: "Asset Management",
    description: "Track your property portfolio, view financial statements, and manage your real estate investments.",
    target: "[data-tour='asset-management-tab']",
    position: "bottom"
  }
];

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<Element | null>(null);

  useEffect(() => {
    if (isOpen && tourSteps[currentStep]) {
      const target = tourSteps[currentStep].target;
      if (target) {
        const element = document.querySelector(target);
        setHighlightedElement(element);
        
        // Scroll element into view
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [currentStep, isOpen]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setHighlightedElement(null);
    onComplete();
    localStorage.setItem('onboarding_completed', 'true');
  };

  const handleSkip = () => {
    setHighlightedElement(null);
    onSkip();
    localStorage.setItem('onboarding_completed', 'true');
  };

  if (!isOpen) return null;

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
      
      {/* Highlight Box */}
      {highlightedElement && (
        <div
          className="fixed border-4 border-blue-500 rounded-lg pointer-events-none z-50"
          style={{
            top: highlightedElement.getBoundingClientRect().top - 4,
            left: highlightedElement.getBoundingClientRect().left - 4,
            width: highlightedElement.getBoundingClientRect().width + 8,
            height: highlightedElement.getBoundingClientRect().height + 8,
          }}
        />
      )}

      {/* Tour Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {tourSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index <= currentStep ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500 ml-2">
                {currentStep + 1} of {tourSteps.length}
              </span>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {step.title}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Skip Tour
            </button>
            
            <div className="flex items-center gap-3">
              {!isFirstStep && (
                <button
                  onClick={handlePrevious}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>
              )}
              
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {isLastStep ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Finish
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingTour;