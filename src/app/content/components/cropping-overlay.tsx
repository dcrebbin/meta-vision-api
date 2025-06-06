import {
  MoveDownLeft,
  MoveDownRight,
  MoveUpLeft,
  MoveUpRight,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function CroppingOverlay() {
  const [dimensions, setDimensions] = useState({
    width: 844,
    height: 475,
    top: 100,
    left: 100,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [activeHandle, setActiveHandle] = useState<number | "move" | null>(
    null
  );
  const startDragPos = useRef({ x: 0, y: 0 });
  const startDimensions = useRef({ width: 0, height: 0, top: 0, left: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    handle: number | "move"
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    setActiveHandle(handle);
    startDragPos.current = { x: e.clientX, y: e.clientY };
    startDimensions.current = { ...dimensions };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || activeHandle === null) return;

      let dx = e.clientX - startDragPos.current.x;
      let dy = e.clientY - startDragPos.current.y;

      const newDimensions = { ...startDimensions.current };

      if (activeHandle === "move") {
        newDimensions.left += dx;
        newDimensions.top += dy;
      } else if (activeHandle === 0) {
        // Top-left
        if (startDimensions.current.width - dx < 50) {
          dx = startDimensions.current.width - 50;
        }
        if (startDimensions.current.height - dy < 50) {
          dy = startDimensions.current.height - 50;
        }
        newDimensions.width -= dx;
        newDimensions.height -= dy;
        newDimensions.left += dx;
        newDimensions.top += dy;
      } else if (activeHandle === 1) {
        // Top-right
        if (startDimensions.current.width + dx < 50) {
          dx = 50 - startDimensions.current.width;
        }
        if (startDimensions.current.height - dy < 50) {
          dy = startDimensions.current.height - 50;
        }
        newDimensions.width += dx;
        newDimensions.height -= dy;
        newDimensions.top += dy;
      } else if (activeHandle === 2) {
        // Bottom-right
        if (startDimensions.current.width + dx < 50) {
          dx = 50 - startDimensions.current.width;
        }
        if (startDimensions.current.height + dy < 50) {
          dy = 50 - startDimensions.current.height;
        }
        newDimensions.width += dx;
        newDimensions.height += dy;
      } else if (activeHandle === 3) {
        // Bottom-left
        if (startDimensions.current.width - dx < 50) {
          dx = startDimensions.current.width - 50;
        }
        if (startDimensions.current.height + dy < 50) {
          dy = 50 - startDimensions.current.height;
        }
        newDimensions.width -= dx;
        newDimensions.height += dy;
        newDimensions.left += dx;
      }

      setDimensions(newDimensions);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setActiveHandle(null);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, activeHandle]);

  return (
    <div
      ref={overlayRef}
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) {
          handleMouseDown(e, "move");
        }
      }}
      className="fixed border-2 border-dashed border-white cursor-grab text-white"
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        top: `${dimensions.top}px`,
        left: `${dimensions.left}px`,
        zIndex: 1000,
      }}
    >
      <div
        onMouseDown={(e) => handleMouseDown(e, 0)}
        className="absolute top-0 left-0 w-10 h-10  flex items-center justify-center cursor-nwse-resize"
      >
        <MoveUpLeft />
      </div>
      <div
        onMouseDown={(e) => handleMouseDown(e, 1)}
        className="absolute top-0 right-0 w-10 h-10  flex items-center justify-center cursor-nesw-resize"
      >
        <MoveUpRight />
      </div>
      <div
        onMouseDown={(e) => handleMouseDown(e, 2)}
        className="absolute bottom-0 right-0 w-10 h-10 flex items-center justify-center cursor-nwse-resize"
      >
        <MoveDownRight />
      </div>
      <div
        onMouseDown={(e) => handleMouseDown(e, 3)}
        className="absolute bottom-0 left-0 w-10 h-10 flex items-center justify-center cursor-nesw-resize"
      >
        <MoveDownLeft />
      </div>
    </div>
  );
}
