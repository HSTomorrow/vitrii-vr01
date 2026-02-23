import { Check, ChevronRight } from "lucide-react";

interface StepperStep {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface FormStepperProps {
  steps: StepperStep[];
  currentStep: number;
  onStepChange?: (step: number) => void;
  orientation?: "horizontal" | "vertical";
}

export default function FormStepper({
  steps,
  currentStep,
  onStepChange,
  orientation = "horizontal",
}: FormStepperProps) {
  const isCompleted = (stepIndex: number) => stepIndex < currentStep;
  const isCurrent = (stepIndex: number) => stepIndex === currentStep;

  if (orientation === "vertical") {
    return (
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start gap-4">
            {/* Step indicator */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => onStepChange?.(index)}
                disabled={index > currentStep}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                  isCompleted(index)
                    ? "bg-green-500 text-white"
                    : isCurrent(index)
                      ? "bg-vitrii-blue text-white ring-4 ring-blue-200"
                      : "bg-gray-200 text-gray-600 disabled:cursor-not-allowed"
                }`}
              >
                {isCompleted(index) ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </button>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={`w-0.5 h-12 mt-2 transition-colors duration-300 ${
                    isCompleted(index) ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
              )}
            </div>

            {/* Step content */}
            <div className="flex-1 pt-1">
              <button
                onClick={() => onStepChange?.(index)}
                disabled={index > currentStep}
                className={`text-left transition-all duration-300 ${
                  isCurrent(index) ? "block" : ""
                }`}
              >
                <h3
                  className={`font-semibold transition-colors ${
                    isCurrent(index)
                      ? "text-vitrii-blue"
                      : isCompleted(index)
                        ? "text-green-600"
                        : "text-gray-600"
                  }`}
                >
                  {step.label}
                </h3>
                {step.description && (
                  <p className="text-sm text-gray-500 mt-1">
                    {step.description}
                  </p>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Horizontal layout (default)
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        {/* Progress background line */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 z-0">
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{
              width: `${(currentStep / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Steps */}
        <div className="relative z-10 flex justify-between w-full">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center">
              <button
                onClick={() => onStepChange?.(index)}
                disabled={index > currentStep}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 shadow-md hover:shadow-lg ${
                  isCompleted(index)
                    ? "bg-green-500 text-white"
                    : isCurrent(index)
                      ? "bg-vitrii-blue text-white ring-4 ring-blue-200 shadow-lg scale-110"
                      : "bg-white text-gray-600 border-2 border-gray-300 disabled:cursor-not-allowed"
                }`}
              >
                {isCompleted(index) ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </button>

              {/* Step label */}
              <p
                className={`text-xs font-medium mt-2 text-center transition-colors duration-300 ${
                  isCurrent(index)
                    ? "text-vitrii-blue font-semibold"
                    : isCompleted(index)
                      ? "text-green-600"
                      : "text-gray-500"
                }`}
              >
                {step.label}
              </p>

              {/* Description on hover */}
              {step.description && (
                <div className="absolute top-full mt-1 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                  {step.description}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step description on mobile */}
      {steps[currentStep]?.description && (
        <p className="text-sm text-gray-600 text-center mt-4 md:hidden">
          {steps[currentStep].description}
        </p>
      )}
    </div>
  );
}
