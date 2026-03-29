import { TbRectangle, TbEraser, TbTriangle, TbPentagon, TbHexagon, TbOvalVertical, TbVectorBezier2, TbRoute } from "react-icons/tb";
import { IoMdDownload, IoMdTrash } from "react-icons/io";
import { FaLongArrowAltRight, FaRegStar } from "react-icons/fa";
import {
  LuPencil, LuType, LuUndo2, LuRedo2, LuHand, LuInfinity, LuFile, LuPenTool as LuFileEdit, LuMonitor, LuPlus, LuSettings2,
  LuChevronDown, LuSave, LuDownload, LuCopy, LuClipboard, LuTrash2, LuLayoutGrid,
  LuMaximize, LuZoomIn, LuZoomOut, LuSquare, LuCircle,
  LuArrowRight, LuPenTool, LuImage, LuStickyNote,
  LuLayers, LuGroup, LuUngroup
} from 'react-icons/lu';
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
  Group,
  Image,
} from "react-konva";
import Konva from "konva";
import { useRef, useState, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import { v4 as uuidv4 } from "uuid";

import { ACTIONS } from "../constants";
import { auth } from "../utils/firebase";
import Tooltip from "./Tooltip";
import DiagramAnalysisModal from "./DiagramAnalysisModal";
import { DiagramData } from "../types";
import axios from "axios";
import { getBoundingBox, renderToOffscreenCanvas } from "../utils/canvasUtils";
import PagesSidebar from "./PagesSidebar";

// Grid pattern will be created on mount so it respects current theme CSS variables

interface CanvasProps {
  activeSessionId: string | null;
  onNewSession: () => void;
  onStateChange: (state: {
    canUndo: boolean;
    canRedo: boolean;
    hasSelection: boolean;
    appMode: 'single' | 'pages';
  }) => void;
  onAnalysisSuccess?: () => void;
}

interface CanvasPage {
  id: string;
  name: string;
  rectangles: any[];
  circles: any[];
  arrows: any[];
  scribbles: any[];
  textboxes: any[];
  triangles: any[];
  diamonds: any[];
  pentagons: any[];
  hexagons: any[];
  ellipses: any[];
  stars: any[];
  parallelograms: any[];
  images: any[];
  connectors: any[];
  speechBubbles: any[];
  beziers: any[];
  history: any[];
  historyIndex: number;
}

const SloppyShape = ({ type, x, y, width, height, radius, radiusX, radiusY, innerRadius, outerRadius, stroke, fillColor, strokeWidth, isSelected, draggable, onClick, onDragEnd, id }: any) => {
  const nodeRef = useRef<any>(null);

  // Hardened coordinate/dimension guards
  const safeX = isNaN(x) ? 0 : x;
  const safeY = isNaN(y) ? 0 : y;
  const safeW = isNaN(width) ? 10 : Math.min(Math.abs(width), 4000);
  const safeH = isNaN(height) ? 10 : Math.min(Math.abs(height), 4000);
  const safeR = isNaN(radius) ? 5 : radius;
  const safeRX = isNaN(radiusX) ? 5 : radiusX;
  const safeRY = isNaN(radiusY) ? 5 : radiusY;
  const safeIR = isNaN(innerRadius) ? 2.5 : innerRadius;
  const safeOR = isNaN(outerRadius) ? 5 : outerRadius;

  const finalStroke = isSelected ? '#3b82f6' : (stroke || '#000');
  const finalStrokeWidth = isSelected ? (strokeWidth || 2) + 0.5 : (strokeWidth || 2);
  const finalFill = fillColor === 'transparent' ? undefined : fillColor;

  const dragBoundFunc = (pos: { x: number, y: number }) => {
    if (isNaN(pos.x) || isNaN(pos.y)) {
      return nodeRef.current ? nodeRef.current.absolutePosition() : pos;
    }
    return pos;
  };

  if (type === 'rectangle') return <Rect ref={nodeRef} x={safeX} y={safeY} width={safeW} height={safeH} stroke={finalStroke} strokeWidth={finalStrokeWidth} fill={finalFill} draggable={draggable} onClick={onClick} onDragEnd={onDragEnd} dragBoundFunc={dragBoundFunc} id={id} name="selectable-shape" />;
  if (type === 'circle') return <Circle ref={nodeRef} x={safeX} y={safeY} radius={safeR} stroke={finalStroke} strokeWidth={finalStrokeWidth} fill={finalFill} draggable={draggable} onClick={onClick} onDragEnd={onDragEnd} dragBoundFunc={dragBoundFunc} id={id} name="selectable-shape" />;
  if (type === 'ellipse') return <Ellipse ref={nodeRef} x={safeX} y={safeY} radiusX={safeRX} radiusY={safeRY} stroke={finalStroke} strokeWidth={finalStrokeWidth} fill={finalFill} draggable={draggable} onClick={onClick} onDragEnd={onDragEnd} dragBoundFunc={dragBoundFunc} id={id} name="selectable-shape" />;
  if (type === 'triangle') return <RegularPolygon ref={nodeRef} x={safeX} y={safeY} sides={3} radius={safeR} stroke={finalStroke} strokeWidth={finalStrokeWidth} fill={finalFill} draggable={draggable} onClick={onClick} onDragEnd={onDragEnd} dragBoundFunc={dragBoundFunc} id={id} name="selectable-shape" />;
  if (type === 'diamond') return <RegularPolygon ref={nodeRef} x={safeX} y={safeY} sides={4} radius={safeR} stroke={finalStroke} strokeWidth={finalStrokeWidth} fill={finalFill} draggable={draggable} onClick={onClick} onDragEnd={onDragEnd} dragBoundFunc={dragBoundFunc} id={id} name="selectable-shape" />;
  if (type === 'pentagon') return <RegularPolygon ref={nodeRef} x={safeX} y={safeY} sides={5} radius={safeR} stroke={finalStroke} strokeWidth={finalStrokeWidth} fill={finalFill} draggable={draggable} onClick={onClick} onDragEnd={onDragEnd} dragBoundFunc={dragBoundFunc} id={id} name="selectable-shape" />;
  if (type === 'hexagon') return <RegularPolygon ref={nodeRef} x={safeX} y={safeY} sides={6} radius={safeR} stroke={finalStroke} strokeWidth={finalStrokeWidth} fill={finalFill} draggable={draggable} onClick={onClick} onDragEnd={onDragEnd} dragBoundFunc={dragBoundFunc} id={id} name="selectable-shape" />;
  if (type === 'star') return <Star ref={nodeRef} x={safeX} y={safeY} numPoints={5} innerRadius={safeIR} outerRadius={safeOR} stroke={finalStroke} strokeWidth={finalStrokeWidth} fill={finalFill} draggable={draggable} onClick={onClick} onDragEnd={onDragEnd} dragBoundFunc={dragBoundFunc} id={id} name="selectable-shape" />;
  if (type === 'parallelogram') {
    const skew = Math.abs(safeH) * 0.3;
    return <Line ref={nodeRef} x={safeX} y={safeY} points={[0, safeH, safeW, safeH, safeW - skew, 0, -skew, 0]} closed fill={finalFill} stroke={finalStroke} strokeWidth={finalStrokeWidth} draggable={draggable} onClick={onClick} onDragEnd={onDragEnd} dragBoundFunc={dragBoundFunc} id={id} name="selectable-shape" />;
  }

  return null;
};

const ImageItem = ({ s, isSelected, draggable, onClick, onDragEnd }: any) => {
  const safeX = isNaN(s.x) ? 0 : s.x;
  const safeY = isNaN(s.y) ? 0 : s.y;
  const safeW = isNaN(s.width) ? 100 : s.width;
  const safeH = isNaN(s.height) ? 100 : s.height;
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const imageRef = useRef<any>(null);

  useEffect(() => {
    const img = new window.Image();
    img.src = s.src;
    img.onload = () => {
      setImage(img);
    };
  }, [s.src]);

  return (
    <Image
      ref={imageRef}
      id={s.id}
      x={safeX}
      y={safeY}
      width={safeW}
      height={safeH}
      image={image || undefined}
      draggable={draggable}
      onClick={onClick}
      onTap={onClick}
      onDragEnd={onDragEnd}
      dragBoundFunc={function (pos) {
        if (isNaN(pos.x) || isNaN(pos.y)) return this.absolutePosition();
        return pos;
      }}
      name="selectable-shape"
    />
  );
};

const DrawingCanvas = forwardRef((props: CanvasProps, ref) => {
  const { activeSessionId, onNewSession, onStateChange, onAnalysisSuccess } = props;
  const [gridPattern, setGridPattern] = useState<HTMLCanvasElement | null>(
    null,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>();
  const transformerRef = useRef<any>();
  const isInitialLoad = useRef(true);
  const internalClipboard = useRef<any[]>([]);

  const [size, setSize] = useState({ width: 0, height: 0 });
  const [action, setAction] = useState(ACTIONS.SELECT);
  const [fillColor, setFillColor] = useState("transparent"); // Default no fill
  const [penColor, setPenColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);

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
  const [images, setImages] = useState<any[]>([]);

  // Multi-page State
  const [appMode, setAppMode] = useState<'single' | 'pages'>('single');
  const [pages, setPages] = useState<CanvasPage[]>([]);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);

  const [shapesMenuOpen, setShapesMenuOpen] = useState(false);
  const [fillMenuOpen, setFillMenuOpen] = useState(false);
  const [penMenuOpen, setPenMenuOpen] = useState(false);

  // Track which shapes are selected (for delete / move)
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
  const [selectedShapeType, setSelectedShapeType] = useState<string | null>(null);

  // Marquee Selection State
  const [isSelectingRectangle, setIsSelectingRectangle] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });

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

  const strokeColor = getCssVar("--text", strokeColorDefault);

  // Track default properties for NEW shapes
  const [activeProps, setActiveProps] = useState({
    stroke: strokeColor,
    fill: "transparent",
    strokeWidth: 2,
  });

  // Sync activeProps with theme when it changes
  useEffect(() => {
    setActiveProps(prev => ({ ...prev, stroke: strokeColor }));
  }, [strokeColor]);

  const isPaining = useRef(false);
  const currentShapeId = useRef<string | null>(null);
  const isDraggable = action === ACTIONS.SELECT;

  // ─── Helper: Get selected shape object ──────────────────────────────────
  const getSelectedShape = () => {
    if (selectedShapeIds.length === 0) return null;
    const all = [
      ...rectangles, ...circles, ...arrows, ...triangles, ...diamonds,
      ...pentagons, ...hexagons, ...ellipses, ...stars, ...parallelograms,
      ...connectors, ...speechBubbles, ...beziers, ...scribbles, ...images
    ];
    // Return the first selected shape for property editing
    return all.find(s => s.id === selectedShapeIds[0]);
  };

  const updateSelectedShape = (newProps: any) => {
    if (selectedShapeIds.length === 0) return;
    const update = (list: any[]) => list.map(s => selectedShapeIds.includes(s.id) ? { ...s, ...newProps } : s);
    setRectangles(update);
    setCircles(update);
    setArrows(update);
    setTriangles(update);
    setDiamonds(update);
    setPentagons(update);
    setHexagons(update);
    setEllipses(update);
    setStars(update);
    setParallelograms(update);
    setConnectors(update);
    setSpeechBubbles(update);
    setBeziers(update);
    setScribbles(update);
    setImages(update);
  };
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);

  // ─── Canvas Mode: A4 Pages vs Infinite ──────────────────────────────────
  const A4_WIDTH = 794;   // A4 at 96dpi (210mm)
  const A4_HEIGHT = 1123; // A4 at 96dpi (297mm)
  const PAGE_GAP = 28;    // pixels between pages
  const PAGE_PADDING = 40; // outer padding around pages

  type CanvasMode = 'a4' | 'infinite';
  const [canvasMode, setCanvasMode] = useState<CanvasMode>('a4');
  const [numPages, setNumPages] = useState(1);

  // Derived A4 stage dimensions
  const a4StageWidth = A4_WIDTH + PAGE_PADDING * 2;
  const a4StageHeight = numPages * A4_HEIGHT + (numPages - 1) * PAGE_GAP + PAGE_PADDING * 2;

  // Horizontal offset to center the A4 page in the viewport
  // Stability Fix: Use a fixed stage coordinate system and center the view instead of shifting the group
  const pageOffsetX = 0;

  const centerView = () => {
    const stage = stageRef.current;
    if (!stage || !size.width || canvasMode !== 'a4') return;

    // Calculate scale to fit page width plus some padding
    const padding = 80;
    const availableWidth = size.width - padding;
    const initialScale = Math.min(1.2, availableWidth / A4_WIDTH);

    // Position stage so A4 page (at x=0) is centered
    const viewportCenterX = size.width / 2;
    const initialX = viewportCenterX - (A4_WIDTH * initialScale) / 2;

    setStageScale(initialScale);
    setStagePos({ x: initialX, y: 20 });
  };

  // Center view on startup or mode switch
  useEffect(() => {
    if (size.width > 0 && canvasMode === 'a4' && isInitialLoad.current) {
      centerView();
    }
  }, [size.width, canvasMode]);

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const scaleBy = 1.08;
    const newScale = e.evt.deltaY < 0
      ? Math.min(oldScale * scaleBy, 8)
      : Math.max(oldScale / scaleBy, 0.1);
    if (isNaN(newScale)) return;
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    setStageScale(newScale);
    setStagePos(newPos);
  };

  // ─── History (undo / redo) ───────────────────────────────────────────────
  type CanvasState = {
    rectangles: any[]; circles: any[]; arrows: any[]; scribbles: any[];
    textboxes: any[]; triangles: any[]; diamonds: any[]; pentagons: any[];
    hexagons: any[]; ellipses: any[]; beziers: any[]; connectors: any[];
    speechBubbles: any[]; stars: any[]; parallelograms: any[];
    images: any[];
  };

  const historyStack = useRef<CanvasState[]>([]);
  const historyIndex = useRef<number>(-1);

  const getSnapshot = (): CanvasState => ({
    rectangles: [...rectangles], circles: [...circles], arrows: [...arrows],
    scribbles: [...scribbles], textboxes: [...textboxes], triangles: [...triangles],
    diamonds: [...diamonds], pentagons: [...pentagons], hexagons: [...hexagons],
    ellipses: [...ellipses], beziers: [...beziers], connectors: [...connectors],
    speechBubbles: [...speechBubbles], stars: [...stars], parallelograms: [...parallelograms],
    images: [...images],
  });

  const restoreSnapshot = (s: CanvasState) => {
    setRectangles(s.rectangles); setCircles(s.circles); setArrows(s.arrows);
    setScribbles(s.scribbles); setTextboxes(s.textboxes); setTriangles(s.triangles);
    setDiamonds(s.diamonds); setPentagons(s.pentagons); setHexagons(s.hexagons);
    setEllipses(s.ellipses); setBeziers(s.beziers); setConnectors(s.connectors);
    setSpeechBubbles(s.speechBubbles); setStars(s.stars); setParallelograms(s.parallelograms);
    setImages(s.images);
  };

  // --- Multi-page Management Functions ---

  const canUndo = appMode === 'pages'
    ? (pages.find(p => p.id === currentPageId)?.historyIndex || 0) > 0
    : historyIndex.current > 0;
  const canRedo = appMode === 'pages'
    ? (pages.find(p => p.id === currentPageId)?.historyIndex || 0) < (pages.find(p => p.id === currentPageId)?.history.length || 0) - 1
    : historyIndex.current < historyStack.current.length - 1;

  // Expose actions to parent via ref
  useImperativeHandle(ref, () => ({
    handleUndo,
    handleRedo,
    handleDeleteSelected,
    handleCopySelected,
    handleInternalPaste,
    handleExport,
    handleInsertShape: (type: string) => {
      if (type === 'RECTANGLE') setAction(ACTIONS.RECTANGLE);
      else if (type === 'CIRCLE') setAction(ACTIONS.CIRCLE);
      else if (type === 'ARROW') setAction(ACTIONS.ARROW);
      else if (type === 'SCRIBBLE') setAction(ACTIONS.SCRIBBLE);
      else if (type === 'TEXT') setAction(ACTIONS.TEXT);
    },
    handleToggleMode: togglePagesMode,
    handleAddPage,
    handleDuplicatePage: () => currentPageId && handleDuplicatePage(currentPageId),
    handleDeletePage: () => currentPageId && handleDeletePage(currentPageId),
    handleZoomIn: () => {
      const stage = stageRef.current;
      if (stage) {
        const scaleBy = 1.2;
        const oldScale = stage.scaleX();
        const newScale = Math.min(oldScale * scaleBy, 8);
        setStageScale(newScale);
      }
    },
    handleZoomOut: () => {
      const stage = stageRef.current;
      if (stage) {
        const scaleBy = 1.2;
        const oldScale = stage.scaleX();
        const newScale = Math.max(oldScale / scaleBy, 0.1);
        setStageScale(newScale);
      }
    },
    handleToggleGrid: () => {
      // Logic for toggle grid could be added here
    },
    handleOpenRecentAnalysis: async (diagram: any) => {
      setIsAnalyzing(true);
      setIsModalOpen(true);
      setAnalysisData(null);
      
      try {
        // diagram.strokeData is an object { rectangles: [], circles: [], ... }
        // getBoundingBox and renderToOffscreenCanvas expect a flat array of all elements.
        const elements = Object.values(diagram.strokeData).flat();
        const box = getBoundingBox(elements);
        const dataUrl = await renderToOffscreenCanvas(elements, box);
        
        // Convert dataUrl to File object to support 'Improve' feature
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], "diagram.png", { type: "image/png" });
        
        setAnalysisData({
          originalImage: dataUrl,
          originalImageFile: file,
          mermaidCode: diagram.mermaidCode,
          explanation: diagram.explanation
        });
      } catch (err) {
        console.error("Failed to reconstruct analysis from history:", err);
        alert("Failed to load historical analysis preview.");
        setIsModalOpen(false);
      } finally {
        setIsAnalyzing(false);
      }
    }
  }));

  // Report state changes to parent (report only if something changed)
  const lastStateReport = useRef<string>('');
  useEffect(() => {
    const currentState = JSON.stringify({ canUndo, canRedo, hasSelection: selectedShapeIds.length > 0, appMode });
    if (currentState !== lastStateReport.current) {
      onStateChange({
        canUndo,
        canRedo,
        hasSelection: selectedShapeIds.length > 0,
        appMode
      });
      lastStateReport.current = currentState;
    }
  }, [canUndo, canRedo, selectedShapeIds.length, appMode, onStateChange]);

  const getCurrentPageData = (id: string, name: string): CanvasPage => ({
    id,
    name,
    ...getSnapshot(),
    history: [...historyStack.current],
    historyIndex: historyIndex.current,
  });

  const saveCurrentPageToStore = () => {
    if (appMode !== 'pages' || !currentPageId) return;
    setPages(prev => prev.map(p => p.id === currentPageId ? getCurrentPageData(p.id, p.name) : p));
  };

  const loadPageFromStore = (page: CanvasPage) => {
    restoreSnapshot(page);
    historyStack.current = [...page.history];
    historyIndex.current = page.historyIndex;
    setCurrentPageId(page.id);
  };

  const handleSwitchPage = (nextId: string) => {
    if (nextId === currentPageId) return;
    saveCurrentPageToStore();
    const nextPage = pages.find(p => p.id === nextId);
    if (nextPage) loadPageFromStore(nextPage);
  };

  const togglePagesMode = () => {
    if (appMode === 'single') {
      // Switch ON Pages Mode
      const firstPage = getCurrentPageData(uuidv4(), "Page 1");
      setPages([firstPage]);
      setCurrentPageId(firstPage.id);
      setAppMode('pages');
    } else {
      // Switch OFF Pages Mode
      // Collapse current page into single canvas
      setAppMode('single');
      setCurrentPageId(null);
      // Pages array remains but is hidden
    }
  };

  const handleAddPage = () => {
    saveCurrentPageToStore();
    const newPageId = uuidv4();
    const newPage: CanvasPage = {
      id: newPageId,
      name: `Page ${pages.length + 1}`,
      rectangles: [], circles: [], arrows: [], scribbles: [],
      textboxes: [], triangles: [], diamonds: [], pentagons: [],
      hexagons: [], ellipses: [], beziers: [], connectors: [],
      speechBubbles: [], stars: [], parallelograms: [], images: [],
      history: [], historyIndex: -1,
    };
    setPages(prev => [...prev, newPage]);
    loadPageFromStore(newPage);
  };

  const handleDeletePage = (id: string) => {
    if (pages.length <= 1) return;
    const newPages = pages.filter(p => p.id !== id);
    setPages(newPages);
    if (currentPageId === id) {
      loadPageFromStore(newPages[0]);
    }
  };

  const handleDuplicatePage = (id: string) => {
    saveCurrentPageToStore();
    const pageToDup = pages.find(p => p.id === id);
    if (!pageToDup) return;
    const newPage = { ...JSON.parse(JSON.stringify(pageToDup)), id: uuidv4(), name: `${pageToDup.name} (Copy)` };
    setPages(prev => [...prev, newPage]);
    loadPageFromStore(newPage);
  };

  const handleRenamePage = (id: string, newName: string) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
  };


  const pushHistory = (snapshot: CanvasState) => {
    // Drop any future states when a new action is taken
    const newStack = historyStack.current.slice(0, historyIndex.current + 1);
    newStack.push(snapshot);
    // Cap history at 50 steps to avoid unbounded memory usage
    if (newStack.length > 50) newStack.shift();
    historyStack.current = newStack;
    historyIndex.current = newStack.length - 1;
  };

  const handleUndo = () => {
    if (historyIndex.current <= 0) return;
    historyIndex.current -= 1;
    restoreSnapshot(historyStack.current[historyIndex.current]);
    transformerRef.current?.nodes([]);
    setSelectedShapeIds([]);
    setSelectedShapeType(null);
  };

  const handleRedo = () => {
    if (historyIndex.current >= historyStack.current.length - 1) return;
    historyIndex.current += 1;
    restoreSnapshot(historyStack.current[historyIndex.current]);
    transformerRef.current?.nodes([]);
    setSelectedShapeIds([]);
    setSelectedShapeType(null);
  };


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
    setImages((p) => p.filter((s) => s.id !== id));
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
    setImages([]);

    const loadSessionStrokes = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/sessions/${activeSessionId}/strokes`, {
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
          setImages(sd.images || []);
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
        await axios.post(`${import.meta.env.VITE_API_URL}/sessions/${activeSessionId}/strokes`, {
          strokeData: {
            rectangles, circles, arrows, scribbles, textboxes,
            triangles, diamonds, pentagons, hexagons, ellipses, beziers, connectors, speechBubbles, stars, parallelograms, images
          }
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Failed to auto-save strokes:", err);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [rectangles, circles, arrows, scribbles, textboxes, triangles, diamonds, pentagons, hexagons, ellipses, beziers, connectors, speechBubbles, stars, parallelograms, images, activeSessionId]);

  // ─── Auto-expand pages in A4 mode ────────────────────────────────────────
  useEffect(() => {
    if (canvasMode !== 'a4') return;
    // Find the bottommost Y among all shapes
    const bottoms = [
      ...rectangles.map(r => (r.y || 0) + Math.abs(r.height || 0)),
      ...circles.map(c => (c.y || 0) + (c.radius || 0)),
      ...arrows.map(a => Math.max(a.points?.[1] || 0, a.points?.[3] || 0)),
      ...scribbles.flatMap(s => {
        const ys = s.points?.filter((_: any, i: number) => i % 2 === 1) || [];
        return [Math.max(0, ...ys)];
      }),
      ...textboxes.map(t => (t.y || 0) + 30),
      ...triangles.map(t => (t.y || 0) + (t.radius || 0)),
      ...diamonds.map(d => (d.y || 0) + (d.radius || 0)),
      ...pentagons.map(p => (p.y || 0) + (p.radius || 0)),
      ...hexagons.map(h => (h.y || 0) + (h.radius || 0)),
      ...ellipses.map(e => (e.y || 0) + (e.radiusY || 0)),
      ...stars.map(s => (s.y || 0) + (s.outerRadius || 0)),
      ...parallelograms.map(p => (p.y || 0) + Math.abs(p.height || 0)),
      ...connectors.map(c => Math.max(c.points?.[1] || 0, c.points?.[3] || 0)),
      ...speechBubbles.map(b => (b.y || 0) + Math.abs(b.height || 0)),
      ...beziers.map(b => (b.y || 0) + Math.abs(b.points?.[3] || 0)),
    ];
    const maxY = Math.max(0, ...bottoms);
    // Account for page padding offset
    const contentY = maxY - PAGE_PADDING;
    const needed = Math.max(1, Math.ceil((contentY + 150) / (A4_HEIGHT + PAGE_GAP)));
    if (needed > numPages) setNumPages(Math.min(needed, 50)); // Safety cap at 50 pages
  }, [rectangles, circles, arrows, scribbles, textboxes, triangles, diamonds, pentagons, hexagons, ellipses, beziers, connectors, speechBubbles, stars, parallelograms, canvasMode, numPages]);

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

    return () => {
      observer.disconnect();
    };
  }, []);

  // Separate Effect for System Paste (Minimal dependencies)
  useEffect(() => {
    // Handle Paste (System Clipboard Images)
    const handlePaste = async (e: ClipboardEvent) => {
      // Don't intercept if user is typing in a textarea or input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (!blob) continue;

          // Prevent default to avoid browser trying to paste image as text
          e.preventDefault();

          const reader = new FileReader();
          reader.onload = (event) => {
            const src = event.target?.result as string;
            const img = new window.Image();
            img.src = src;
            img.onload = () => {
              const id = uuidv4();

              // Snapshot for undo
              pushHistory(getSnapshot());

              // Calculate center of view
              let pasteX = 100;
              let pasteY = 100;
              const stage = stageRef.current;
              if (stage) {
                const transform = stage.getAbsoluteTransform().copy().invert();
                const container = containerRef.current;
                if (container) {
                  const center = transform.point({
                    x: container.offsetWidth / 2,
                    y: container.offsetHeight / 2
                  });
                  pasteX = center.x - (img.width > 500 ? 250 : img.width / 2);
                  pasteY = center.y - ((img.width > 500 ? 500 : img.width) * (img.height / img.width)) / 2;
                }
              }

              setImages((prev) => [
                ...prev,
                {
                  id,
                  x: pasteX,
                  y: pasteY,
                  src,
                  width: img.width > 500 ? 500 : img.width,
                  height: (img.width > 500 ? 500 : img.width) * (img.height / img.width),
                },
              ]);
              // Select the newly pasted image
              setSelectedShapeIds([id]);
              setSelectedShapeType('Image');
            };
          };
          reader.readAsDataURL(blob);
          break; // ONLY ONE IMAGE AT A TIME
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []); // Only on mount/unmount



  const handleClearAll = () => {
    pushHistory(getSnapshot());
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
    setImages([]);
  };

  // Helper: Determine if pointer is on a Transformer handle or selected node
  function isPointerOnTransformerHandle(stage: Konva.Stage, pointerPos: Konva.Vector2d) {
    const transformer = transformerRef.current;
    if (!transformer) return false;
    // Konva Transformer has a method to get the bounding box and anchors
    const trRect = transformer.getClientRect();
    // Check if pointer is inside the transformer's bounding box (with some margin)
    if (
      pointerPos.x >= trRect.x - 8 &&
      pointerPos.x <= trRect.x + trRect.width + 8 &&
      pointerPos.y >= trRect.y - 8 &&
      pointerPos.y <= trRect.y + trRect.height + 8
    ) {
      // Further, check if pointer is on an anchor (resize handle)
      const anchors = transformer.getAnchors ? transformer.getAnchors() : [];
      for (const anchor of anchors) {
        const node = transformer.findOne(`.${anchor}`);
        if (node) {
          const box = node.getClientRect();
          if (
            pointerPos.x >= box.x - 6 &&
            pointerPos.x <= box.x + box.width + 6 &&
            pointerPos.y >= box.y - 6 &&
            pointerPos.y <= box.y + box.height + 6
          ) {
            return true; // On a handle
          }
        }
      }
      // If not on a handle, but inside bounding box, treat as on selected node
      return true;
    }
    return false;
  }

  function onPointerDown() {
    if (editingId) return;
    const stage = stageRef.current;
    if (!stage) return;
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = stage.getPointerPosition();
    if (!pos) return;
    const { x, y } = transform.point(pos);
    if (isNaN(x) || isNaN(y)) return;

    // --- Marquee vs Resize/Transform Conflict Resolution ---
    if (action === ACTIONS.SELECT) {
      // If pointer is on a transformer handle or selected node, do NOT start marquee
      const absPointer = stage.getPointerPosition();
      if (absPointer && isPointerOnTransformerHandle(stage, absPointer)) {
        // Let Konva handle resize/transform
        return;
      }
    }

    const id = uuidv4();

    // Snapshot state BEFORE drawing begins (so undo reverts the full stroke)
    if (action !== ACTIONS.ERASER) {
      pushHistory(getSnapshot());
    }

    currentShapeId.current = id;
    isPaining.current = true;

    switch (action) {
      case ACTIONS.SELECT: {
        const hit = stage.getIntersection({ x, y });
        const hitId = hit ? hit.id() : "";
        if (!hit || hitId.includes('page-') || hitId === 'background' || hitId === "") {
          setIsSelectingRectangle(true);
          setSelectionStart({ x, y });
          setSelectionEnd({ x, y });
          setSelectedShapeIds([]);
          setSelectedShapeType(null);
          transformerRef.current.nodes([]);
        }
        break;
      }
      case ACTIONS.RECTANGLE:
        setRectangles((prev) => [
          ...prev,
          { id, x, y, height: 5, width: 5, fillColor: activeProps.fill, stroke: activeProps.stroke, strokeWidth: activeProps.strokeWidth },
        ]);
        break;
      case ACTIONS.CIRCLE:
        setCircles((prev) => [...prev, { id, x, y, radius: 5, fillColor: activeProps.fill, stroke: activeProps.stroke, strokeWidth: activeProps.strokeWidth }]);
        break;
      case ACTIONS.ARROW:
        setArrows((prev) => [
          ...prev,
          { id, points: [x, y, x + 5, y + 5], fillColor: activeProps.fill, stroke: activeProps.stroke, strokeWidth: activeProps.strokeWidth },
        ]);
        break;
      case ACTIONS.TRIANGLE:
        setTriangles((prev) => [...prev, { id, x, y, radius: 5, fillColor: activeProps.fill, stroke: activeProps.stroke, strokeWidth: activeProps.strokeWidth }]);
        break;
      case ACTIONS.DIAMOND:
        setDiamonds((prev) => [...prev, { id, x, y, radius: 5, fillColor: activeProps.fill, stroke: activeProps.stroke, strokeWidth: activeProps.strokeWidth }]);
        break;
      case ACTIONS.PENTAGON:
        setPentagons((prev) => [...prev, { id, x, y, radius: 5, fillColor: activeProps.fill, stroke: activeProps.stroke, strokeWidth: activeProps.strokeWidth }]);
        break;
      case ACTIONS.HEXAGON:
        setHexagons((prev) => [...prev, { id, x, y, radius: 5, fillColor: activeProps.fill, stroke: activeProps.stroke, strokeWidth: activeProps.strokeWidth }]);
        break;
      case ACTIONS.ELLIPSE:
        setEllipses((prev) => [...prev, { id, x, y, radiusX: 5, radiusY: 5, fillColor: activeProps.fill, stroke: activeProps.stroke, strokeWidth: activeProps.strokeWidth }]);
        break;
      case ACTIONS.STAR:
        setStars((prev) => [...prev, { id, x, y, innerRadius: 2.5, outerRadius: 5, fillColor: activeProps.fill, stroke: activeProps.stroke, strokeWidth: activeProps.strokeWidth }]);
        break;
      case ACTIONS.PARALLELOGRAM:
        setParallelograms((prev) => [...prev, { id, x, y, width: 5, height: 5, fillColor: activeProps.fill, stroke: activeProps.stroke, strokeWidth: activeProps.strokeWidth }]);
        break;
      case ACTIONS.CONNECTOR:
        setConnectors((prev) => [...prev, { id, points: [x, y, x, y], fillColor: activeProps.fill, stroke: activeProps.stroke, strokeWidth: activeProps.strokeWidth }]);
        break;
      case ACTIONS.SPEECH_BUBBLE:
        setSpeechBubbles((prev) => [...prev, { id, x, y, width: 5, height: 5, fillColor: activeProps.fill, stroke: activeProps.stroke, strokeWidth: activeProps.strokeWidth }]);
        break;
      case ACTIONS.BEZIER:
        setBeziers((prev) => [...prev, { id, x, y, points: [0, 0, 5, 5], fillColor: activeProps.fill, stroke: activeProps.stroke, strokeWidth: activeProps.strokeWidth }]);
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
        const hit = stage.getIntersection({ x, y });
        if (hit && hit.id()) {
          pushHistory(getSnapshot());
          deleteShapeById(hit.id());
        }
        break;
      }
    }
  }

  function onPointerMove() {
    if (action === ACTIONS.HAND || !isPaining.current) return;
    if (action === ACTIONS.SELECT && !isSelectingRectangle) return;
    const stage = stageRef.current;
    if (!stage) return;
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = stage.getPointerPosition();
    if (!pos) return;
    const { x, y } = transform.point(pos);
    if (isNaN(x) || isNaN(y)) return;

    switch (action) {
      case ACTIONS.SELECT:
        if (isSelectingRectangle) {
          setSelectionEnd({ x, y });
        }
        break;
      case ACTIONS.RECTANGLE:
        setRectangles((prev) =>
          prev.map((r) =>
            r.id === currentShapeId.current
              ? {
                ...r,
                x: Math.min(r.x, x),
                y: Math.min(r.y, y),
                width: Math.abs(x - r.x),
                height: Math.abs(y - r.y)
              }
              : r,
          ),
        );
        break;
      case ACTIONS.CIRCLE:
        setCircles((prev) =>
          prev.map((c) =>
            c.id === currentShapeId.current
              ? { ...c, radius: isNaN(((y - c.y) ** 2 + (x - c.x) ** 2) ** 0.5) ? c.radius : ((y - c.y) ** 2 + (x - c.x) ** 2) ** 0.5 }
              : c,
          ),
        );
        break;
      case ACTIONS.ARROW:
        setArrows((prev) =>
          prev.map((a) =>
            a.id === currentShapeId.current
              ? { ...a, points: [a.points[0], a.points[1], isNaN(x) ? a.points[2] : x, isNaN(y) ? a.points[3] : y] }
              : a,
          ),
        );
        break;
      case ACTIONS.TRIANGLE:
        setTriangles((prev) => prev.map((t) => t.id === currentShapeId.current ? { ...t, radius: isNaN(Math.max(5, ((y - t.y) ** 2 + (x - t.x) ** 2) ** 0.5)) ? t.radius : Math.max(5, ((y - t.y) ** 2 + (x - t.x) ** 2) ** 0.5) } : t));
        break;
      case ACTIONS.DIAMOND:
        setDiamonds((prev) => prev.map((t) => t.id === currentShapeId.current ? { ...t, radius: isNaN(Math.max(5, ((y - t.y) ** 2 + (x - t.x) ** 2) ** 0.5)) ? t.radius : Math.max(5, ((y - t.y) ** 2 + (x - t.x) ** 2) ** 0.5) } : t));
        break;
      case ACTIONS.PENTAGON:
        setPentagons((prev) => prev.map((t) => t.id === currentShapeId.current ? { ...t, radius: isNaN(Math.max(5, ((y - t.y) ** 2 + (x - t.x) ** 2) ** 0.5)) ? t.radius : Math.max(5, ((y - t.y) ** 2 + (x - t.x) ** 2) ** 0.5) } : t));
        break;
      case ACTIONS.HEXAGON:
        setHexagons((prev) => prev.map((t) => t.id === currentShapeId.current ? { ...t, radius: isNaN(Math.max(5, ((y - t.y) ** 2 + (x - t.x) ** 2) ** 0.5)) ? t.radius : Math.max(5, ((y - t.y) ** 2 + (x - t.x) ** 2) ** 0.5) } : t));
        break;
      case ACTIONS.ELLIPSE:
        setEllipses((prev) => prev.map((e) => e.id === currentShapeId.current ? { ...e, radiusX: isNaN(Math.abs(x - e.x)) ? e.radiusX : Math.abs(x - e.x), radiusY: isNaN(Math.abs(y - e.y)) ? e.radiusY : Math.abs(y - e.y) } : e));
        break;
      case ACTIONS.STAR:
        setStars((prev) => prev.map((s) => s.id === currentShapeId.current ? { ...s, outerRadius: isNaN(Math.max(5, ((y - s.y) ** 2 + (x - s.x) ** 2) ** 0.5)) ? s.outerRadius : Math.max(5, ((y - s.y) ** 2 + (x - s.x) ** 2) ** 0.5), innerRadius: isNaN(Math.max(2.5, (((y - s.y) ** 2 + (x - s.x) ** 2) ** 0.5) / 2)) ? s.innerRadius : Math.max(2.5, (((y - s.y) ** 2 + (x - s.x) ** 2) ** 0.5) / 2) } : s));
        break;
      case ACTIONS.PARALLELOGRAM:
        setParallelograms((prev) => prev.map((p) => p.id === currentShapeId.current ? { ...p, x: Math.min(p.x, x), y: Math.min(p.y, y), width: Math.abs(x - p.x), height: Math.abs(y - p.y) } : p));
        break;
      case ACTIONS.CONNECTOR:
        setConnectors((prev) => prev.map((c) => c.id === currentShapeId.current ? { ...c, points: [c.points[0], c.points[1], isNaN(x) ? c.points[2] : x, isNaN(y) ? c.points[3] : y] } : c));
        break;
      case ACTIONS.SPEECH_BUBBLE:
        setSpeechBubbles((prev) => prev.map((b) => b.id === currentShapeId.current ? { ...b, width: isNaN(x - b.x) ? b.width : x - b.x, height: isNaN(y - b.y) ? b.height : y - b.y } : b));
        break;
      case ACTIONS.BEZIER:
        setBeziers((prev) => prev.map((b) => b.id === currentShapeId.current ? { ...b, points: [0, 0, isNaN(x - b.x) ? b.points[2] : x - b.x, isNaN(y - b.y) ? b.points[3] : y - b.y] } : b));
        break;
      case ACTIONS.SCRIBBLE:
        setScribbles((prev) =>
          prev.map((s) =>
            s.id === currentShapeId.current
              ? { ...s, points: isNaN(x) || isNaN(y) ? s.points : [...s.points, x, y] }
              : s,
          ),
        );
        break;
      case ACTIONS.ERASER: {
        const hit = stage.getIntersection({ x, y });
        if (hit && hit.id()) {
          const hitId = hit.id();
          pushHistory(getSnapshot());
          deleteShapeById(hitId);
        }
        break;
      }
    }
  }

  function onClick(e: any) {
    if (action !== ACTIONS.SELECT) return;
    const node = e.currentTarget;
    if (e.evt && e.evt.shiftKey) {
      // Multi-select toggle
      setSelectedShapeIds(prev => prev.includes(node.id()) ? prev.filter(id => id !== node.id()) : [...prev, node.id()]);
    } else {
      // Single select
      setSelectedShapeIds([node.id()]);
      setSelectedShapeType(node.getClassName());
    }
  }

  function onPointerUp() {
    isPaining.current = false;
    if (isSelectingRectangle) {
      const stage = stageRef.current;
      const x1 = Math.min(selectionStart.x, selectionEnd.x);
      const y1 = Math.min(selectionStart.y, selectionEnd.y);
      const x2 = Math.max(selectionStart.x, selectionEnd.x);
      const y2 = Math.max(selectionStart.y, selectionEnd.y);
      const width = x2 - x1;
      const height = y2 - y1;

      if (width > 2 && height > 2) {
        // Collect all shapes from all state arrays to search through them directly (100% reliable)
        const allShapes = [
          ...rectangles.map(s => ({ ...s, type: 'rectangle' })),
          ...circles.map(s => ({ ...s, type: 'circle' })),
          ...arrows.map(s => ({ ...s, type: 'arrow' })),
          ...scribbles.map(s => ({ ...s, type: 'scribble' })),
          ...textboxes.map(s => ({ ...s, type: 'text' })),
          ...triangles.map(s => ({ ...s, type: 'triangle' })),
          ...diamonds.map(s => ({ ...s, type: 'diamond' })),
          ...pentagons.map(s => ({ ...s, type: 'pentagon' })),
          ...hexagons.map(s => ({ ...s, type: 'hexagon' })),
          ...ellipses.map(s => ({ ...s, type: 'ellipse' })),
          ...stars.map(s => ({ ...s, type: 'star' })),
          ...parallelograms.map(s => ({ ...s, type: 'parallelogram' })),
          ...connectors.map(s => ({ ...s, type: 'connector' })),
          ...speechBubbles.map(s => ({ ...s, type: 'speech_bubble' })),
          ...beziers.map(s => ({ ...s, type: 'bezier' })),
        ];

        const x1 = Math.min(selectionStart.x, selectionEnd.x);
        const y1 = Math.min(selectionStart.y, selectionEnd.y);
        const x2 = Math.max(selectionStart.x, selectionEnd.x);
        const y2 = Math.max(selectionStart.y, selectionEnd.y);

        const selectedIds = allShapes.filter(s => {
          let sx1 = s.x || 0;
          let sy1 = s.y || 0;
          let sx2 = s.x || 0;
          let sy2 = s.y || 0;

          if (['rectangle', 'parallelogram', 'speech_bubble', 'text'].includes(s.type)) {
            sx2 = (s.x || 0) + (s.width || 0);
            sy2 = (s.y || 0) + (s.height || 0);
          } else if (s.type === 'circle') {
            const r = s.radius || 0;
            sx1 = s.x - r; sx2 = s.x + r; sy1 = s.y - r; sy2 = s.y + r;
          } else if (s.type === 'ellipse') {
            const rx = s.radiusX || 0;
            const ry = s.radiusY || rx;
            sx1 = s.x - rx; sx2 = s.x + rx; sy1 = s.y - ry; sy2 = s.y + ry;
          } else if (['triangle', 'diamond', 'pentagon', 'hexagon', 'star'].includes(s.type)) {
            const r = s.radius || s.outerRadius || 0;
            sx1 = s.x - r; sx2 = s.x + r; sy1 = s.y - r; sy2 = s.y + r;
          } else if (s.points) {
            sx1 = Infinity; sy1 = Infinity; sx2 = -Infinity; sy2 = -Infinity;
            for (let i = 0; i < s.points.length; i += 2) {
              const px = s.points[i] + (s.x || 0);
              const py = s.points[i + 1] + (s.y || 0);
              sx1 = Math.min(sx1, px); sx2 = Math.max(sx2, px);
              sy1 = Math.min(sy1, py); sy2 = Math.max(sy2, py);
            }
          }

          // Use a generous 5px buffer for high sensitivity
          const m = 5;
          return !(sx1 > x2 + m || sx2 < x1 - m || sy1 > y2 + m || sy2 < y1 - m);
        }).map(s => s.id);

        setSelectedShapeIds(selectedIds);
      }
      setIsSelectingRectangle(false);
    }
  }

  // Delete the currently selected shapes
  const handleDeleteSelected = () => {
    if (selectedShapeIds.length === 0) return;
    pushHistory(getSnapshot());
    selectedShapeIds.forEach(id => deleteShapeById(id));
    transformerRef.current?.nodes([]);
    setSelectedShapeIds([]);
    setSelectedShapeType(null);
  };

  const handleCopySelected = () => {
    if (selectedShapeIds.length === 0) return;
    const all = [
      ...rectangles.map(s => ({ ...s, type: 'rectangle' })),
      ...circles.map(s => ({ ...s, type: 'circle' })),
      ...arrows.map(s => ({ ...s, type: 'arrow' })),
      ...scribbles.map(s => ({ ...s, type: 'scribble' })),
      ...textboxes.map(s => ({ ...s, type: 'text' })),
      ...triangles.map(s => ({ ...s, type: 'triangle' })),
      ...diamonds.map(s => ({ ...s, type: 'diamond' })),
      ...pentagons.map(s => ({ ...s, type: 'pentagon' })),
      ...hexagons.map(s => ({ ...s, type: 'hexagon' })),
      ...ellipses.map(s => ({ ...s, type: 'ellipse' })),
      ...stars.map(s => ({ ...s, type: 'star' })),
      ...parallelograms.map(s => ({ ...s, type: 'parallelogram' })),
      ...connectors.map(s => ({ ...s, type: 'connector' })),
      ...speechBubbles.map(s => ({ ...s, type: 'speech_bubble' })),
      ...beziers.map(s => ({ ...s, type: 'bezier' })),
      ...images.map(s => ({ ...s, type: 'image' }))
    ];
    // Find only the FIRST selected shape as per user request
    const firstSelectedId = selectedShapeIds[0];
    const selected = all.find(s => s.id === firstSelectedId);
    if (selected) {
      internalClipboard.current = [JSON.parse(JSON.stringify(selected))];
    }
  };

  const handleInternalPaste = () => {
    if (internalClipboard.current.length === 0) return;
    pushHistory(getSnapshot());

    const newShapes = internalClipboard.current.map(s => ({
      ...s,
      id: uuidv4(),
      x: (s.x || 0) + 20,
      y: (s.y || 0) + 20,
    }));

    // Update individual state arrays
    newShapes.forEach(s => {
      switch (s.type) {
        case 'rectangle': setRectangles(prev => [...prev, s]); break;
        case 'circle': setCircles(prev => [...prev, s]); break;
        case 'arrow': setArrows(prev => [...prev, s]); break;
        case 'scribble': setScribbles(prev => [...prev, s]); break;
        case 'text': setTextboxes(prev => [...prev, s]); break;
        case 'triangle': setTriangles(prev => [...prev, s]); break;
        case 'diamond': setDiamonds(prev => [...prev, s]); break;
        case 'pentagon': setPentagons(prev => [...prev, s]); break;
        case 'hexagon': setHexagons(prev => [...prev, s]); break;
        case 'ellipse': setEllipses(prev => [...prev, s]); break;
        case 'star': setStars(prev => [...prev, s]); break;
        case 'parallelogram': setParallelograms(prev => [...prev, s]); break;
        case 'connector': setConnectors(prev => [...prev, s]); break;
        case 'speech_bubble': setSpeechBubbles(prev => [...prev, s]); break;
        case 'bezier': setBeziers(prev => [...prev, s]); break;
        case 'image': setImages(prev => [...prev, s]); break;
      }
    });

    // Select the newly pasted shapes
    const newIds = newShapes.map(s => s.id);
    setSelectedShapeIds(newIds);

    // Increment offset for next paste
    internalClipboard.current = newShapes;
  };

  // Keyboard shortcuts: Delete/Backspace to delete, Ctrl+Z/Y for undo/redo
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      // Undo: Ctrl+Z
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
        return;
      }
      // Tool shortcuts (no modifier key)
      if (!e.ctrlKey && !e.metaKey) {
        if (e.key === 'v' || e.key === 'V') { setAction(ACTIONS.SELECT); return; }
        if (e.key === 'h' || e.key === 'H') { setAction(ACTIONS.HAND); return; }
      }
      // Delete / Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedShapeIds.length > 0) {
        handleDeleteSelected();
      }

      // Copy: Ctrl+C
      if (e.ctrlKey && e.key === 'c' && selectedShapeIds.length > 0) {
        e.preventDefault();
        handleCopySelected();
      }
      // Paste: Ctrl+V (internal)
      if (e.ctrlKey && e.key === 'v' && internalClipboard.current.length > 0) {
        // Only trigger internal paste if we have copied shapes.
        // System clipboard image paste is handled by window.onpaste event separately.
        // BUT if there is an image in clipboard, browser fires 'paste'.
        // If we also handle Ctrl+V here, we might double-paste if we are not careful.
        // However, browser 'paste' event doesn't contain our internal shapes.
        handleInternalPaste();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShapeIds, historyIndex.current]);

  // Helper: sync dragged x/y back into state
  const makeDragEnd = (
    setter: React.Dispatch<React.SetStateAction<any[]>>
  ) => (id: string) => (e: any) => {
    const node = e.target;
    setter((prev) =>
      prev.map((s) => s.id === id ? {
        ...s,
        x: isNaN(node.x()) ? s.x : node.x(),
        y: isNaN(node.y()) ? s.y : node.y()
      } : s)
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

  const onTransformEnd = (e: any) => {
    const target = e.target;
    if (!target) return;

    // In Konva, if multiple nodes are selected, e.target is the Transformer
    const nodes = target.nodes ? target.nodes() : [target];
    if (!nodes || nodes.length === 0) return;

    pushHistory(getSnapshot());

    // Map all transformations
    const transformMap = new Map();
    nodes.forEach((node: any) => {
      const id = node.id();
      if (id && id !== "selection-rectangle" && id !== "background") {
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        transformMap.set(id, {
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          scaleX: scaleX,
          scaleY: scaleY,
          nodeWidth: node.width(),
          nodeHeight: node.height()
        });

        // CRITICAL: Reset scale to 1 to prevent accumulation and Konva errors
        node.scaleX(1);
        node.scaleY(1);
      }
    });

    if (transformMap.size === 0) return;

    const updateAll = (prev: any[]) => prev.map((s) => {
      const transform = transformMap.get(s.id);
      if (!transform) return s;

      const { x, y, rotation, scaleX, scaleY, nodeWidth, nodeHeight } = transform;

      // Update position and rotation
      const updated = {
        ...s,
        x: isNaN(x) ? s.x : x,
        y: isNaN(y) ? s.y : y,
        rotation: isNaN(rotation) ? s.rotation : rotation,
      };

      // Sanitize position - prevent shapes from flying to infinity
      updated.x = Math.max(-10000, Math.min(10000, updated.x));
      updated.y = Math.max(-10000, Math.min(10000, updated.y));

      // Scale dimensional properties safely - use absolute scale for geometry
      const absScaleX = Math.abs(isNaN(scaleX) ? 1 : (Math.abs(scaleX) > 100 ? (scaleX > 0 ? 100 : -100) : scaleX));
      const absScaleY = Math.abs(isNaN(scaleY) ? 1 : (Math.abs(scaleY) > 100 ? (scaleY > 0 ? 100 : -100) : scaleY));

      // For symmetric/circular shapes, we want uniform scaling
      const isSymmetric = s.radius !== undefined || s.radiusX !== undefined || s.outerRadius !== undefined;
      const uniformScale = isSymmetric ? Math.max(absScaleX, absScaleY) : 1;

      // Update geometry based on shape type
      if (s.width !== undefined) {
        updated.width = Math.max(5, (s.width || nodeWidth) * absScaleX);
      }
      if (s.height !== undefined) {
        updated.height = Math.max(5, (s.height || nodeHeight) * absScaleY);
      }

      if (s.radius !== undefined) {
        updated.radius = Math.max(5, (s.radius || 5) * uniformScale);
      }

      if (s.radiusX !== undefined) {
        updated.radiusX = Math.max(5, (s.radiusX || 5) * absScaleX);
      }
      if (s.radiusY !== undefined) {
        updated.radiusY = Math.max(5, (s.radiusY || 5) * absScaleY);
      }

      if (s.innerRadius !== undefined) {
        updated.innerRadius = Math.max(2, (s.innerRadius || 2.5) * uniformScale);
      }
      if (s.outerRadius !== undefined) {
        updated.outerRadius = Math.max(5, (s.outerRadius || 5) * uniformScale);
      }

      if (s.points && !s.radius && !s.radiusX && !s.outerRadius) {
        updated.points = s.points.map((p: number, i: number) => {
          const scaled = i % 2 === 0 ? p * absScaleX : p * absScaleY;
          return Math.max(-10000, Math.min(10000, scaled));
        });
      }

      return updated;
    });

    setRectangles(updateAll);
    setCircles(updateAll);
    setArrows(updateAll);
    setTriangles(updateAll);
    setDiamonds(updateAll);
    setPentagons(updateAll);
    setHexagons(updateAll);
    setEllipses(updateAll);
    setStars(updateAll);
    setParallelograms(updateAll);
    setConnectors(updateAll);
    setSpeechBubbles(updateAll);
    setBeziers(updateAll);
    setImages(updateAll);
    setScribbles(updateAll);
    setTextboxes(updateAll);
  };

  // Keep Transformer synced with selectedShapeIds across re-renders
  // Use a more stable sync mechanism
  useEffect(() => {
    const stage = stageRef.current;
    const transformer = transformerRef.current;
    if (!stage || !transformer) return;

    if (selectedShapeIds.length > 0) {
      const nodes = selectedShapeIds
        .map(id => stage.findOne('#' + id))
        .filter(Boolean) as any[];

      if (nodes.length > 0) {
        transformer.nodes(nodes);
        transformer.getLayer().batchDraw();
      } else {
        transformer.nodes([]);
      }
    } else {
      transformer.nodes([]);
    }
  }, [selectedShapeIds, rectangles, circles, arrows, scribbles, textboxes, triangles, diamonds, pentagons, hexagons, ellipses, beziers, connectors, speechBubbles, stars, parallelograms, images]);

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
    // 1. Collect ALL elements into a single array with types, normalizing properties
    const allElementsList = [
      ...rectangles.map(s => ({ ...s, type: 'rectangle' })),
      ...circles.map(s => ({ ...s, type: 'circle' })),
      ...arrows.map(s => ({ ...s, type: 'arrow' })),
      ...scribbles.map(s => ({ ...s, type: 'scribble', stroke: s.strokeColor || penColor })),
      ...textboxes.map(s => ({ ...s, type: 'text', stroke: s.fillColor || penColor })),
      ...triangles.map(s => ({ ...s, type: 'triangle' })),
      ...diamonds.map(s => ({ ...s, type: 'diamond' })),
      ...pentagons.map(s => ({ ...s, type: 'pentagon' })),
      ...hexagons.map(s => ({ ...s, type: 'hexagon' })),
      ...ellipses.map(s => ({ ...s, type: 'ellipse' })),
      ...stars.map(s => ({ ...s, type: 'star' })),
      ...parallelograms.map(s => ({ ...s, type: 'parallelogram' })),
      ...connectors.map(s => ({ ...s, type: 'connector', stroke: s.stroke || strokeColor })),
      ...speechBubbles.map(s => ({ ...s, type: 'speech_bubble', stroke: s.stroke || strokeColor })),
      ...beziers.map(s => ({ ...s, type: 'bezier', stroke: s.stroke || strokeColor })),
      ...images.map(s => ({ ...s, type: 'image' })),
    ];

    // 2. Determine which elements to analyze
    let elementsToAnalyze = allElementsList;
    if (selectedShapeIds.length > 0) {
      elementsToAnalyze = allElementsList.filter(el => selectedShapeIds.includes(el.id));
    }

    if (elementsToAnalyze.length === 0) {
      alert("Please draw something or select shapes to analyze.");
      return;
    }

    setIsAnalyzing(true);
    setIsModalOpen(true);
    setAnalysisData(null);

    try {
      // 0. Get or create a session
      let currentSessionId = activeSessionId || localStorage.getItem('current_session_id');
      if (!currentSessionId) {
        const sessionRes = await axios.post(`${import.meta.env.VITE_API_URL}/sessions/create`, {
          title: `Session ${new Date().toLocaleDateString()}`
        }, {
          headers: { Authorization: `Bearer ${await auth.currentUser?.getIdToken()}` }
        });
        currentSessionId = sessionRes.data.session_id;
        localStorage.setItem('current_session_id', currentSessionId!);
      }

      // --- SELECTION BASED CROPPING ---
      // Compute bounding box
      const box = getBoundingBox(elementsToAnalyze);

      // Render these specific elements to an offscreen canvas
      const dataUrl = await renderToOffscreenCanvas(elementsToAnalyze, box);

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "diagram.png", { type: "image/png" });

      const formData = new FormData();
      formData.append("image", file);

      // Send session and stroke data
      formData.append("sessionId", currentSessionId!);

      // We still send ALL strokes if nothing is selected, or only selected ones?
      // Usually, it's better to send only the selected ones for context.
      formData.append("strokeData", JSON.stringify({
        rectangles: elementsToAnalyze.filter(e => e.type === 'rectangle'),
        circles: elementsToAnalyze.filter(e => e.type === 'circle'),
        arrows: elementsToAnalyze.filter(e => e.type === 'arrow'),
        scribbles: elementsToAnalyze.filter(e => e.type === 'scribble'),
        textboxes: elementsToAnalyze.filter(e => e.type === 'text'),
        triangles: elementsToAnalyze.filter(e => e.type === 'triangle'),
        diamonds: elementsToAnalyze.filter(e => e.type === 'diamond'),
        pentagons: elementsToAnalyze.filter(e => e.type === 'pentagon'),
        hexagons: elementsToAnalyze.filter(e => e.type === 'hexagon'),
        ellipses: elementsToAnalyze.filter(e => e.type === 'ellipse'),
        beziers: elementsToAnalyze.filter(e => e.type === 'bezier'),
        connectors: elementsToAnalyze.filter(e => e.type === 'connector'),
        speechBubbles: elementsToAnalyze.filter(e => e.type === 'speech_bubble'),
        stars: elementsToAnalyze.filter(e => e.type === 'star'),
        parallelograms: elementsToAnalyze.filter(e => e.type === 'parallelogram')
      }));

      const token = await auth.currentUser?.getIdToken();

      // 1. Analyze Diagram (gets both mermaid code and explanation)
      const analyzeRes = await axios.post(`${import.meta.env.VITE_API_URL}/analyze-diagram`, formData, {
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
      // Refresh recent diagrams list
      onAnalysisSuccess?.();
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Failed to analyze diagram. Please try again.");
      setIsModalOpen(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleInsertImageFromModal = (src: string) => {
    if (!src) return;

    const img = new window.Image();
    img.src = src;
    img.onload = () => {
      const id = uuidv4();
      pushHistory(getSnapshot());

      const stage = stageRef.current;
      const container = containerRef.current;

      let pasteX = 150;
      let pasteY = 150;

      if (stage && container) {
        const transform = stage.getAbsoluteTransform().copy().invert();
        const center = transform.point({
          x: container.offsetWidth / 2,
          y: container.offsetHeight / 2
        });

        // Use a reasonable size for the inserted diagram
        const targetWidth = Math.min(600, img.width);
        const targetHeight = targetWidth * (img.height / img.width);

        pasteX = center.x - targetWidth / 2;
        pasteY = center.y - targetHeight / 2;

        setImages((prev) => [
          ...prev,
          {
            id,
            x: pasteX,
            y: pasteY,
            src,
            width: targetWidth,
            height: targetHeight,
          },
        ]);

        // Select the newly inserted diagram
        setSelectedShapeIds([id]);
        setSelectedShapeType('Image');
      } else {
        console.error("Stage or container not found during diagram insertion");
      }
    };
    img.onerror = () => {
      console.error("Failed to load image for insertion");
      alert("Failed to insert diagram to canvas.");
    };
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
    <div className="relative w-full h-full font-['Inter'] bg-white dark:bg-[#121212] transition-colors overflow-hidden flex flex-col">

      <div className="flex-1 relative flex overflow-hidden">
        {/* PAGES SIDEBAR (Conditional) */}
        {appMode === 'pages' && (
          <PagesSidebar
            pages={pages}
            currentPageId={currentPageId}
            onSelectPage={handleSwitchPage}
            onAddPage={handleAddPage}
            onDeletePage={handleDeletePage}
            onDuplicatePage={handleDuplicatePage}
            onRenamePage={handleRenamePage}
          />
        )}

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 relative overflow-hidden">
          {/* FLOATING TOOLBAR (Simplified or optional) */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center justify-center gap-2 pointer-events-auto w-fit max-w-[95vw] md:max-w-[90%] lg:max-w-none px-4">
            <div className="flex items-center gap-0.5 sm:gap-1 p-1 bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-md border border-gray-200/70 dark:border-white/8 shadow-[0_4px_20px_rgba(0,0,0,0.10)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] rounded-2xl transition-colors">
              {/* SELECT */}
              <Tooltip text="Select & move shapes (V)">
                <button
                  className={`p-2 rounded-lg transition-colors ${action === ACTIONS.SELECT ? "bg-white dark:bg-white/10 text-gray-800 dark:text-white shadow-sm border border-gray-200 dark:border-white/10" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-gray-200"}`}
                  onClick={() => setAction(ACTIONS.SELECT)}
                  aria-label="Select"
                >
                  <GiArrowCursor size="1.2rem" />
                </button>
              </Tooltip>
              {/* HAND */}
              <Tooltip text="Hand — pan & zoom (H)">
                <button
                  className={`p-2 rounded-lg transition-colors ${action === ACTIONS.HAND ? "bg-white dark:bg-white/10 text-gray-800 dark:text-white shadow-sm border border-gray-200 dark:border-white/10" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-gray-200"}`}
                  onClick={() => setAction(ACTIONS.HAND)}
                  aria-label="Hand"
                >
                  <LuHand size="1.2rem" />
                </button>
              </Tooltip>
              <div className="w-px h-4 bg-gray-200 dark:bg-[#333] mx-1" />
              <Tooltip text="Draw freehand (P) or (Ctrl+P)">
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

              {/* MODERN COLOR PICKERS */}
              <div className="flex items-center gap-1.5 px-1.5">
                {/* Shape Fill Color */}
                <div className="relative">
                  <Tooltip text="Shape Fill Color">
                    <button
                      onClick={() => { setFillMenuOpen(!fillMenuOpen); setPenMenuOpen(false); setShapesMenuOpen(false); }}
                      className="w-7 h-7 rounded-full border border-gray-200 dark:border-white/10 shadow-sm transition-transform hover:scale-110 flex items-center justify-center overflow-hidden"
                      style={{ background: fillColor === 'transparent' ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'4\' height=\'4\' viewBox=\'0 0 4 4\'%3E%3Cpath fill=\'%23ccc\' fill-opacity=\'0.5\' d=\'M1 3h1v1H1V3zm2-2h1v1H3V1z\'/%3E%3C/svg%3E")' : fillColor }}
                    >
                      {fillColor === 'transparent' && <div className="w-full h-px bg-red-400 rotate-45" />}
                    </button>
                  </Tooltip>
                  {fillMenuOpen && (
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#333] rounded-xl shadow-xl p-3 z-50 w-44">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Fill Color</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {['transparent', '#ef444433', '#22c55e33', '#3b82f633', '#eab30833', '#a855f733', '#000000', '#ffffff'].map(c => (
                          <button
                            key={c}
                            onClick={() => { setFillColor(c); setFillMenuOpen(false); }}
                            className={`w-6 h-6 rounded-full border border-gray-100 dark:border-gray-800 transition-transform hover:scale-125 ${fillColor === c ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                            style={{ background: c === 'transparent' ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'4\' height=\'4\' viewBox=\'0 0 4 4\'%3E%3Cpath fill=\'%23ccc\' fill-opacity=\'0.5\' d=\'M1 3h1v1H1V3zm2-2h1v1H3V1z\'/%3E%3C/svg%3E")' : c }}
                          />
                        ))}
                        <div className="relative w-6 h-6 rounded-full border border-gray-100 dark:border-gray-800 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-white/5">
                          <input type="color" value={fillColor === 'transparent' ? '#ffffff' : fillColor} onChange={(e) => setFillColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                          <span className="text-[10px] pointer-events-none">+</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pen / Stroke Color */}
                <div className="relative">
                  <Tooltip text="Pen / Stroke Color">
                    <button
                      onClick={() => { setPenMenuOpen(!penMenuOpen); setFillMenuOpen(false); setShapesMenuOpen(false); }}
                      className="w-7 h-7 rounded-full border-2 border-white dark:border-[#1a1a1a] shadow-sm transition-transform hover:scale-110 flex items-center justify-center overflow-hidden"
                      style={{ background: penColor }}
                    >
                      <LuPencil size="0.7rem" className={penColor === '#ffffff' || penColor === 'white' ? 'text-black' : 'text-white'} />
                    </button>
                  </Tooltip>
                  {penMenuOpen && (
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#333] rounded-xl shadow-xl p-3 z-50 w-44">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Pen Color</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {['#000000', '#ffffff', '#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7', '#6366f1'].map(c => (
                          <button
                            key={c}
                            onClick={() => { setPenColor(c); setPenMenuOpen(false); }}
                            className={`w-6 h-6 rounded-full border border-gray-100 dark:border-gray-800 transition-transform hover:scale-125 ${penColor === c ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                            style={{ background: c }}
                          />
                        ))}
                        <div className="relative w-6 h-6 rounded-full border border-gray-100 dark:border-gray-800 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-white/5">
                          <input type="color" value={penColor} onChange={(e) => setPenColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                          <span className="text-[10px] pointer-events-none">+</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-px h-4 bg-gray-200 dark:bg-[#333] mx-1" />

              <Tooltip text="Undo (Ctrl+Z)">
                <button
                  className={`p-2 rounded-lg transition-colors ${!canUndo ? 'opacity-30 cursor-not-allowed text-gray-400 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-gray-200'}`}
                  onClick={handleUndo}
                  disabled={!canUndo}
                  aria-label="Undo"
                >
                  <LuUndo2 size="1.2rem" />
                </button>
              </Tooltip>
              <Tooltip text="Redo (Ctrl+Y)">
                <button
                  className={`p-2 rounded-lg transition-colors ${!canRedo ? 'opacity-30 cursor-not-allowed text-gray-400 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-gray-200'}`}
                  onClick={handleRedo}
                  disabled={!canRedo}
                  aria-label="Redo"
                >
                  <LuRedo2 size="1.2rem" />
                </button>
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
              {selectedShapeIds.length > 0 && (
                <Tooltip text="Delete selected shape">
                  <button
                    className="p-2 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 border border-red-100 dark:border-red-500/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                    onClick={handleDeleteSelected}
                    aria-label="Delete selected shapes"
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
              className="px-2 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold disabled:opacity-40 transition-all shadow-[0_2px_10px_rgba(37,99,235,0.3)] flex items-center gap-1 sm:gap-2 whitespace-nowrap border border-blue-500/20"
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
            {/* Canvas mode toggle */}
            <div className="flex items-center gap-0.5 sm:gap-1 p-1 bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-md border border-gray-200/70 dark:border-white/8 shadow-[0_4px_20px_rgba(0,0,0,0.10)] dark:shadow-[0_4_20px_rgba(0,0,0,0.4)] rounded-2xl">
              <Tooltip text={!isEmpty ? 'Clear canvas to switch mode' : 'A4 Page Mode (structured)'}>
                <button
                  onClick={() => { if (isEmpty) { setCanvasMode('a4'); setStagePos({ x: 0, y: 0 }); setStageScale(1); } }}
                  disabled={!isEmpty && canvasMode !== 'a4'}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${canvasMode === 'a4'
                    ? 'bg-blue-600 text-white shadow-sm border border-blue-500/20'
                    : !isEmpty
                      ? 'opacity-40 cursor-not-allowed text-gray-400 dark:text-gray-600'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-white/5'
                    }`}
                  aria-label="A4 Page Mode"
                >
                  <LuFile size="0.9rem" />
                  Pages
                  {!isEmpty && canvasMode !== 'a4' && <span className="ml-0.5 text-gray-400">🔒</span>}
                </button>
              </Tooltip>
              <Tooltip text={!isEmpty ? 'Clear canvas to switch mode' : 'Infinite Canvas Mode (free drawing)'}>
                <button
                  onClick={() => { if (isEmpty) { setCanvasMode('infinite'); setStagePos({ x: 0, y: 0 }); setStageScale(1); } }}
                  disabled={!isEmpty && canvasMode !== 'infinite'}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${canvasMode === 'infinite'
                    ? 'bg-blue-600 text-white shadow-sm border border-blue-500/20'
                    : !isEmpty
                      ? 'opacity-40 cursor-not-allowed text-gray-400 dark:text-gray-600'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-white/5'
                    }`}
                  aria-label="Infinite Canvas Mode"
                >
                  <LuInfinity size="0.9rem" />
                  Infinite
                  {!isEmpty && canvasMode !== 'infinite' && <span className="ml-0.5 text-gray-400">🔒</span>}
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Floating Property Window — Left Side */}
          {selectedShapeIds.length > 0 && (
            <div className="absolute left-4 sm:left-[280px] top-1/2 -translate-y-1/2 z-50 animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="p-4 bg-white/90 dark:bg-[#1e1e1e]/90 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-[#333] shadow-2xl flex flex-col gap-4 w-52">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Properties {selectedShapeIds.length > 1 && `(${selectedShapeIds.length})`}</h3>

                {/* Outline Color */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-gray-500">Outline Color</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['#000000', '#ffffff', '#ef4444', '#22c55e', '#3b82f6', '#eab308'].map(c => (
                      <button
                        key={c}
                        onClick={() => updateSelectedShape({ stroke: c })}
                        className={`w-5 h-5 rounded-full border border-gray-200 dark:border-gray-700 transition-transform hover:scale-125 ${getSelectedShape()?.stroke === c ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                        style={{ background: c }}
                      />
                    ))}
                    <input type="color" className="w-5 h-5 p-0 border-0 bg-transparent cursor-pointer" onChange={(e) => updateSelectedShape({ stroke: e.target.value })} />
                  </div>
                </div>

                {/* Fill Color */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-gray-500">Fill Color</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['transparent', '#ef444433', '#22c55e33', '#3b82f633', '#eab30833', '#a855f733'].map(c => (
                      <button
                        key={c}
                        onClick={() => updateSelectedShape({ fillColor: c })}
                        className={`w-5 h-5 rounded-full border border-gray-200 dark:border-gray-700 transition-transform hover:scale-125 ${getSelectedShape()?.fillColor === c ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                        style={{ background: c === 'transparent' ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'4\' height=\'4\' viewBox=\'0 0 4 4\'%3E%3Cpath fill=\'%23ccc\' fill-opacity=\'0.5\' d=\'M1 3h1v1H1V3zm2-2h1v1H3V1z\'/%3E%3C/svg%3E")' : c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Stroke Width */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-semibold text-gray-500">Stroke Width</label>
                    <span className="text-[10px] bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300">{getSelectedShape()?.strokeWidth || 2}px</span>
                  </div>
                  <input
                    type="range" min="1" max="10" step="1"
                    value={getSelectedShape()?.strokeWidth || 2}
                    onChange={(e) => updateSelectedShape({ strokeWidth: parseInt(e.target.value) })}
                    className="w-full accent-blue-500 h-1.5 bg-gray-200 dark:bg-[#333] rounded-lg appearance-none cursor-pointer"
                  />
                </div>


                <button
                  onClick={handleDeleteSelected}
                  className="mt-2 flex items-center justify-center gap-2 py-2 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                >
                  <MdDeleteOutline size={16} />
                  Delete Shape
                </button>
              </div>
            </div>
          )}

          {/* CANVAS — fills full area. A4 mode: tall scrollable stage with centred page cards */}
          <div
            ref={containerRef}
            className={`absolute inset-0 transition-colors`}
            style={{
              background: canvasMode === 'a4' ? 'var(--canvas-bg-outer)' : undefined,
              cursor: action === ACTIONS.HAND && canvasMode === 'infinite' ? 'grab'
                : action === ACTIONS.ERASER ? 'crosshair'
                  : 'default'
            }}
          >
            {/* Single Stage that always fills the full width */}
            <Stage
              ref={stageRef}
              width={size.width}
              height={size.height}
              x={stagePos.x}
              y={stagePos.y}
              scaleX={stageScale}
              scaleY={stageScale}
              draggable={action === ACTIONS.HAND}
              onDragMove={(e) => {
                if (e.target === e.currentTarget) {
                  const nx = e.target.x();
                  const ny = e.target.y();
                  setStagePos({
                    x: isNaN(nx) ? stagePos.x : nx,
                    y: isNaN(ny) ? stagePos.y : ny
                  });
                }
              }}
              onDragEnd={(e) => {
                if (e.target === e.currentTarget) {
                  const nx = e.target.x();
                  const ny = e.target.y();
                  setStagePos({
                    x: isNaN(nx) ? stagePos.x : nx,
                    y: isNaN(ny) ? stagePos.y : ny
                  });
                }
              }}
              onWheel={handleWheel}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            >
              <Layer>
                {/* Background Rect for A4 mode (fills whole stage) */}
                {canvasMode === 'a4' && (
                  <Rect
                    x={-50000}
                    y={-50000}
                    width={100000}
                    height={100000}
                    id="background"
                    fill={getCssVar('--canvas-bg-outer', '#e5e7eb')}
                    onClick={() => {
                      transformerRef.current?.nodes([]);
                      setSelectedShapeIds([]);
                      setSelectedShapeType(null);
                    }}
                  />
                )}

                <Group x={pageOffsetX}>
                  {/* Background — different per mode */}
                  {canvasMode === 'a4' ? (
                    <>
                      {/* White page cards — centered via Group */}
                      {Array.from({ length: numPages }, (_, i) => (
                        <Rect
                          key={`page-${i}`}
                          id={`page-${i}`}
                          x={0} // Centered in group
                          y={PAGE_PADDING + i * (A4_HEIGHT + PAGE_GAP)}
                          width={A4_WIDTH}
                          height={A4_HEIGHT}
                          fill="#ffffff"
                          fillPatternImage={gridPattern as any}
                          fillPatternRepeat="repeat"
                          fillPatternOffset={{ x: 0, y: 0 }}
                          shadowColor="rgba(0,0,0,0.12)"
                          shadowBlur={10}
                          shadowOffsetY={2}
                          onClick={() => {
                            transformerRef.current?.nodes([]);
                            setSelectedShapeIds([]);
                            setSelectedShapeType(null);
                          }}
                        />
                      ))}
                    </>
                  ) : (
                    /* Infinite canvas: large tiled grid background */
                    <Rect
                      x={-50000}
                      y={-50000}
                      width={100000}
                      height={100000}
                      id="background"
                      fill={getCssVar('--canvas-bg', '#ffffff')}
                      fillPatternImage={gridPattern as any}
                      fillPatternRepeat="repeat"
                      onClick={() => {
                        transformerRef.current?.nodes([]);
                        setSelectedShapeIds([]);
                        setSelectedShapeType(null);
                      }}
                    />
                  )}

                  {rectangles.map((rect) => (
                    <SloppyShape
                      key={rect.id}
                      type="rectangle"
                      {...rect}
                      isSelected={selectedShapeIds.includes(rect.id)}
                      draggable={isDraggable}
                      onClick={onClick}
                      onDragEnd={syncRect(rect.id)}
                    />
                  ))}
                  {circles.map((circle) => (
                    <SloppyShape
                      key={circle.id}
                      type="circle"
                      {...circle}
                      isSelected={selectedShapeIds.includes(circle.id)}
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
                      stroke={selectedShapeIds.includes(arrow.id) ? '#3b82f6' : (arrow.stroke || strokeColor)}
                      strokeWidth={selectedShapeIds.includes(arrow.id) ? (arrow.strokeWidth || 2) + 0.5 : (arrow.strokeWidth || 2)}
                      fill={arrow.fillColor || 'transparent'}
                      name="selectable-shape"
                      draggable={isDraggable}
                      onClick={onClick}
                      onDragEnd={syncArrow(arrow.id)}
                      dragBoundFunc={function (pos) {
                        if (isNaN(pos.x) || isNaN(pos.y)) return this.absolutePosition();
                        return pos;
                      }}
                    />
                  ))}
                  {triangles.map((t) => (
                    <SloppyShape key={t.id} type="triangle" {...t} isSelected={selectedShapeIds.includes(t.id)} draggable={isDraggable} onClick={onClick} onDragEnd={syncTriangle(t.id)} />
                  ))}
                  {diamonds.map((d) => (
                    <SloppyShape key={d.id} type="diamond" {...d} isSelected={selectedShapeIds.includes(d.id)} draggable={isDraggable} onClick={onClick} onDragEnd={syncDiamond(d.id)} />
                  ))}
                  {pentagons.map((p) => (
                    <SloppyShape key={p.id} type="pentagon" {...p} isSelected={selectedShapeIds.includes(p.id)} draggable={isDraggable} onClick={onClick} onDragEnd={syncPentagon(p.id)} />
                  ))}
                  {hexagons.map((h) => (
                    <SloppyShape key={h.id} type="hexagon" {...h} isSelected={selectedShapeIds.includes(h.id)} draggable={isDraggable} onClick={onClick} onDragEnd={syncHexagon(h.id)} />
                  ))}
                  {ellipses.map((e) => (
                    <SloppyShape key={e.id} type="ellipse" {...e} isSelected={selectedShapeIds.includes(e.id)} draggable={isDraggable} onClick={onClick} onDragEnd={syncEllipse(e.id)} />
                  ))}
                  {stars.map((s) => (
                    <SloppyShape key={s.id} type="star" {...s} isSelected={selectedShapeIds.includes(s.id)} draggable={isDraggable} onClick={onClick} onDragEnd={syncStar(s.id)} />
                  ))}
                  {parallelograms.map((p) => (
                    <SloppyShape key={p.id} type="parallelogram" {...p} isSelected={selectedShapeIds.includes(p.id)} draggable={isDraggable} onClick={onClick} onDragEnd={syncParallel(p.id)} />
                  ))}
                  {connectors.map((c) => (
                    <Path key={c.id} id={c.id} name="selectable-shape" data={`M ${c.points[0]} ${c.points[1]} L ${c.points[0]} ${c.points[3]} L ${c.points[2]} ${c.points[3]}`} stroke={selectedShapeIds.includes(c.id) ? '#3b82f6' : strokeColor} strokeWidth={selectedShapeIds.includes(c.id) ? 2.5 : 2} fill="transparent" draggable={isDraggable} onClick={onClick} onDragEnd={syncConnector(c.id)} dragBoundFunc={function (pos) { if (isNaN(pos.x) || isNaN(pos.y)) return this.absolutePosition(); return pos; }} />
                  ))}
                  {speechBubbles.map((b) => (
                    <Path key={b.id} id={b.id} x={b.x} y={b.y} name="selectable-shape" data={`M 0 0 L ${b.width} 0 L ${b.width} ${b.height * 0.8} L ${b.width * 0.6} ${b.height * 0.8} L ${b.width * 0.5} ${b.height} L ${b.width * 0.4} ${b.height * 0.8} L 0 ${b.height * 0.8} Z`} fill={b.fillColor} stroke={selectedShapeIds.includes(b.id) ? '#3b82f6' : strokeColor} strokeWidth={selectedShapeIds.includes(b.id) ? 2.5 : 2} draggable={isDraggable} onClick={onClick} onDragEnd={syncSpeech(b.id)} dragBoundFunc={function (pos) { if (isNaN(pos.x) || isNaN(pos.y)) return this.absolutePosition(); return pos; }} />
                  ))}
                  {beziers.map((b) => (
                    <Path key={b.id} id={b.id} x={b.x} y={b.y} name="selectable-shape" data={`M 0 0 Q ${b.points[2] / 2 + 50} ${b.points[3] / 2 - 50} ${b.points[2]} ${b.points[3]}`} stroke={selectedShapeIds.includes(b.id) ? '#3b82f6' : strokeColor} strokeWidth={selectedShapeIds.includes(b.id) ? 2.5 : 2} fill="transparent" draggable={isDraggable} onClick={onClick} onDragEnd={syncBezier(b.id)} dragBoundFunc={function (pos) { if (isNaN(pos.x) || isNaN(pos.y)) return this.absolutePosition(); return pos; }} />
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
                      name="selectable-shape"
                      draggable={isDraggable}
                      onClick={onClick}
                      onDragEnd={syncScribble(s.id)}
                      dragBoundFunc={function (pos) {
                        if (isNaN(pos.x) || isNaN(pos.y)) return this.absolutePosition();
                        return pos;
                      }}
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
                      name="selectable-shape"
                      draggable={isDraggable}
                      onClick={onClick}
                      onDragEnd={syncTextbox(text.id)}
                      dragBoundFunc={function (pos) {
                        if (isNaN(pos.x) || isNaN(pos.y)) return this.absolutePosition();
                        return pos;
                      }}
                      onDblClick={(e) => {
                        const stageBox = stageRef.current
                          .container()
                          .getBoundingClientRect();
                        const node = e.target;
                        const absPos = node.getAbsolutePosition();
                        setEditingId(text.id);
                        setEditingText(text.text);
                        setTextareaPos({
                          x: stageBox.left + absPos.x,
                          y: stageBox.top + absPos.y,
                          width: node.width() * stageScale,
                        });
                      }}
                    />
                  ))}
                  {images.map((img) => (
                    <ImageItem
                      key={img.id}
                      s={img}
                      isSelected={selectedShapeIds.includes(img.id)}
                      draggable={isDraggable}
                      onClick={onClick}
                      onDragEnd={(e: any) => {
                        const node = e.target;
                        setImages((prev) =>
                          prev.map((s) => s.id === img.id ? {
                            ...s,
                            x: isNaN(node.x()) ? s.x : node.x(),
                            y: isNaN(node.y()) ? s.y : node.y()
                          } : s)
                        );
                      }}
                    />
                  ))}
                  <Transformer
                    ref={transformerRef}
                    onTransformEnd={onTransformEnd}
                    centeredScaling={['Circle', 'Star', 'RegularPolygon', 'Ellipse'].includes(selectedShapeType || '')}
                    keepRatio={['Circle', 'Star', 'RegularPolygon'].includes(selectedShapeType || '')}
                    onTransform={(e) => {
                      // Sanitize NaN coordinates and scales during active transform
                      const transformer = e.target as any;
                      const nodes = transformer.nodes();
                      nodes.forEach((node: any) => {
                        const nx = node.x();
                        const ny = node.y();
                        const sx = node.scaleX();
                        const sy = node.scaleY();
                        if (isNaN(nx)) node.x(0);
                        if (isNaN(ny)) node.y(0);
                        if (isNaN(sx)) node.scaleX(1);
                        if (isNaN(sy)) node.scaleY(1);
                      });
                    }}
                    boundBoxFunc={(oldBox, newBox) => {
                      // Limit resize and prevent NaN
                      const minSize = 5;
                      const maxSize = 4000;
                      if (
                        isNaN(newBox.x) ||
                        isNaN(newBox.y) ||
                        isNaN(newBox.width) ||
                        isNaN(newBox.height) ||
                        isNaN(newBox.rotation) ||
                        Math.abs(newBox.width) < minSize ||
                        Math.abs(newBox.height) < minSize ||
                        Math.abs(newBox.width) > maxSize ||
                        Math.abs(newBox.height) > maxSize
                      ) {
                        return oldBox;
                      }
                      return newBox;
                    }}
                  />
                  {isSelectingRectangle && (
                    <Rect
                      id="selection-rectangle"
                      listening={false}
                      x={Math.min(selectionStart.x, selectionEnd.x)}
                      y={Math.min(selectionStart.y, selectionEnd.y)}
                      width={Math.abs(selectionEnd.x - selectionStart.x)}
                      height={Math.abs(selectionEnd.y - selectionStart.y)}
                      fill="rgba(59, 130, 246, 0.1)"
                      stroke="#3b82f6"
                      strokeWidth={1}
                      dash={[5, 5]}
                    />
                  )}
                </Group>
              </Layer>
            </Stage>

            {/* EMPTY STATE — only in infinite mode as full overlay */}
            {isEmpty && canvasMode === 'infinite' && (
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
            onInsertImage={handleInsertImageFromModal}
          />


        </div>
      </div>
    </div>
  );
});

export default DrawingCanvas;
