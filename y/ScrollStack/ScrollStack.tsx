import React, { ReactNode, useLayoutEffect, useRef, useCallback } from "react";

export interface ScrollStackItemProps {
  itemClassName?: string;
  children: ReactNode;
}

export const ScrollStackItem: React.FC<ScrollStackItemProps> = ({
  children,
  itemClassName = "",
}) => (
  <div
    className={`scroll-stack-card w-full mx-auto my-8 p-6 md:p-12 rounded-[40px] shadow-[0_0_30px_rgba(0,0,0,0.1)] box-border origin-top bg-white/90 transition-all duration-300 flex flex-row items-start ${itemClassName}`.trim()}
    style={{
      position: 'sticky',
      top: '80px', // adjust to your navbar height
      zIndex: 10,
    }}
  >
    {children}
  </div>
);

interface ScrollStackProps {
  className?: string;
  children: ReactNode;
  itemDistance?: number;
  itemScale?: number;
  itemStackDistance?: number;
  stackPosition?: string;
  scaleEndPosition?: string;
  baseScale?: number;
  scaleDuration?: number;
  rotationAmount?: number;
  blurAmount?: number;
  onStackComplete?: () => void;
}

const ScrollStack: React.FC<ScrollStackProps> = ({
  children,
  className = "",
}) => {
  // Just a wrapper for the sticky stack
  return (
    <div className={`relative w-full ${className}`.trim()}>
      <div className="scroll-stack-inner flex flex-col gap-0">
        {React.Children.map(children, (child, i) =>
          React.isValidElement(child)
            ? React.cloneElement(child, { ...child.props, style: { ...(child.props.style || {}), zIndex: 10 + i } })
            : child
        )}
      </div>
    </div>
  );
};

export default ScrollStack;
