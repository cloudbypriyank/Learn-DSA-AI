import { useEffect, useMemo, useRef, useState } from "react";

const VIDEO_SECONDS = 110;

// Theme and styling constants
const THEME = {
  // Background gradients\\
  bgGradient: [
    { stop: 0, color: "#0a1929" },
    { stop: 0.3, color: "#0f2847" },
    { stop: 0.7, color: "#051e3e" },
    { stop: 1, color: "#030e1f" },
  ],
  
  // Header bar
  headerBg: "rgba(103, 232, 249, 0.15)",
  headerBorder: "rgba(103, 232, 249, 0.25)",
  headerBorderWidth: 2,
  
  // Title
  titleColor: "rgba(103, 232, 249, 0.8)",
  titleFont: "800 32px Inter, sans-serif",
  titleGlowColor: "rgba(103, 232, 249, 0.6)",
  titleGlowBlur: 12,
  
  // Subtitle
  subtitleColor: "#67e8f9",
  subtitleFont: "700 15px Inter, sans-serif",
  

  // Progress bar
  progressBgColor: "rgba(148, 163, 184, 0.25)",
  progressStart: "#67e8f9",
  progressEnd: "#06b6d4",
  progressHeight: 8,
  
  // Data structure colors
  array: {
    activeCell: "#dff7f4",
    inactiveCell: "#ffffff",
    activeBorder: "#0f766e",
    inactiveBorder: "#94a3b8",
    arrowColor: "#ef4444",
    textColor: "#0f172a",
    indexColor: "#64748b",
  },
  
  hashmap: {
    bucketFill: "#ffffff",
    bucketBorder: "#2563eb",
    activeFill: "#dff7f4",
    activeBorder: "#0f766e",
    textColor: "#0f172a",
    bucketText: "#1e293b",
    arrowColor: "#0f766e",
  },
  
  tree: {
    edgeColor: "#94a3b8",
    activeFill: "#dbeafe",
    inactiveFill: "#ffffff",
    activeBorder: "#2563eb",
    inactiveBorder: "#94a3b8",
    textColor: "#0f172a",
  },
  
  graph: {
    edgeColor: "#0f766e",
    activeFill: "#fff7ed",
    inactiveFill: "#ffffff",
    activeBorder: "#f97316",
    inactiveBorder: "#94a3b8",
    textColor: "#0f172a",
  },
  
  stackQueue: {
    activeFill: "#dbeafe",
    inactiveFill: "#ffffff",
    activeBorder: "#2563eb",
    inactiveBorder: "#94a3b8",
    textColor: "#0f172a",
    arrowColor: "#ef4444",
  },
  
  linkedList: {
    activeFill: "#dff7f4",
    inactiveFill: "#ffffff",
    activeBorder: "#0f766e",
    inactiveBorder: "#94a3b8",
    textColor: "#0f172a",
    arrowColor: "#2563eb",
  },
  
  dp: {
    filledCell: "#dff7f4",
    emptyCell: "#ffffff",
    filledBorder: "#0f766e",
    emptyBorder: "#cbd5e1",
    textColor: "#0f172a",
  },
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) {
//   const words = text.split(/\s+/).filter(Boolean);
//   const lines = [];
//   let line = "";

//   for (let i = 0; i < words.length; i++) {
//     const word = words[i];
//     const nextLine = line ? `${line} ${word}` : word;

//     // Check if the current line exceeds width bounds
//     if (ctx.measureText(nextLine).width > maxWidth && line) {
//       lines.push(line);
//       line = word;
//     } else {
//       line = nextLine;
//     }

//     // Engineering Truncation: Handle text bounds constraints for the final allowed line
//     if (lines.length === maxLines - 1) {
//       let remainingWords = words.slice(i + 1).join(" ");
//       let finalLineCandidate = remainingWords ? `${line} ${remainingWords}` : line;

//       // If the rest of the text overflows, systematically strip words and add ellipsis
//       if (ctx.measureText(finalLineCandidate).width > maxWidth) {
//         let currentWords = line.split(" ");
//         while (currentWords.length > 0) {
//           let testLine = currentWords.join(" ") + "...";
//           if (ctx.measureText(testLine).width <= maxWidth) {
//             line = testLine;
//             break;
//           }
//           currentWords.pop();
//         }
//       } else {
//         line = finalLineCandidate;
//       }
//       lines.push(line);
//       line = "";
//       break;
//     }
//   }

//   if (line && lines.length < maxLines) {
//     lines.push(line);
//   }

//   // Render the processed lines onto the canvas layer grid coordinates
//   lines.forEach((item, index) => {
//     ctx.fillText(item, x, y + index * lineHeight);
//   });
// }


function getLessonPoints(script) {
  return script
    .replace(/\*\*/g, "")
    .split(/[.!?]+/)
    .map(line => line.trim())
    .filter(line => line.length > 5);
}

function getTopicKind(topic) {
  const value = topic.toLowerCase();
  if (value.includes("hash") || value.includes("map")) return "hashmap";
  if (value.includes("tree") || value.includes("heap")) return "tree";
  if (value.includes("graph")) return "graph";
  if (value.includes("stack")) return "stack";
  if (value.includes("queue")) return "queue";
  if (value.includes("linked")) return "linked-list";
  if (value.includes("dynamic") || value.includes("dp")) return "dp";
  return "array";
}

function drawArrow(ctx, fromX, fromY, toX, toY, color = "#2563eb") {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - 12 * Math.cos(angle - Math.PI / 6), toY - 12 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - 12 * Math.cos(angle + Math.PI / 6), toY - 12 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function drawArray(ctx, progress) {
  const startX = 110;
  const y = 245;
  const cell = 72;
  const values = [4, 8, 15, 16, 23, 42];
  values.forEach((value, index) => {
    const x = startX + index * cell;
    const active = index <= Math.floor(progress * values.length);
    ctx.fillStyle = active ? THEME.array.activeCell : THEME.array.inactiveCell;
    ctx.strokeStyle = active ? THEME.array.activeBorder : THEME.array.inactiveBorder;
    ctx.lineWidth = 3;
    ctx.roundRect(x, y, cell, 64, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = THEME.array.textColor;
    ctx.font = "700 22px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(value, x + cell / 2, y + 39);
    ctx.font = "600 13px Inter, sans-serif";
    ctx.fillStyle = THEME.array.indexColor;
    ctx.fillText(index, x + cell / 2, y + 91);
  });
  drawArrow(ctx, 145 + progress * 330, 190, 145 + progress * 330, 238, THEME.array.arrowColor);
}

function drawHashMap(ctx, progress) {
  const keys = ["cat", "sun", "tree", "code"];
  const buckets = ["0", "1", "2", "3"];
  buckets.forEach((bucket, index) => {
    const y = 160 + index * 70;
    ctx.fillStyle = THEME.hashmap.bucketFill;
    ctx.strokeStyle = THEME.hashmap.bucketBorder;
    ctx.lineWidth = 3;
    ctx.roundRect(120, y, 90, 48, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = THEME.hashmap.bucketText;
    ctx.font = "700 18px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(bucket, 165, y + 31);

    const visible = progress * keys.length > index;
    if (visible) {
      ctx.fillStyle = THEME.hashmap.activeFill;
      ctx.strokeStyle = THEME.hashmap.activeBorder;
      ctx.roundRect(290, y, 170, 48, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = THEME.hashmap.textColor;
      ctx.fillText(`${keys[index]} -> ${index * 11 + 7}`, 375, y + 31);
      drawArrow(ctx, 213, y + 24, 286, y + 24, THEME.hashmap.arrowColor);
    }
  });
}

function drawTree(ctx, progress) {
  const nodes = [
    [360, 120, "8"],
    [240, 230, "3"],
    [480, 230, "10"],
    [170, 340, "1"],
    [310, 340, "6"],
    [550, 340, "14"],
  ];
  const edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5]];
  edges.forEach(([from, to], index) => {
    if (progress * edges.length < index) return;
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(nodes[from][0], nodes[from][1]);
    ctx.lineTo(nodes[to][0], nodes[to][1]);
    ctx.stroke();
  });
  nodes.forEach(([x, y, label], index) => {
    const active = progress * nodes.length >= index;
    ctx.fillStyle = active ? "#dbeafe" : "#ffffff";
    ctx.strokeStyle = active ? "#2563eb" : "#94a3b8";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#0f172a";
    ctx.font = "800 20px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(label, x, y + 7);
  });
}

function drawGraph(ctx, progress) {
  const nodes = [
    [160, 180, "A"],
    [340, 125, "B"],
    [530, 200, "C"],
    [270, 340, "D"],
    [500, 355, "E"],
  ];
  const edges = [[0, 1], [1, 2], [0, 3], [3, 4], [2, 4], [1, 3]];
  edges.forEach(([from, to], index) => {
    if (progress * edges.length < index) return;
    ctx.strokeStyle = "#0f766e";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(nodes[from][0], nodes[from][1]);
    ctx.lineTo(nodes[to][0], nodes[to][1]);
    ctx.stroke();
  });
  nodes.forEach(([x, y, label], index) => {
    const active = progress * nodes.length >= index;
    ctx.fillStyle = active ? "#fff7ed" : "#ffffff";
    ctx.strokeStyle = active ? "#f97316" : "#94a3b8";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#0f172a";
    ctx.font = "800 19px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(label, x, y + 7);
  });
}

function drawStackOrQueue(ctx, progress, mode) {
  const items = ["12", "7", "31", "5"];
  items.forEach((item, index) => {
    const x = mode === "queue" ? 155 + index * 105 : 320;
    const y = mode === "queue" ? 240 : 345 - index * 62;
    const active = progress * items.length >= index;
    ctx.fillStyle = active ? "#dbeafe" : "#ffffff";
    ctx.strokeStyle = active ? "#2563eb" : "#94a3b8";
    ctx.lineWidth = 3;
    ctx.roundRect(x, y, 86, 54, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#0f172a";
    ctx.font = "800 20px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(item, x + 43, y + 34);
  });
  if (mode === "queue") {
    drawArrow(ctx, 100, 267, 148, 267, "#0f766e");
    drawArrow(ctx, 580, 267, 635, 267, "#ef4444");
  } else {
    drawArrow(ctx, 363, 80, 363, 135, "#ef4444");
  }
}

function drawLinkedList(ctx, progress) {
  const labels = ["head", "18", "24", "39", "null"];
  labels.forEach((label, index) => {
    const x = 90 + index * 125;
    const y = 245;
    const active = progress * labels.length >= index;
    ctx.fillStyle = active ? "#dff7f4" : "#ffffff";
    ctx.strokeStyle = active ? "#0f766e" : "#94a3b8";
    ctx.lineWidth = 3;
    ctx.roundRect(x, y, 82, 54, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#0f172a";
    ctx.font = "800 18px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(label, x + 41, y + 34);
    if (index < labels.length - 1 && active) {
      drawArrow(ctx, x + 84, y + 27, x + 121, y + 27, "#2563eb");
    }
  });
}

function drawDp(ctx, progress) {
  const startX = 190;
  const startY = 155;
  const size = 52;
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 6; col += 1) {
      const index = row * 6 + col;
      const filled = progress * 30 >= index;
      ctx.fillStyle = filled ? "#dff7f4" : "#ffffff";
      ctx.strokeStyle = filled ? "#0f766e" : "#cbd5e1";
      ctx.lineWidth = 2;
      ctx.fillRect(startX + col * size, startY + row * size, size, size);
      ctx.strokeRect(startX + col * size, startY + row * size, size, size);
      if (filled) {
        ctx.fillStyle = "#0f172a";
        ctx.font = "700 15px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(row + col, startX + col * size + 26, startY + row * size + 32);
      }
    }
  }
}

function drawStructure(ctx, kind, progress) {
  if (kind === "hashmap") drawHashMap(ctx, progress);
  else if (kind === "tree") drawTree(ctx, progress);
  else if (kind === "graph") drawGraph(ctx, progress);
  else if (kind === "stack") drawStackOrQueue(ctx, progress, "stack");
  else if (kind === "queue") drawStackOrQueue(ctx, progress, "queue");
  else if (kind === "linked-list") drawLinkedList(ctx, progress);
  else if (kind === "dp") drawDp(ctx, progress);
  else drawArray(ctx, progress);
}

function drawFrame(canvas, topic, point, kind, elapsed, isEnded) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const progress = clamp(elapsed / VIDEO_SECONDS, 0, 1);
  const sceneProgress = (progress * 7) % 1;

  ctx.clearRect(0, 0, width, height);
  
  // Enhanced background gradient
  const bg = ctx.createLinearGradient(0, 0, width, height);
  THEME.bgGradient.forEach(({ stop, color }) => bg.addColorStop(stop, color));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  
  // Glowing top header bar with cyan accent
  ctx.fillStyle = THEME.headerBg;
  ctx.fillRect(0, 0, width, 100);
  ctx.strokeStyle = THEME.headerBorder;
  ctx.lineWidth = THEME.headerBorderWidth;
  ctx.strokeRect(0, 0, width, 100);
progressGlow: "rgba(6,182,212,.15)",

  drawStructure(ctx, kind, sceneProgress);

  // Enhanced caption box with better styling
// Calculate dynamic structural coordinates based on canvas dimensions

// Render the Sleek Glassmorphism Caption Container Frame

// Render the Highly Scalable Typography


  const barX = 36;
  const barHeight = 6; // Thinner profile looks far cleaner and less bulky
  const barWidth = width - (barX * 2);
  const barY = height - barHeight - 16; // Perfectly aligns relative to the frame boundary
  const progressWidth = barWidth * progress;

  // // Render Background Track Buffer Line
  // ctx.beginPath();
  // ctx.fillStyle = THEME.progressBgColor;
  // ctx.roundRect(barX, barY, barWidth, barHeight, 3);
  // ctx.fill();

  if (progressWidth > 0) {
    // Render Dynamic Neon Progress Active Track Fill
    const gradient = ctx.createLinearGradient(barX, barY, barX + progressWidth, barY);
    gradient.addColorStop(0, THEME.progressStart);
    gradient.addColorStop(1, THEME.progressEnd);

    ctx.beginPath();
    ctx.fillStyle = gradient;
    ctx.roundRect(barX, barY, progressWidth, barHeight, 3);
    ctx.fill();

    // Premium feature: Glowing Handle Indicator Knob (Only draws at progress head terminal)
    const knobX = barX + progressWidth;
    const knobY = barY + (barHeight / 2);
    const knobRadius = 5;

    // Render soft radial illumination aura ring behind the handle knob
    ctx.beginPath();
    ctx.arc(knobX, knobY, knobRadius + 4, 0, Math.PI * 2);
    ctx.fillStyle = THEME.progressGlow;
    ctx.fill();

    // Render solid crisp center indicator point pin core
    ctx.beginPath();
    ctx.arc(knobX, knobY, knobRadius, 0, Math.PI * 2);
    ctx.fillStyle = THEME.progressEnd;
    ctx.fill();
  }

}

function LessonVideo({ topic, script, audioSource }) {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const animationRef = useRef(0);
  const startedAtRef = useRef(0);
  const pausedAtRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const points = useMemo(() => getLessonPoints(script), [script]);
  
  const kind = useMemo(() => getTopicKind(topic), [topic]);
const segmentDuration = VIDEO_SECONDS / points.length;

const activePoint =
  points[Math.floor(elapsed / segmentDuration)] || points[points.length - 1];
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawFrame(canvas, topic, activePoint, kind, elapsed, elapsed >= VIDEO_SECONDS);
  }, [activePoint, elapsed, kind, script, topic]);

 useEffect(() => {
  const interval = setInterval(() => {
    if (audioRef.current) {
      setElapsed(audioRef.current.currentTime);
    }
  }, 100);

  return () => clearInterval(interval);
}, []);

  function tick() {
    const nextElapsed = audioRef.current?.currentTime || 0;

    if (nextElapsed >= VIDEO_SECONDS) {
      setIsPlaying(false);
      audioRef.current?.pause();
      return;
    }

    animationRef.current = requestAnimationFrame(tick);
  }

  async function play() {
    cancelAnimationFrame(animationRef.current);

    if (elapsed >= VIDEO_SECONDS) {
      pausedAtRef.current = 0;
      setElapsed(0);
      if (audioRef.current) audioRef.current.currentTime = 0;
    }

    startedAtRef.current = performance.now() - pausedAtRef.current * 1000;
    setIsPlaying(true);

    if (audioRef.current && audioSource) {
      audioRef.current.currentTime = pausedAtRef.current;
      await audioRef.current.play().catch(() => undefined);
    }

    animationRef.current = requestAnimationFrame(tick);
  }

  function pause() {
    pausedAtRef.current = elapsed;
    setIsPlaying(false);
    cancelAnimationFrame(animationRef.current);
    if (audioRef.current) audioRef.current.pause();
  }

  function restart() {
    cancelAnimationFrame(animationRef.current);
    pausedAtRef.current = 0;
    setElapsed(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
    if (isPlaying) {
      startedAtRef.current = performance.now();
      animationRef.current = requestAnimationFrame(tick);
    }
  }

  return (
 <section className="lesson-video" aria-label="Generated visual lesson video">
  {/* Screen Layer holding Canvas and Embedded Overlay Subtitles */}
      <div className="video-viewport">
        <canvas
          ref={canvasRef}
          width={1920}
          height={1080}
        />
        <div className="video-caption">
          {activePoint}
        </div>
        {/* Big Interactive Floating Center Controller Button */}
        <button
          type="button"
          className={`center-play-overlay ${!isPlaying ? 'video-is-paused' : ''}`}
          onClick={isPlaying ? pause : play}
          aria-label={isPlaying ? "Pause video" : "Play video"}
        >
          {isPlaying ? (
            /* Slick Pause Icon Vector */
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            /* Slick Play Icon Vector */
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>


    {/* Inline Modern YT Style Control Dashboard */}
    <div className="video-controls-bar">
      <div className="control-group">
       

        <button type="button" className="control-action-btn secondary-btn" onClick={restart}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
          <span>Restart</span>
        </button>
      </div>

      <div className="time-telemetry">
        <span className="current-time">{Math.floor(elapsed)}s</span>
        <span className="time-divider">/</span>
        <span className="total-duration">{VIDEO_SECONDS}s</span>
      </div>
    </div>

    {audioSource && <audio ref={audioRef} src={audioSource} preload="auto" />}
  </section>
);

}

export default LessonVideo;
