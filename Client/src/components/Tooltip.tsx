import React, { useState, useRef } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({ children, text, position = 'top' }) => {
  const [visible, setVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Accessibility: show tooltip on focus, hide on blur
  const handleFocus = () => setVisible(true);
  const handleBlur = () => setVisible(false);

  // Show tooltip on hover/click
  const handleMouseEnter = () => setVisible(true);
  const handleMouseLeave = () => setVisible(false);

  // Positioning classes
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-block" tabIndex={0} aria-describedby={visible ? 'tooltip' : undefined}
      onFocus={handleFocus} onBlur={handleBlur} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
      {visible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          id="tooltip"
          className={`absolute z-50 px-2 py-1 rounded bg-gray-800 text-white text-xs shadow-lg whitespace-nowrap ${positionClasses[position]}`}
        >
          {text}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
