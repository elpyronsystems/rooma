import "./StepIndicator.css";

interface StepIndicatorProps {
  steps: string[];
  currentIndex: number;
}

export function StepIndicator({ steps, currentIndex }: StepIndicatorProps) {
  return (
    <div className="step-indicator">
      {steps.map((label, index) => (
        <div key={label} className="step-indicator__item">
          <div
            className={`step-indicator__circle${
              index < currentIndex
                ? " step-indicator__circle--done"
                : index === currentIndex
                ? " step-indicator__circle--active"
                : ""
            }`}
          >
            {index < currentIndex ? (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              index + 1
            )}
          </div>
          <span className={`step-indicator__label${index === currentIndex ? " step-indicator__label--active" : ""}`}>
            {label}
          </span>
          {index < steps.length - 1 && <div className="step-indicator__line" />}
        </div>
      ))}
    </div>
  );
}
