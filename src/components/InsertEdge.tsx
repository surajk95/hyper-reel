import { useState } from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';
import { Plus } from 'lucide-react';

export function InsertEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data?.onInsert) {
      data.onInsert();
    }
  };

  return (
    <>
      <path
        id={id}
        style={{ stroke: '#4b5563', strokeWidth: 2 }}
        className="react-flow__edge-path"
        d={edgePath}
      />
      <path
        d={edgePath}
        fill="none"
        strokeOpacity={0}
        strokeWidth={20}
        className="react-flow__edge-interaction"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      {isHovered && (
        <g transform={`translate(${labelX}, ${labelY})`}>
          <circle
            r="12"
            fill="#1f2937"
            stroke="#4b5563"
            strokeWidth="2"
            className="cursor-pointer hover:fill-gray-700 transition-colors"
            onClick={handleClick}
          />
          <Plus
            x="-6"
            y="-6"
            width="12"
            height="12"
            className="text-white pointer-events-none"
          />
        </g>
      )}
    </>
  );
}

