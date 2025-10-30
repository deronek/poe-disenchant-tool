import React, { CSSProperties } from "react";

import { cn } from "@/lib/utils";

type SpinnerProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: number | null;
  rotate?: number;
  size?: number;
  width?: number;
  className?: string;
  style?: CSSProperties;
};

const Spinner: React.FC<SpinnerProps> = ({
  value = null,
  rotate = 0,
  size = 24,
  width = 2,
  className,
  style,
  children,
  ...props
}) => {
  const radius = 20;

  const indeterminate = value == null;
  const circumference = 2 * Math.PI * radius;
  const strokeDashArray = Math.round(circumference * 1000) / 1000;
  const strokeDashOffset = ((100 - (value ?? 0)) / 100) * circumference + "px";
  const viewBoxSize = radius / (1 - width / size);
  const strokeWidth = (width / size) * viewBoxSize * 2;

  const svgStyle: CSSProperties = {
    transform: `rotate(${rotate - (indeterminate ? 0 : 90)}deg)`,
  };

  return (
    <div
      {...props}
      className={cn(
        "text-primary relative inline-flex items-center justify-center align-middle",
        className,
        indeterminate && "indeterminate",
      )}
      style={{ height: size, width: size, ...style }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        style={svgStyle}
        viewBox={`${viewBoxSize} ${viewBoxSize} ${
          2 * viewBoxSize
        } ${2 * viewBoxSize}`}
      >
        <circle
          className="path"
          fill="transparent"
          cx={2 * viewBoxSize}
          cy={2 * viewBoxSize}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDashArray}
          strokeDashoffset={strokeDashOffset}
        />
      </svg>
      <div className="info">{children}</div>

      {/* Scoped CSS */}
      <style jsx>{`
        svg {
          width: 100%;
          height: 100%;
          margin: auto;
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 0;
        }

        .indeterminate > svg {
          animation: rotate 1.4s linear infinite;
          transform-origin: center center;
          transition: all 0.2s ease-in-out;
        }

        .indeterminate .path {
          animation: dash 1.4s ease-in-out infinite;
          stroke-linecap: round;
          stroke-dasharray: 80, 200;
          stroke-dashoffset: 0px;
        }

        .info {
          align-items: center;
          display: flex;
          justify-content: center;
        }

        .path {
          stroke: var(--path-color, currentColor);
          z-index: 2;
          transition: all 0.6s ease-in-out;
        }

        @keyframes dash {
          0% {
            stroke-dasharray: 1, 200;
            stroke-dashoffset: 0px;
          }

          50% {
            stroke-dasharray: 100, 200;
            stroke-dashoffset: -15px;
          }

          100% {
            stroke-dasharray: 100, 200;
            stroke-dashoffset: -125px;
          }
        }

        @keyframes rotate {
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default Spinner;
