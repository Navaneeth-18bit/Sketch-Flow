import { TbRectangle, TbEraser } from "react-icons/tb";
import { IoMdDownload, IoMdTrash } from "react-icons/io";
import { FaLongArrowAltRight } from "react-icons/fa";
import { LuPencil, LuType } from "react-icons/lu";
import { GiArrowCursor } from "react-icons/gi";
import { FaRegCircle } from "react-icons/fa6";
import {
  Arrow,
  Circle,
  Layer,
  Line,
  Rect,
  Stage,
  Transformer,
  Text,
} from "react-konva";
import { useRef, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { ACTIONS } from "../constants";

// Grid pattern will be created on mount so it respects current theme CSS variables

export default function DrawingCanvas() {
  const [gridPattern, setGridPattern] = useState<HTMLCanvasElement | null>(
    null,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>();
  const transformerRef = useRef<any>();

  const [size, setSize] = useState({ width: 0, height: 0 });
  const [action, setAction] = useState(ACTIONS.SELECT);
  const [fillColor, setFillColor] = useState("#3b82f6"); // Default blue
  const [rectangles, setRectangles] = useState<any[]>([]);
  const [circles, setCircles] = useState<any[]>([]);
  const [arrows, setArrows] = useState<any[]>([]);
  const [scribbles, setScribbles] = useState<any[]>([]);
  const [textboxes, setTextboxes] = useState<any[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [textareaPos, setTextareaPos] = useState({ x: 0, y: 0, width: 0 });

  const strokeColorDefault = "#000";
  const getCssVar = (name: string, fallback = "") => {
    try {
      return (
        getComputedStyle(document.documentElement)
          .getPropertyValue(name)
          .trim() || fallback
      );
    } catch {
      return fallback;
    }
  };

  const strokeColor = getCssVar("--border", strokeColorDefault);
  const isPaining = useRef(false);
  const currentShapeId = useRef<string | null>(null);
  const isDraggable = action === ACTIONS.SELECT;

  // Handle Dynamic Sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // create grid pattern so it uses CSS variable for dot color
  useEffect(() => {
    const make = () => {
      const dot = getCssVar("--grid-dot", "#d1d5db");
      const canvas = document.createElement("canvas");
      canvas.width = 40;
      canvas.height = 40;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = dot;
        ctx.beginPath();
        ctx.arc(1, 1, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      setGridPattern(canvas);
    };

    make();

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (
          m.type === "attributes" &&
          (m as any).attributeName === "data-theme"
        ) {
          make();
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const handleClearAll = () => {
    setRectangles([]);
    setCircles([]);
    setArrows([]);
    setScribbles([]);
    setTextboxes([]);
  };

  function onPointerDown() {
    if (editingId) return;
    if (action === ACTIONS.SELECT) return;

    const stage = stageRef.current;
    const { x, y } = stage.getPointerPosition();
    const id = uuidv4();

    currentShapeId.current = id;
    isPaining.current = true;

    switch (action) {
      case ACTIONS.RECTANGLE:
        setRectangles((prev) => [
          ...prev,
          { id, x, y, height: 5, width: 5, fillColor },
        ]);
        break;
      case ACTIONS.CIRCLE:
        setCircles((prev) => [...prev, { id, x, y, radius: 5, fillColor }]);
        break;
      case ACTIONS.ARROW:
        setArrows((prev) => [
          ...prev,
          { id, points: [x, y, x + 5, y + 5], fillColor },
        ]);
        break;
      case ACTIONS.TEXT:
        setTextboxes((prev) => [
          ...prev,
          { id, x, y, text: "Type here", fillColor, fontSize: 20 },
        ]);
        setAction(ACTIONS.SELECT);
        isPaining.current = false;
        break;
      case ACTIONS.SCRIBBLE:
      case ACTIONS.ERASER:
        setScribbles((prev) => [
          ...prev,
          {
            id,
            points: [x, y],
            fillColor,
            isEraser: action === ACTIONS.ERASER,
          },
        ]);
        break;
    }
  }

  function onPointerMove() {
    if (action === ACTIONS.SELECT || !isPaining.current) return;
    const stage = stageRef.current;
    const { x, y } = stage.getPointerPosition();

    switch (action) {
      case ACTIONS.RECTANGLE:
        setRectangles((prev) =>
          prev.map((r) =>
            r.id === currentShapeId.current
              ? { ...r, width: x - r.x, height: y - r.y }
              : r,
          ),
        );
        break;
      case ACTIONS.CIRCLE:
        setCircles((prev) =>
          prev.map((c) =>
            c.id === currentShapeId.current
              ? { ...c, radius: ((y - c.y) ** 2 + (x - c.x) ** 2) ** 0.5 }
              : c,
          ),
        );
        break;
      case ACTIONS.ARROW:
        setArrows((prev) =>
          prev.map((a) =>
            a.id === currentShapeId.current
              ? { ...a, points: [a.points[0], a.points[1], x, y] }
              : a,
          ),
        );
        break;
      case ACTIONS.SCRIBBLE:
      case ACTIONS.ERASER:
        setScribbles((prev) =>
          prev.map((s) =>
            s.id === currentShapeId.current
              ? { ...s, points: [...s.points, x, y] }
              : s,
          ),
        );
        break;
    }
  }

  function onClick(e: any) {
    if (action !== ACTIONS.SELECT) return;
    transformerRef.current.nodes([e.currentTarget]);
  }

  function handleExport() {
    const uri = stageRef.current.toDataURL();
    const link = document.createElement("a");
    link.download = "sketchflow-export.png";
    link.href = uri;
    link.click();
  }

  const isEmpty =
    rectangles.length === 0 &&
    circles.length === 0 &&
    scribbles.length === 0 &&
    textboxes.length === 0 &&
    arrows.length === 0;

  return (
    <div className="flex-1 p-6 bg-white flex flex-col h-full font-['Inter']">
      {/* TOOLBAR */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-1 p-1.5 bg-white border border-gray-200 shadow-sm rounded-xl">
          <button
            className={`p-2 rounded-lg ${action === ACTIONS.SCRIBBLE ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-500"}`}
            onClick={() => setAction(ACTIONS.SCRIBBLE)}
            title="Pencil"
          >
            <LuPencil size="1.2rem" />
          </button>
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <button
            className={`p-2 rounded-lg ${action === ACTIONS.RECTANGLE ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-500"}`}
            onClick={() => setAction(ACTIONS.RECTANGLE)}
            title="Rectangle"
          >
            <TbRectangle size="1.2rem" />
          </button>
          <button
            className={`p-2 rounded-lg ${action === ACTIONS.CIRCLE ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-500"}`}
            onClick={() => setAction(ACTIONS.CIRCLE)}
            title="Circle"
          >
            <FaRegCircle size="1.1rem" />
          </button>
          <button
            className={`p-2 rounded-lg ${action === ACTIONS.ARROW ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-500"}`}
            onClick={() => setAction(ACTIONS.ARROW)}
            title="Arrow"
          >
            <FaLongArrowAltRight size="1.2rem" />
          </button>
          <button
            className={`p-2 rounded-lg ${action === ACTIONS.TEXT ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-500"}`}
            onClick={() => setAction(ACTIONS.TEXT)}
            title="Text Box"
          >
            <LuType size="1.2rem" />
          </button>
          <button
            className={`p-2 rounded-lg ${action === ACTIONS.ERASER ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-500"}`}
            onClick={() => setAction(ACTIONS.ERASER)}
            title="Eraser"
          >
            <TbEraser size="1.2rem" />
          </button>

          <div className="w-px h-4 bg-gray-200 mx-1" />

          {/* COLOR PICKER */}
          <div className="flex items-center px-2">
            <input
              type="color"
              value={fillColor}
              onChange={(e) => setFillColor(e.target.value)}
              className="w-8 h-8 cursor-pointer rounded-md border-0 bg-transparent"
              title="Change Color"
            />
          </div>

          <div className="w-px h-4 bg-gray-200 mx-1" />

          <button
            className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg"
            onClick={handleExport}
            title="Export Image"
          >
            <IoMdDownload size="1.2rem" />
          </button>
          <button
            className="p-2 hover:bg-red-50 text-red-500 rounded-lg"
            onClick={handleClearAll}
            title="Clear All"
          >
            <IoMdTrash size="1.2rem" />
          </button>
        </div>
      </div>

      {/* CANVAS AREA */}
      <div
        className="flex-1 relative border-2 border-dashed border-gray-200 rounded-3xl overflow-hidden bg-white shadow-inner"
        ref={containerRef}
      >
        <Stage
          ref={stageRef}
          width={size.width}
          height={size.height}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => (isPaining.current = false)}
        >
          <Layer>
            <Rect
              width={size.width}
              height={size.height}
              fill={getCssVar("--canvas-bg", "#ffffff")}
              fillPatternImage={gridPattern as any}
              fillPatternRepeat="repeat"
              onClick={() => transformerRef.current.nodes([])}
            />

            {rectangles.map((rect) => (
              <Rect
                key={rect.id}
                {...rect}
                stroke={strokeColor}
                strokeWidth={2}
                fill={rect.fillColor}
                draggable={isDraggable}
                onClick={onClick}
              />
            ))}
            {circles.map((circle) => (
              <Circle
                key={circle.id}
                {...circle}
                stroke={strokeColor}
                strokeWidth={2}
                fill={circle.fillColor}
                draggable={isDraggable}
                onClick={onClick}
              />
            ))}
            {arrows.map((arrow) => (
              <Arrow
                key={arrow.id}
                {...arrow}
                stroke={strokeColor}
                strokeWidth={2}
                fill={arrow.fillColor}
                draggable={isDraggable}
                onClick={onClick}
              />
            ))}
            {scribbles.map((s) => (
              <Line
                key={s.id}
                {...s}
                stroke={
                  s.isEraser ? getCssVar("--canvas-bg", "#fff") : strokeColor
                }
                strokeWidth={s.isEraser ? 25 : 2}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={
                  s.isEraser ? "destination-out" : "source-over"
                }
                draggable={isDraggable}
                onClick={onClick}
              />
            ))}
            {textboxes.map((text) => (
              <Text
                key={text.id}
                {...text}
                text={editingId === text.id ? "" : text.text}
                fontFamily="'Inter', sans-serif"
                fontStyle="500"
                fontSize={20}
                padding={5}
                draggable={isDraggable}
                onClick={onClick}
                onDblClick={(e) => {
                  const stageBox = stageRef.current
                    .container()
                    .getBoundingClientRect();
                  setEditingId(text.id);
                  setEditingText(text.text);
                  setTextareaPos({
                    x: stageBox.left + e.target.x(),
                    y: stageBox.top + e.target.y(),
                    width: e.target.width(),
                  });
                }}
              />
            ))}
            <Transformer ref={transformerRef} />
          </Layer>
        </Stage>

        {/* EMPTY STATE UI */}
        {isEmpty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center mb-4 opacity-50">
              <LuPencil size="1.5rem" className="text-gray-400" />
            </div>
            <h3 className="text-gray-600 font-semibold text-lg">
              Start drawing
            </h3>
            <p className="text-gray-400 text-sm">
              Select a tool above and draw on the canvas
            </p>
          </div>
        )}
      </div>

      {/* OVERLAY TEXT EDITOR */}
      {editingId && (
        <textarea
          value={editingText}
          onChange={(e) => setEditingText(e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onBlur={() => {
            setTextboxes((prev) =>
              prev.map((t) =>
                t.id === editingId ? { ...t, text: editingText } : t,
              ),
            );
            setEditingId(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) e.currentTarget.blur();
          }}
          autoFocus
          style={{
            position: "absolute",
            top: textareaPos.y,
            left: textareaPos.x,
            width: textareaPos.width + 20,
            minWidth: "100px",
            fontSize: "20px",
            fontFamily: "'Inter', sans-serif",
            fontWeight: "500",
            lineHeight: 1.25,
            color: fillColor,
            background: getCssVar("--surface", "white"),
            border: `2px solid ${getCssVar("--accent", "#18A0FB")}`,
            outline: "none",
            resize: "none",
            zIndex: 1000,
            padding: "3px 5px",
          }}
        />
      )}
    </div>
  );
}
