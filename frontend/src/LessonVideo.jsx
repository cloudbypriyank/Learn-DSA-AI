import { useEffect, useMemo, useRef, useState } from "react";

const VIDEO_SECONDS = 110;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 4) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(nextLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = nextLine;
    }

    if (lines.length === maxLines) break;
  }

  if (line && lines.length < maxLines) lines.push(line);

  lines.forEach((item, index) => {
    ctx.fillText(item, x, y + index * lineHeight);
  });
}

function getLessonPoints(script) {
  return script
    .replace(/\*\*/g, "")
    .split(/\n|(?<=\.)\s+/)
    .map((line) => line.replace(/^[-#*\d.\s]+/, "").trim())
    .filter((line) => line.length > 24)
    .slice(0, 7);
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
    ctx.fillStyle = active ? "#dff7f4" : "#ffffff";
    ctx.strokeStyle = active ? "#0f766e" : "#94a3b8";
    ctx.lineWidth = 3;
    ctx.roundRect(x, y, cell, 64, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#0f172a";
    ctx.font = "700 22px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(value, x + cell / 2, y + 39);
    ctx.font = "600 13px Inter, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText(index, x + cell / 2, y + 91);
  });
  drawArrow(ctx, 145 + progress * 330, 190, 145 + progress * 330, 238, "#ef4444");
}

function drawHashMap(ctx, progress) {
  const keys = ["cat", "sun", "tree", "code"];
  const buckets = ["0", "1", "2", "3"];
  buckets.forEach((bucket, index) => {
    const y = 160 + index * 70;
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 3;
    ctx.roundRect(120, y, 90, 48, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#1e293b";
    ctx.font = "700 18px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(bucket, 165, y + 31);

    const visible = progress * keys.length > index;
    if (visible) {
      ctx.fillStyle = "#dff7f4";
      ctx.strokeStyle = "#0f766e";
      ctx.roundRect(290, y, 170, 48, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#0f172a";
      ctx.fillText(`${keys[index]} -> ${index * 11 + 7}`, 375, y + 31);
      drawArrow(ctx, 213, y + 24, 286, y + 24, "#0f766e");
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
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#08111f");
  bg.addColorStop(0.5, "#0f172a");
  bg.addColorStop(1, "#052e3f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "rgba(103, 232, 249, 0.12)";
  ctx.fillRect(0, 0, width, 92);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "800 28px Inter, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(topic, 36, 52);

  ctx.fillStyle = "#67e8f9";
  ctx.font = "700 15px Inter, sans-serif";
  ctx.fillText(isEnded ? "Lesson complete" : "Animated DSA lesson", 36, 76);

  drawStructure(ctx, kind, sceneProgress);

  ctx.fillStyle = "rgba(2, 6, 23, 0.82)";
  ctx.roundRect(28, 428, width - 56, 116, 8);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 22px Inter, sans-serif";
  ctx.textAlign = "left";
  wrapText(ctx, point, 52, 468, width - 104, 28, 3);

  ctx.fillStyle = "rgba(148, 163, 184, 0.35)";
  ctx.fillRect(36, height - 24, width - 72, 8);
  ctx.fillStyle = "#67e8f9";
  ctx.fillRect(36, height - 24, (width - 72) * progress, 8);
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
  const activePoint = points[Math.min(Math.floor((elapsed / VIDEO_SECONDS) * points.length), points.length - 1)] || script;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawFrame(canvas, topic, activePoint, kind, elapsed, elapsed >= VIDEO_SECONDS);
  }, [activePoint, elapsed, kind, script, topic]);

  useEffect(() => {
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  function tick(now) {
    const nextElapsed = clamp((now - startedAtRef.current) / 1000, 0, VIDEO_SECONDS);
    setElapsed(nextElapsed);

    if (nextElapsed >= VIDEO_SECONDS) {
      setIsPlaying(false);
      if (audioRef.current) audioRef.current.pause();
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
      <canvas ref={canvasRef} width="960" height="540" />
      <p className="video-caption">{activePoint}</p>
      <div className="video-controls">
        <button type="button" onClick={isPlaying ? pause : play}>
          {isPlaying ? "Pause video" : "Play video"}
        </button>
        <button type="button" onClick={restart}>
          Restart
        </button>
        <span>
          {Math.floor(elapsed)}s / {VIDEO_SECONDS}s
        </span>
      </div>
      {audioSource && <audio ref={audioRef} src={audioSource} preload="auto" />}
    </section>
  );
}

export default LessonVideo;
