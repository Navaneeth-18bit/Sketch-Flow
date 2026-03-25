

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export const getBoundingBox = (elements: any[]): BoundingBox => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const updateBounds = (x: number, y: number, w: number = 0, h: number = 0) => {
    const x1 = Math.min(x, x + w);
    const x2 = Math.max(x, x + w);
    const y1 = Math.min(y, y + h);
    const y2 = Math.max(y, y + h);
    minX = Math.min(minX, x1);
    minY = Math.min(minY, y1);
    maxX = Math.max(maxX, x2);
    maxY = Math.max(maxY, y2);
  };

  elements.forEach((el) => {
    const x = el.x || 0;
    const y = el.y || 0;
    switch (el.type) {
      case 'rectangle':
      case 'parallelogram':
      case 'speech_bubble':
        updateBounds(x, y, el.width, el.height);
        break;
      case 'circle':
        updateBounds(x - el.radius, y - el.radius, el.radius * 2, el.radius * 2);
        break;
      case 'ellipse':
        updateBounds(x - el.radiusX, y - (el.radiusY || el.radiusX), el.radiusX * 2, (el.radiusY || el.radiusX) * 2);
        break;
      case 'triangle':
      case 'diamond':
      case 'pentagon':
      case 'hexagon':
      case 'star':
        const r = el.radius || el.outerRadius || 0;
        updateBounds(x, y - r, r, r * 2); // Approximate for polygon
        updateBounds(x - r, y, r * 2, r);
        break;
      case 'scribble':
      case 'arrow':
      case 'connector':
      case 'bezier':
        if (el.points) {
          for (let i = 0; i < el.points.length; i += 2) {
            const px = el.points[i] + x;
            const py = el.points[i + 1] + y;
            minX = Math.min(minX, px);
            maxX = Math.max(maxX, px);
            minY = Math.min(minY, py);
            maxY = Math.max(maxY, py);
          }
        }
        break;
      case 'text':
        updateBounds(x, y, el.width || 100, 30);
        break;
      case 'image':
        updateBounds(x, y, el.width || 100, el.height || 100);
        break;
    }
  });

  if (minX === Infinity) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  
  const padding = 40; // Increased padding for rough edges
  return {
    minX: minX - padding,
    minY: minY - padding,
    maxX: maxX + padding,
    maxY: maxY + padding
  };
};

