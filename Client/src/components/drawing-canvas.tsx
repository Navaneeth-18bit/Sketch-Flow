import { TbRectangle, TbEraser, TbTriangle, TbPentagon, TbHexagon, TbOvalVertical, TbVectorBezier2, TbRoute } from "react-icons/tb";
import { IoMdDownload, IoMdTrash } from "react-icons/io";
import { FaLongArrowAltRight, FaRegStar } from "react-icons/fa";
import { LuPencil, LuType } from "react-icons/lu";
import { GiArrowCursor } from "react-icons/gi";
import { FaRegCircle, FaRegCommentDots } from "react-icons/fa6";
import { BsDiamond } from "react-icons/bs";
import { MdDeleteOutline } from "react-icons/md";
import { BiShapePolygon } from "react-icons/bi";
import {
  Arrow,
  Circle,
  Layer,
  Line,
  Rect,
  Stage,
  Transformer,
  Text,
  RegularPolygon,
  Ellipse,
  Path,
  Star,
} from "react-konva";
import { useRef, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { ACTIONS } from "../constants";
import { auth } from "../utils/firebase";
import Tooltip from "./Tooltip";
import DiagramAnalysisModal from "./DiagramAnalysisModal";
import { DiagramData } from "../types";
import axios from "axios";

// Grid pattern will be created on mount so it respects current theme CSS variables

interface CanvasProps {
  activeSessionId: string | null;
  onNewSession: () => void;
}

export default function DrawingCanvas({ activeSessionId, onNewSession }: CanvasProps) {
  const [gridPattern, setGridPattern] = useState<HTMLCanvasElement | null>(
    null,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>();
  const transformerRef = useRef<any>();
  const isInitialLoad = useRef(true);

  const [size, setSize] = useState({ width: 0, height: 0 });
  const [action, setAction] = useState(ACTIONS.SELECT);
  const [fillColor, setFillColor] = useState("#3b82f6"); // Default blue for shapes
  const [penColor, setPenColor] = useState("#000000"); // independent pen color for scribble tool
  const [rectangles, setRectangles] = useState<any[]>([]);
  const [circles, setCircles] = useState<any[]>([]);
  const [arrows, setArrows] = useState<any[]>([]);
  const [scribbles, setScribbles] = useState<any[]>([]);
  const [textboxes, setTextboxes] = useState<any[]>([]);

  // New Shapes
  const [triangles, setTriangles] = useState<any[]>([]);
  const [diamonds, setDiamonds] = useState<any[]>([]);
  const [pentagons, setPentagons] = useState<any[]>([]);
  const [hexagons, setHexagons] = useState<any[]>([]);
  const [ellipses, setEllipses] = useState<any[]>([]);
  const [beziers, setBeziers] = useState<any[]>([]);
  const [connectors, setConnectors] = useState<any[]>([]);
  const [speechBubbles, setSpeechBubbles] = useState<any[]>([]);
  const [stars, setStars] = useState<any[]>([]);
  const [parallelograms, setParallelograms] = useState<any[]>([]);

  const [shapesMenuOpen, setShapesMenuOpen] = useState(false);

  // Track which shape is selected (for delete / move)
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [selectedShapeType, setSelectedShapeType] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [textareaPos, setTextareaPos] = useState({ x: 0, y: 0, width: 0 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analysisData, setAnalysisData] = useState<DiagramData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  // Helper: delete a shape by id across all shape collections
  const deleteShapeById = (id: string) => {
    setRectangles((p) => p.filter((s) => s.id !== id));
    setCircles((p) => p.filter((s) => s.id !== id));
    setArrows((p) => p.filter((s) => s.id !== id));
    setScribbles((p) => p.filter((s) => s.id !== id));
    setTextboxes((p) => p.filter((s) => s.id !== id));
    setTriangles((p) => p.filter((s) => s.id !== id));
    setDiamonds((p) => p.filter((s) => s.id !== id));
    setPentagons((p) => p.filter((s) => s.id !== id));
    setHexagons((p) => p.filter((s) => s.id !== id));
    setEllipses((p) => p.filter((s) => s.id !== id));
    setBeziers((p) => p.filter((s) => s.id !== id));
    setConnectors((p) => p.filter((s) => s.id !== id));
    setSpeechBubbles((p) => p.filter((s) => s.id !== id));
    setStars((p) => p.filter((s) => s.id !== id));
    setParallelograms((p) => p.filter((s) => s.id !== id));
  };

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

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    updateSize();
    window.addEventListener("resize", updateSize);

    return () => {
      window.removeEventListener("resize", updateSize);
      resizeObserver.disconnect();
    };
  }, []);

  // Fetch strokes on session change
  useEffect(() => {
    if (!activeSessionId) return;

    isInitialLoad.current = true;

    setRectangles([]);
    setCircles([]);
    setArrows([]);
    setScribbles([]);
    setTextboxes([]);
    setTriangles([]);
    setDiamonds([]);
    setPentagons([]);
    setHexagons([]);
    setEllipses([]);
    setBeziers([]);
    setConnectors([]);
    setSpeechBubbles([]);
    setStars([]);
    setParallelograms([]);

    const loadSessionStrokes = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const res = await axios.get(`http://localhost:5000/api/sessions/${activeSessionId}/strokes`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data && res.data.stroke_data) {
          const sd = res.data.stroke_data;
          setRectangles(sd.rectangles || []);
          setCircles(sd.circles || []);
          setArrows(sd.arrows || []);
          setScribbles(sd.scribbles || []);
          setTextboxes(sd.textboxes || []);
          setTriangles(sd.triangles || []);
          setDiamonds(sd.diamonds || []);
          setPentagons(sd.pentagons || []);
          setHexagons(sd.hexagons || []);
          setEllipses(sd.ellipses || []);
          setBeziers(sd.beziers || []);
          setConnectors(sd.connectors || []);
          setSpeechBubbles(sd.speechBubbles || []);
          setStars(sd.stars || []);
          setParallelograms(sd.parallelograms || []);
        }
      } catch (err) {
        console.error("Failed to load session strokes:", err);
      } finally {
        setTimeout(() => {
          isInitialLoad.current = false;
        }, 100);
      }
    };

    loadSessionStrokes();
  }, [activeSessionId]);

  // Auto-save mechanism
  useEffect(() => {
    if (!activeSessionId || isInitialLoad.current) return;

    const timer = setTimeout(async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        await axios.post(`http://localhost:5000/api/sessions/${activeSessionId}/strokes`, {
          strokeData: {
            rectangles, circles, arrows, scribbles, textboxes,
            triangles, diamonds, pentagons, hexagons, ellipses, beziers, connectors, speechBubbles, stars, parallelograms
          }
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Failed to auto-save strokes:", err);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [rectangles, circles, arrows, scribbles, textboxes, triangles, diamonds, pentagons, hexagons, ellipses, beziers, connectors, speechBubbles, stars, parallelograms, activeSessionId]);

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
    setTriangles([]);
    setDiamonds([]);
    setPentagons([]);
    setHexagons([]);
    setEllipses([]);
    setBeziers([]);
    setConnectors([]);
    setSpeechBubbles([]);
    setStars([]);
    setParallelograms([]);
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
      case ACTIONS.TRIANGLE:
        setTriangles((prev) => [...prev, { id, x, y, radius: 5, fillColor }]);
        break;
      case ACTIONS.DIAMOND:
        setDiamonds((prev) => [...prev, { id, x, y, radius: 5, fillColor }]);
        break;
      case ACTIONS.PENTAGON:
        setPentagons((prev) => [...prev, { id, x, y, radius: 5, fillColor }]);
        break;
      case ACTIONS.HEXAGON:
        setHexagons((prev) => [...prev, { id, x, y, radius: 5, fillColor }]);
        break;
      case ACTIONS.ELLIPSE:
        setEllipses((prev) => [...prev, { id, x, y, radiusX: 5, radiusY: 5, fillColor }]);
        break;
      case ACTIONS.STAR:
        setStars((prev) => [...prev, { id, x, y, innerRadius: 2.5, outerRadius: 5, fillColor }]);
        break;
      case ACTIONS.PARALLELOGRAM:
        setParallelograms((prev) => [...prev, { id, x, y, width: 5, height: 5, fillColor }]);
        break;
      case ACTIONS.CONNECTOR:
        setConnectors((prev) => [...prev, { id, points: [x, y, x, y], fillColor }]);
        break;
      case ACTIONS.SPEECH_BUBBLE:
        setSpeechBubbles((prev) => [...prev, { id, x, y, width: 5, height: 5, fillColor }]);
        break;
      case ACTIONS.BEZIER:
        setBeziers((prev) => [...prev, { id, x, y, points: [0, 0, 5, 5], fillColor }]);
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
        setScribbles((prev) => [
          ...prev,
          {
            id,
            points: [x, y],
            strokeColor: penColor,
          },
        ]);
        break;
      case ACTIONS.ERASER: {
        // Click-to-delete: find the topmost shape under cursor and remove it
        const hit = stage.getIntersection({ x, y });
        if (hit && hit.id()) {
          deleteShapeById(hit.id());
        }
        break;
      }
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
      case ACTIONS.TRIANGLE:
        setTriangles((prev) => prev.map((t) => t.id === currentShapeId.current ? { ...t, radius: Math.max(5, ((y - t.y) ** 2 + (x - t.x) ** 2) ** 0.5) } : t));
        break;
      case ACTIONS.DIAMOND:
        setDiamonds((prev) => prev.map((t) => t.id === currentShapeId.current ? { ...t, radius: Math.max(5, ((y - t.y) ** 2 + (x - t.x) ** 2) ** 0.5) } : t));
        break;
      case ACTIONS.PENTAGON:
        setPentagons((prev) => prev.map((t) => t.id === currentShapeId.current ? { ...t, radius: Math.max(5, ((y - t.y) ** 2 + (x - t.x) ** 2) ** 0.5) } : t));
        break;
      case ACTIONS.HEXAGON:
        setHexagons((prev) => prev.map((t) => t.id === currentShapeId.current ? { ...t, radius: Math.max(5, ((y - t.y) ** 2 + (x - t.x) ** 2) ** 0.5) } : t));
        break;
      case ACTIONS.ELLIPSE:
        setEllipses((prev) => prev.map((e) => e.id === currentShapeId.current ? { ...e, radiusX: Math.abs(x - e.x), radiusY: Math.abs(y - e.y) } : e));
        break;
      case ACTIONS.STAR:
        setStars((prev) => prev.map((s) => s.id === currentShapeId.current ? { ...s, outerRadius: Math.max(5, ((y - s.y) ** 2 + (x - s.x) ** 2) ** 0.5), innerRadius: Math.max(2.5, (((y - s.y) ** 2 + (x - s.x) ** 2) ** 0.5) / 2) } : s));
        break;
      case ACTIONS.PARALLELOGRAM:
        setParallelograms((prev) => prev.map((p) => p.id === currentShapeId.current ? { ...p, width: x - p.x, height: y - p.y } : p));
        break;
      case ACTIONS.CONNECTOR:
        setConnectors((prev) => prev.map((c) => c.id === currentShapeId.current ? { ...c, points: [c.points[0], c.points[1], x, y] } : c));
        break;
      case ACTIONS.SPEECH_BUBBLE:
        setSpeechBubbles((prev) => prev.map((b) => b.id === currentShapeId.current ? { ...b, width: x - b.x, height: y - b.y } : b));
        break;
      case ACTIONS.BEZIER:
        setBeziers((prev) => prev.map((b) => b.id === currentShapeId.current ? { ...b, points: [0, 0, x - b.x, y - b.y] } : b));
        break;
      case ACTIONS.SCRIBBLE:
        setScribbles((prev) =>
          prev.map((s) =>
            s.id === currentShapeId.current
              ? { ...s, points: [...s.points, x, y] }
              : s,
          ),
        );
        break;
      case ACTIONS.ERASER: {
        // Freehand eraser: delete any shape under the current pointer position
        const hit = stage.getIntersection({ x, y });
        if (hit && hit.id()) {
          deleteShapeById(hit.id());
        }
        break;
      }
    }
  }

  function onClick(e: any) {
    if (action !== ACTIONS.SELECT) return;
    const node = e.currentTarget;
    transformerRef.current.nodes([node]);
    setSelectedShapeId(node.id());
    setSelectedShapeType(node.getClassName());
  }

  // Delete the currently selected shape
  const handleDeleteSelected = () => {
    if (!selectedShapeId) return;
    setRectangles((p) => p.filter((s) => s.id !== selectedShapeId));
    setCircles((p) => p.filter((s) => s.id !== selectedShapeId));
    setArrows((p) => p.filter((s) => s.id !== selectedShapeId));
    setScribbles((p) => p.filter((s) => s.id !== selectedShapeId));
    setTextboxes((p) => p.filter((s) => s.id !== selectedShapeId));
    setTriangles((p) => p.filter((s) => s.id !== selectedShapeId));
    setDiamonds((p) => p.filter((s) => s.id !== selectedShapeId));
    setPentagons((p) => p.filter((s) => s.id !== selectedShapeId));
    setHexagons((p) => p.filter((s) => s.id !== selectedShapeId));
    setEllipses((p) => p.filter((s) => s.id !== selectedShapeId));
    setBeziers((p) => p.filter((s) => s.id !== selectedShapeId));
    setConnectors((p) => p.filter((s) => s.id !== selectedShapeId));
    setSpeechBubbles((p) => p.filter((s) => s.id !== selectedShapeId));
    setStars((p) => p.filter((s) => s.id !== selectedShapeId));
    setParallelograms((p) => p.filter((s) => s.id !== selectedShapeId));
    transformerRef.current?.nodes([]);
    setSelectedShapeId(null);
    setSelectedShapeType(null);
  };

  // Keyboard delete
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedShapeId) {
        // Don't fire if user is typing in textarea or input
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        handleDeleteSelected();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShapeId]);

  // Helper: sync dragged x/y back into state
  const makeDragEnd = (
    setter: React.Dispatch<React.SetStateAction<any[]>>
  ) => (id: string) => (e: any) => {
    const node = e.target;
    setter((prev) =>
      prev.map((s) => s.id === id ? { ...s, x: node.x(), y: node.y() } : s)
    );
  };

  const syncRect = makeDragEnd(setRectangles);
  const syncCircle = makeDragEnd(setCircles);
  const syncArrow = makeDragEnd(setArrows);
  const syncTriangle = makeDragEnd(setTriangles);
  const syncDiamond = makeDragEnd(setDiamonds);
  const syncPentagon = makeDragEnd(setPentagons);
  const syncHexagon = makeDragEnd(setHexagons);
  const syncEllipse = makeDragEnd(setEllipses);
  const syncStar = makeDragEnd(setStars);
  const syncParallel = makeDragEnd(setParallelograms);
  const syncConnector = makeDragEnd(setConnectors);
  const syncSpeech = makeDragEnd(setSpeechBubbles);
  const syncBezier = makeDragEnd(setBeziers);
  const syncScribble = makeDragEnd(setScribbles);
  const syncTextbox = makeDragEnd(setTextboxes);

  const handleExport = () => {
    const uri = stageRef.current.toDataURL();
    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAnalyzeDiagram = async () => {
    setIsAnalyzing(true);
    setIsModalOpen(true);
    setAnalysisData(null);

    try {
      // 0. Get or create a session
      let currentSessionId = activeSessionId || localStorage.getItem('current_session_id');
      if (!currentSessionId) {
        const sessionRes = await axios.post("http://localhost:5000/api/sessions/create", {
          title: `Session ${new Date().toLocaleDateString()}`
        }, {
          headers: { Authorization: `Bearer ${await auth.currentUser?.getIdToken()}` }
        });
        currentSessionId = sessionRes.data.session_id;
        localStorage.setItem('current_session_id', currentSessionId!);
      }

      // Get image from canvas
      const dataUrl = stageRef.current.toDataURL();
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "diagram.png", { type: "image/png" });

      const formData = new FormData();
      formData.append("image", file);

      // Send session and stroke data
      formData.append("sessionId", currentSessionId!);
      formData.append("strokeData", JSON.stringify({
        rectangles, circles, arrows, scribbles, textboxes,
        triangles, diamonds, pentagons, hexagons, ellipses, beziers, connectors, speechBubbles, stars, parallelograms
      }));

      const token = await auth.currentUser?.getIdToken();

      // 1. Analyze Diagram (gets both mermaid code and explanation)
      const analyzeRes = await axios.post("http://localhost:5000/api/analyze-diagram", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }
      });
      const { mermaidCode, explanation } = analyzeRes.data;

      setAnalysisData({
        originalImage: dataUrl,
        originalImageFile: file, // Store the file so the modal can use it to 'Improve'
        mermaidCode,
        explanation
      });
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Failed to analyze diagram. Please try again.");
      setIsModalOpen(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isEmpty =
    rectangles.length === 0 &&
    circles.length === 0 &&
    scribbles.length === 0 &&
    textboxes.length === 0 &&
    arrows.length === 0 &&
    triangles.length === 0 &&
    diamonds.length === 0 &&
    pentagons.length === 0 &&
    hexagons.length === 0 &&
    ellipses.length === 0 &&
    beziers.length === 0 &&
    connectors.length === 0 &&
    speechBubbles.length === 0 &&
    stars.length === 0 &&
    parallelograms.length === 0;

  return (
    <div className="flex-1 p-6 bg-white dark:bg-[#121212] flex flex-col h-full font-['Inter'] transition-colors">
      {/* TOOLBAR */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#1a1a1a] border border-gray-200/70 dark:border-white/8 shadow-[0_1px_6px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_6px_rgba(0,0,0,0.3)] rounded-2xl transition-colors">
          <Tooltip text="Draw freehand (Pencil)">
            <button
              className={`p-2 rounded-lg transition-colors ${action === ACTIONS.SCRIBBLE ? "bg-white dark:bg-white/10 text-gray-800 dark:text-white shadow-sm border border-gray-200 dark:border-white/10" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-gray-200"}`}
              onClick={() => setAction(ACTIONS.SCRIBBLE)}
              aria-label="Draw freehand (Pencil)"
            >
              <LuPencil size="1.2rem" />
            </button>
          </Tooltip>
          <div className="w-px h-4 bg-gray-200 dark:bg-[#333] mx-1" />
          <Tooltip text="Draw rectangle">
            <button
              className={`p-2 rounded-lg transition-colors ${action === ACTIONS.RECTANGLE ? "bg-white dark:bg-white/10 text-gray-800 dark:text-white shadow-sm border border-gray-200 dark:border-white/10" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-gray-200"}`}
              onClick={() => setAction(ACTIONS.RECTANGLE)}
              aria-label="Draw rectangle"
            >
              <TbRectangle size="1.2rem" />
            </button>
          </Tooltip>
          <Tooltip text="Draw circle">
            <button
              className={`p-2 rounded-lg transition-colors ${action === ACTIONS.CIRCLE ? "bg-white dark:bg-white/10 text-gray-800 dark:text-white shadow-sm border border-gray-200 dark:border-white/10" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-gray-200"}`}
              onClick={() => setAction(ACTIONS.CIRCLE)}
              aria-label="Draw circle"
            >
              <FaRegCircle size="1.1rem" />
            </button>
          </Tooltip>
          <Tooltip text="Draw arrow">
            <button
              className={`p-2 rounded-lg transition-colors ${action === ACTIONS.ARROW ? "bg-white dark:bg-white/10 text-gray-800 dark:text-white shadow-sm border border-gray-200 dark:border-white/10" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-gray-200"}`}
              onClick={() => setAction(ACTIONS.ARROW)}
              aria-label="Draw arrow"
            >
              <FaLongArrowAltRight size="1.2rem" />
            </button>
          </Tooltip>
          <Tooltip text="Add text box">
            <button
              className={`p-2 rounded-lg transition-colors ${action === ACTIONS.TEXT ? "bg-white dark:bg-white/10 text-gray-800 dark:text-white shadow-sm border border-gray-200 dark:border-white/10" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-gray-200"}`}
              onClick={() => setAction(ACTIONS.TEXT)}
              aria-label="Add text box"
            >
              <LuType size="1.2rem" />
            </button>
          </Tooltip>
          <Tooltip text="Eraser">
            <button
              className={`p-2 rounded-lg transition-colors ${action === ACTIONS.ERASER ? "bg-white dark:bg-white/10 text-gray-800 dark:text-white shadow-sm border border-gray-200 dark:border-white/10" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-gray-200"}`}
              onClick={() => setAction(ACTIONS.ERASER)}
              aria-label="Eraser"
            >
              <TbEraser size="1.2rem" />
            </button>
          </Tooltip>

          <div className="w-px h-4 bg-gray-200 dark:bg-[#333] mx-1" />

          {/* SHAPES MENU */}
          <div className="relative">
            <Tooltip text="More Shapes">
              <button
                className={`p-2 rounded-lg transition-colors ${[ACTIONS.TRIANGLE, ACTIONS.DIAMOND, ACTIONS.PENTAGON, ACTIONS.HEXAGON, ACTIONS.STAR, ACTIONS.ELLIPSE, ACTIONS.CONNECTOR, ACTIONS.SPEECH_BUBBLE, ACTIONS.BEZIER, ACTIONS.PARALLELOGRAM].includes(action) ? "bg-white dark:bg-white/10 text-gray-800 dark:text-white shadow-sm border border-gray-200 dark:border-white/10" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-gray-200"}`}
                onClick={() => setShapesMenuOpen(!shapesMenuOpen)}
                aria-label="More Shapes"
              >
                <BiShapePolygon size="1.2rem" />
              </button>
            </Tooltip>
            {shapesMenuOpen && (
              <div className="absolute top-full mt-2 left-0 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#303030] rounded-xl shadow-lg p-2 grid grid-cols-3 gap-1 z-50 w-36">
                <Tooltip text="Triangle"><button className={`p-2 flex justify-center col-span-1 rounded-lg hover:bg-gray-100/80 dark:hover:bg-white/5 ${action === ACTIONS.TRIANGLE ? 'bg-white dark:bg-white/10 text-gray-800 dark:text-white shadow-sm border border-gray-200 dark:border-white/10' : 'text-gray-500 dark:text-gray-400'}`} onClick={() => { setAction(ACTIONS.TRIANGLE); setShapesMenuOpen(false) }}><TbTriangle size="1.2rem" /></button></Tooltip>
                <Tooltip text="Diamond"><button className={`p-2 flex justify-center col-span-1 rounded-lg hover:bg-gray-100/80 dark:hover:bg-white/5 ${action === ACTIONS.DIAMOND ? 'bg-white dark:bg-white/10 text-gray-800 dark:text-white shadow-sm border border-gray-200 dark:border-white/10' : 'text-gray-500 dark:text-gray-400'}`} onClick={() => { setAction(ACTIONS.DIAMOND); setShapesMenuOpen(false) }}><BsDiamond size="1.2rem" /></button></Tooltip>
                <Tooltip text="Pentagon"><button className={`p-2 flex justify-center col-span-1 rounded-lg hover:bg-gray-100/80 dark:hover:bg-white/5 ${action === ACTIONS.PENTAGON ? 'bg-white dark:bg-white/10 text-gray-800 dark:text-white shadow-sm border border-gray-200 dark:border-white/10' : 'text-gray-500 dark:text-gray-400'}`} onClick={() => { setAction(ACTIONS.PENTAGON); setShapesMenuOpen(false) }}><TbPentagon size="1.2rem" /></button></Tooltip>
                <Tooltip text="Hexagon"><button className={`p-2 flex justify-center col-span-1 rounded-lg hover:bg-gray-100/80 dark:hover:bg-white/5 ${action === ACTIONS.HEXAGON ? 'bg-white dark:bg-white/10 text-gray-800 dark:text-white shadow-sm border border-gray-200 dark:border-white/10' : 'text-gray-500 dark:text-gray-400'}`} onClick={() => { setAction(ACTIONS.HEXAGON); setShapesMenuOpen(false) }}><TbHexagon size="1.2rem" /></button></Tooltip>
                <Tooltip text="Ellipse"><button className={`p-2 flex justify-center col-span-1 rounded-lg hover:bg-gray-100/80 dark:hover:bg-white/5 ${action === ACTIONS.ELLIPSE ? 'bg-white dark:bg-white/10 text-gray-800 dark:text-white shadow-sm border border-gray-200 dark:border-white/10' : 'text-gray-500 dark:text-gray-400'}`} onClick={() => { setAction(ACTIONS.ELLIPSE); setShapesMenuOpen(false) }}><TbOvalVertical size="1.2rem" /></button></Tooltip>
                <Tooltip text="Star"><button className={`p-2 flex justify-center col-span-1 rounded-lg hover:bg-gray-100/80 dark:hover:bg-white/5 ${action === ACTIONS.STAR ? 'bg-white dark:bg-white/10 text-gray-800 dark:text-white shadow-sm border border-gray-200 dark:border-white/10' : 'text-gray-500 dark:text-gray-400'}`} onClick={() => { setAction(ACTIONS.STAR); setShapesMenuOpen(false) }}><FaRegStar size="1.2rem" /></button></Tooltip>
                <Tooltip text="Connector"><button className={`p-2 flex justify-center col-span-1 rounded-lg hover:bg-gray-100/80 dark:hover:bg-white/5 ${action === ACTIONS.CONNECTOR ? 'bg-white dark:bg-white/10 text-gray-800 dark:text-white shadow-sm border border-gray-200 dark:border-white/10' : 'text-gray-500 dark:text-gray-400'}`} onClick={() => { setAction(ACTIONS.CONNECTOR); setShapesMenuOpen(false) }}><TbRoute size="1.2rem" /></button></Tooltip>
                <Tooltip text="Speech Bubble"><button className={`p-2 flex justify-center col-span-1 rounded-lg hover:bg-gray-100/80 dark:hover:bg-white/5 ${action === ACTIONS.SPEECH_BUBBLE ? 'bg-white dark:bg-white/10 text-gray-800 dark:text-white shadow-sm border border-gray-200 dark:border-white/10' : 'text-gray-500 dark:text-gray-400'}`} onClick={() => { setAction(ACTIONS.SPEECH_BUBBLE); setShapesMenuOpen(false) }}><FaRegCommentDots size="1.2rem" /></button></Tooltip>
                <Tooltip text="Bezier Curve"><button className={`p-2 flex justify-center col-span-1 rounded-lg hover:bg-gray-100/80 dark:hover:bg-white/5 ${action === ACTIONS.BEZIER ? 'bg-white dark:bg-white/10 text-gray-800 dark:text-white shadow-sm border border-gray-200 dark:border-white/10' : 'text-gray-500 dark:text-gray-400'}`} onClick={() => { setAction(ACTIONS.BEZIER); setShapesMenuOpen(false) }}><TbVectorBezier2 size="1.2rem" /></button></Tooltip>
                <Tooltip text="Parallelogram"><button className={`p-2 flex justify-center col-span-1 rounded-lg hover:bg-gray-100/80 dark:hover:bg-white/5 ${action === ACTIONS.PARALLELOGRAM ? 'bg-white dark:bg-white/10 text-gray-800 dark:text-white shadow-sm border border-gray-200 dark:border-white/10' : 'text-gray-500 dark:text-gray-400'}`} onClick={() => { setAction(ACTIONS.PARALLELOGRAM); setShapesMenuOpen(false) }}><svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5,19 9,5 19,5 15,19" /></svg></button></Tooltip>
              </div>
            )}
          </div>

          <div className="w-px h-4 bg-gray-200 dark:bg-[#333] mx-1" />

          {/* COLOR PICKERS */}
          <Tooltip text="Shape color">
            <div className="flex items-center px-2">
              <input
                type="color"
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                className="w-8 h-8 cursor-pointer rounded-md border-0 bg-transparent"
                aria-label="Shape color"
              />
              {/* only show pen color picker when drawing tool is active */}
              {action === ACTIONS.SCRIBBLE && (
                <Tooltip text="Pen color">
                  <input
                    type="color"
                    value={penColor}
                    onChange={(e) => setPenColor(e.target.value)}
                    className="w-8 h-8 ml-2 cursor-pointer rounded-md border-0 bg-transparent"
                    aria-label="Pen color"
                  />
                </Tooltip>
              )}
            </div>
          </Tooltip>

          <div className="w-px h-4 bg-gray-200 dark:bg-[#333] mx-1" />

          <Tooltip text="Export as image">
            <button
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-gray-200 rounded-lg transition-colors"
              onClick={handleExport}
              aria-label="Export as image"
            >
              <IoMdDownload size="1.2rem" />
            </button>
          </Tooltip>
          {/* Delete selected shape button */}
          {selectedShapeId && (
            <Tooltip text="Delete selected shape">
              <button
                className="p-2 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 border border-red-100 dark:border-red-500/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                onClick={handleDeleteSelected}
                aria-label="Delete selected shape"
              >
                <MdDeleteOutline size="1.2rem" />
              </button>
            </Tooltip>
          )}
          <Tooltip text="Clear all">
            <button
              className="p-2 text-gray-400 dark:text-gray-500 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors"
              onClick={handleClearAll}
              aria-label="Clear all"
            >
              <IoMdTrash size="1.2rem" />
            </button>
          </Tooltip>
        </div>
        <button
          className="px-4 py-2 ml-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-40 transition-colors shadow-sm flex items-center gap-2"
          onClick={handleAnalyzeDiagram}
          disabled={isEmpty || isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyse Diagram"
          )}
        </button>
      </div>

      {/* CANVAS AREA */}
      <div
        className="flex-1 relative border-2 border-dashed border-gray-200 dark:border-[#333] rounded-3xl overflow-hidden bg-white dark:bg-[#1e1e1e] transition-colors shadow-inner"
        ref={containerRef}
        style={{ cursor: action === ACTIONS.ERASER ? 'crosshair' : 'default' }}
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
              onClick={() => { transformerRef.current.nodes([]); setSelectedShapeId(null); setSelectedShapeType(null); }}
            />

            {rectangles.map((rect) => (
              <Rect
                key={rect.id}
                id={rect.id}
                {...rect}
                stroke={selectedShapeId === rect.id ? '#3b82f6' : strokeColor}
                strokeWidth={selectedShapeId === rect.id ? 2.5 : 2}
                fill={rect.fillColor}
                draggable={isDraggable}
                onClick={onClick}
                onDragEnd={syncRect(rect.id)}
              />
            ))}
            {circles.map((circle) => (
              <Circle
                key={circle.id}
                id={circle.id}
                {...circle}
                stroke={selectedShapeId === circle.id ? '#3b82f6' : strokeColor}
                strokeWidth={selectedShapeId === circle.id ? 2.5 : 2}
                fill={circle.fillColor}
                draggable={isDraggable}
                onClick={onClick}
                onDragEnd={syncCircle(circle.id)}
              />
            ))}
            {arrows.map((arrow) => (
              <Arrow
                key={arrow.id}
                id={arrow.id}
                {...arrow}
                stroke={selectedShapeId === arrow.id ? '#3b82f6' : strokeColor}
                strokeWidth={selectedShapeId === arrow.id ? 2.5 : 2}
                fill={arrow.fillColor}
                draggable={isDraggable}
                onClick={onClick}
                onDragEnd={syncArrow(arrow.id)}
              />
            ))}
            {triangles.map((t) => (
              <RegularPolygon key={t.id} id={t.id} sides={3} {...t} stroke={selectedShapeId === t.id ? '#3b82f6' : strokeColor} strokeWidth={selectedShapeId === t.id ? 2.5 : 2} fill={t.fillColor} draggable={isDraggable} onClick={onClick} onDragEnd={syncTriangle(t.id)} />
            ))}
            {diamonds.map((d) => (
              <RegularPolygon key={d.id} id={d.id} sides={4} {...d} stroke={selectedShapeId === d.id ? '#3b82f6' : strokeColor} strokeWidth={selectedShapeId === d.id ? 2.5 : 2} fill={d.fillColor} draggable={isDraggable} onClick={onClick} onDragEnd={syncDiamond(d.id)} />
            ))}
            {pentagons.map((p) => (
              <RegularPolygon key={p.id} id={p.id} sides={5} {...p} stroke={selectedShapeId === p.id ? '#3b82f6' : strokeColor} strokeWidth={selectedShapeId === p.id ? 2.5 : 2} fill={p.fillColor} draggable={isDraggable} onClick={onClick} onDragEnd={syncPentagon(p.id)} />
            ))}
            {hexagons.map((h) => (
              <RegularPolygon key={h.id} id={h.id} sides={6} {...h} stroke={selectedShapeId === h.id ? '#3b82f6' : strokeColor} strokeWidth={selectedShapeId === h.id ? 2.5 : 2} fill={h.fillColor} draggable={isDraggable} onClick={onClick} onDragEnd={syncHexagon(h.id)} />
            ))}
            {ellipses.map((e) => (
              <Ellipse key={e.id} id={e.id} {...e} stroke={selectedShapeId === e.id ? '#3b82f6' : strokeColor} strokeWidth={selectedShapeId === e.id ? 2.5 : 2} fill={e.fillColor} draggable={isDraggable} onClick={onClick} onDragEnd={syncEllipse(e.id)} />
            ))}
            {stars.map((s) => (
              <Star key={s.id} id={s.id} numPoints={5} {...s} stroke={selectedShapeId === s.id ? '#3b82f6' : strokeColor} strokeWidth={selectedShapeId === s.id ? 2.5 : 2} fill={s.fillColor} draggable={isDraggable} onClick={onClick} onDragEnd={syncStar(s.id)} />
            ))}
            {parallelograms.map((p) => {
              const skew = Math.abs(p.height) * 0.3;
              const w = p.width;
              const h = p.height;
              return (
                <Line
                  key={p.id}
                  id={p.id}
                  x={p.x}
                  y={p.y}
                  points={[0, h, w, h, w - skew, 0, -skew, 0]}
                  closed
                  fill={p.fillColor}
                  stroke={selectedShapeId === p.id ? '#3b82f6' : strokeColor}
                  strokeWidth={selectedShapeId === p.id ? 2.5 : 2}
                  draggable={isDraggable}
                  onClick={onClick}
                  onDragEnd={syncParallel(p.id)}
                />
              );
            })}
            {connectors.map((c) => (
              <Path key={c.id} id={c.id} data={`M ${c.points[0]} ${c.points[1]} L ${c.points[0]} ${c.points[3]} L ${c.points[2]} ${c.points[3]}`} stroke={selectedShapeId === c.id ? '#3b82f6' : strokeColor} strokeWidth={selectedShapeId === c.id ? 2.5 : 2} fill="transparent" draggable={isDraggable} onClick={onClick} onDragEnd={syncConnector(c.id)} />
            ))}
            {speechBubbles.map((b) => (
              <Path key={b.id} id={b.id} x={b.x} y={b.y} data={`M 0 0 L ${b.width} 0 L ${b.width} ${b.height * 0.8} L ${b.width * 0.6} ${b.height * 0.8} L ${b.width * 0.5} ${b.height} L ${b.width * 0.4} ${b.height * 0.8} L 0 ${b.height * 0.8} Z`} fill={b.fillColor} stroke={selectedShapeId === b.id ? '#3b82f6' : strokeColor} strokeWidth={selectedShapeId === b.id ? 2.5 : 2} draggable={isDraggable} onClick={onClick} onDragEnd={syncSpeech(b.id)} />
            ))}
            {beziers.map((b) => (
              <Path key={b.id} id={b.id} x={b.x} y={b.y} data={`M 0 0 Q ${b.points[2] / 2 + 50} ${b.points[3] / 2 - 50} ${b.points[2]} ${b.points[3]}`} stroke={selectedShapeId === b.id ? '#3b82f6' : strokeColor} strokeWidth={selectedShapeId === b.id ? 2.5 : 2} fill="transparent" draggable={isDraggable} onClick={onClick} onDragEnd={syncBezier(b.id)} />
            ))}
            {scribbles.map((s) => (
              <Line
                key={s.id}
                id={s.id}
                {...s}
                stroke={s.strokeColor}
                strokeWidth={2}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation="source-over"
                draggable={isDraggable}
                onClick={onClick}
                onDragEnd={syncScribble(s.id)}
              />
            ))}
            {textboxes.map((text) => (
              <Text
                key={text.id}
                id={text.id}
                {...text}
                text={editingId === text.id ? "" : text.text}
                fontFamily="'Inter', sans-serif"
                fontStyle="500"
                fontSize={20}
                padding={5}
                draggable={isDraggable}
                onClick={onClick}
                onDragEnd={syncTextbox(text.id)}
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
            <div className="w-16 h-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl flex items-center justify-center mb-4 opacity-70">
              <LuPencil size="1.5rem" className="text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-gray-600 dark:text-gray-300 font-semibold text-lg">
              Start drawing
            </h3>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
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

      <DiagramAnalysisModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={analysisData}
        loading={isAnalyzing}
      />
    </div>
  );
}