export const renderToOffscreenCanvas = async (elements: any[], box: BoundingBox): Promise<string> => {
  const width = Math.max(1, box.maxX - box.minX);
  const height = Math.max(1, box.maxY - box.minY);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // White background as fallback
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  for (const el of elements) {
    const offsetX = -box.minX;
    const offsetY = -box.minY;
    const x = (el.x || 0) + offsetX;
    const y = (el.y || 0) + offsetY;

    const stroke = el.stroke || '#000';
    const fill = el.fillColor === 'transparent' ? undefined : el.fillColor;
    const strokeWidth = el.strokeWidth || 2;

    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    try {
      if (el.type === 'rectangle') {
        if (fill) {
          ctx.fillStyle = fill;
          ctx.fillRect(x, y, el.width, el.height);
        }
        ctx.strokeRect(x, y, el.width, el.height);
      }
      else if (el.type === 'circle') {
        ctx.beginPath();
        ctx.arc(x, y, el.radius, 0, Math.PI * 2);
        if (fill) {
          ctx.fillStyle = fill;
          ctx.fill();
        }
        ctx.stroke();
      }
      else if (el.type === 'ellipse') {
        ctx.beginPath();
        ctx.ellipse(x, y, el.radiusX, el.radiusY || el.radiusX, 0, 0, Math.PI * 2);
        if (fill) {
          ctx.fillStyle = fill;
          ctx.fill();
        }
        ctx.stroke();
      }
      else if (['triangle', 'diamond', 'pentagon', 'hexagon'].includes(el.type)) {
        const sides = el.type === 'triangle' ? 3 : el.type === 'diamond' ? 4 : el.type === 'pentagon' ? 5 : 6;
        const radius = el.radius || 0;
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
          const px = x + radius * Math.cos(i * 2 * Math.PI / sides - Math.PI / 2);
          const py = y + radius * Math.sin(i * 2 * Math.PI / sides - Math.PI / 2);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        if (fill) {
          ctx.fillStyle = fill;
          ctx.fill();
        }
        ctx.stroke();
      }
      else if (el.type === 'star') {
        const outerRadius = el.outerRadius || 0;
        const innerRadius = el.innerRadius || 0;
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? outerRadius : innerRadius;
          const px = x + r * Math.cos(i * Math.PI / 5 - Math.PI / 2);
          const py = y + r * Math.sin(i * Math.PI / 5 - Math.PI / 2);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        if (fill) {
          ctx.fillStyle = fill;
          ctx.fill();
        }
        ctx.stroke();
      }
      else if (el.type === 'parallelogram') {
        const w = el.width;
        const h = el.height;
        const skew = Math.abs(h) * 0.3;
        ctx.beginPath();
        ctx.moveTo(x, y + h);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x + w - skew, y);
        ctx.lineTo(x - skew, y);
        ctx.closePath();
        if (fill) {
          ctx.fillStyle = fill;
          ctx.fill();
        }
        ctx.stroke();
      }
      else if (el.type === 'scribble') {
        if (el.points && el.points.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(el.points[0] + x, el.points[1] + y);
          for (let i = 2; i < el.points.length; i += 2) {
            ctx.lineTo(el.points[i] + x, el.points[i + 1] + y);
          }
          ctx.stroke();
        }
      }
      else if (el.type === 'arrow') {
        if (el.points && el.points.length >= 4) {
          ctx.beginPath();
          ctx.moveTo(el.points[0] + x, el.points[1] + y);
          for (let i = 2; i < el.points.length; i += 2) {
            ctx.lineTo(el.points[i] + x, el.points[i + 1] + y);
          }
          ctx.stroke();

          // Arrow head
          const len = el.points.length;
          const x1 = el.points[len - 4] + x;
          const y1 = el.points[len - 3] + y;
          const x2 = el.points[len - 2] + x;
          const y2 = el.points[len - 1] + y;
          const angle = Math.atan2(y2 - y1, x2 - x1);
          const headLen = 10;
          ctx.beginPath();
          ctx.moveTo(x2, y2);
          ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
          ctx.moveTo(x2, y2);
          ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
          ctx.stroke();
        }
      }
      else if (el.type === 'connector') {
        const p = el.points;
        ctx.beginPath();
        const startX = p[0] + offsetX + (el.x || 0);
        const startY = p[1] + offsetY + (el.y || 0);
        const midY = p[3] + offsetY + (el.y || 0);
        const endX = p[2] + offsetX + (el.x || 0);
        
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX, midY);
        ctx.lineTo(endX, midY);
        ctx.stroke();
      }
      else if (el.type === 'speech_bubble') {
        const w = el.width;
        const h = el.height;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x + w, y + h * 0.8);
        ctx.lineTo(x + w * 0.6, y + h * 0.8);
        ctx.lineTo(x + w * 0.5, y + h);
        ctx.lineTo(x + w * 0.4, y + h * 0.8);
        ctx.lineTo(x, y + h * 0.8);
        ctx.closePath();
        if (fill) {
          ctx.fillStyle = fill;
          ctx.fill();
        }
        ctx.stroke();
      }
      else if (el.type === 'bezier') {
        const p = el.points;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + p[2] / 2 + 50, y + p[3] / 2 - 50, x + p[2], y + p[3]);
        ctx.stroke();
      }
      else if (el.type === 'text') {
        ctx.font = `500 ${el.fontSize || 20}px 'Inter', sans-serif`;
        ctx.fillStyle = el.stroke || '#000';
        ctx.textBaseline = 'top';
        ctx.fillText(el.text, x, y);
      }
      else if (el.type === 'image') {
        const img = new window.Image();
        img.src = el.src;
        if (img.complete) {
          ctx.drawImage(img, x, y, el.width, el.height);
        } else {
          await new Promise((resolve) => {
            img.onload = () => {
              ctx.drawImage(img, x, y, el.width, el.height);
              resolve(null);
            };
            img.onerror = () => resolve(null);
          });
        }
      }
    } catch (e) {
      console.error(`Error rendering element ${el.id} of type ${el.type}:`, e);
    }
  }

  return canvas.toDataURL('image/png');
};
