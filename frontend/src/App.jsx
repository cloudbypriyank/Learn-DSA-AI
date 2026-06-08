import { useMemo, useState } from "react";
import axios from "axios";
import LessonVideo from "./LessonVideo.jsx";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const SUGGESTED_TOPICS = ["Array", "HashMap", "Tree", "Graph", "Binary Search", "Dynamic Programming"];

function App() {
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPracticeModal, setShowPracticeModal] = useState(false);

  const audioSource = useMemo(() => {
    if (!result?.audio_base64) return "";
    return `data:audio/mpeg;base64,${result.audio_base64}`;
  }, [result]);

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      setError("Please enter a DSA topic first.");
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);
    setCopied(false);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/teach`, {
        topic: trimmedTopic,
      });
      setResult(response.data);
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        "Something went wrong. Check that the backend is running and HF_TOKEN is valid.";
      setError(typeof message === "string" ? message : JSON.stringify(message));
    } finally {
      setIsLoading(false);
    }
  }

  function chooseTopic(value) {
    setTopic(value);
    setError("");
  }

  async function copyAnswer() {
    if (!result?.explanation) return;
    await navigator.clipboard.writeText(result.explanation);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  const kind = useMemo(() => (SUGGESTED_TOPICS.includes(topic) ? "core" : "custom"), [topic]);
  const tagline = useMemo(() => `${topic} is a ${kind.toUpperCase()} DSA – Check it out this video to learn!`, [topic, kind]);

  return (
    <main className="app-shell">
      <div className="topbar">
        <div className="brand-mark">DSA</div>
        <div>
          <strong>DSA AI Teacher Studio</strong>
          <span>HF cloud inference + visual lessons</span>
        </div>
      </div>

      <section className="teacher-panel" aria-labelledby="page-title">
        <div className="intro">
          <p className="eyebrow">Cloud powered DSA learning</p>
          <h1 id="page-title">Learn DSA visually</h1>
          <p>
            Type a data structures or algorithms topic and get a short visual lesson, voice, and text answer.
          </p>
          <div className="hero-stats" aria-label="Project highlights">
            <span>Cloud LLM</span>
            <span>Canvas video</span>
            <span>Voice narration</span>
          </div>
        </div>

        <form className="topic-form" onSubmit={handleSubmit}>
          <label htmlFor="topic">Topic</label>
          <div className="input-row">
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="Try Graph, Binary Search, HashMap..."
              maxLength={80}
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Teaching..." : "Explain"}
            </button>
          </div>
        </form>

        <div className="topic-chips" aria-label="Suggested topics">
          {SUGGESTED_TOPICS.map((item) => (
            <button key={item} type="button" onClick={() => chooseTopic(item)}>
              {item}
            </button>
          ))}
        </div>

        {error && <div className="status error">{error}</div>}
        {isLoading && (
          <section className="loading-card" aria-live="polite">
            <div>
              <span className="pulse-dot" />
              Generating text answer, visual script, and voice...
            </div>
            <div className="skeleton-lines">
              <span />
              <span />
              <span />
            </div>
          </section>
        )}

        {result && (
          <article className="result">
            <div className="result-heading">
              <div>
                <p className="eyebrow">Lesson ready</p>
                <h2>{result.topic}</h2>
              </div>
              <div className="result-meta">
                <span>{result.model || "HF model"}</span>
                <span>{result.generated_at_ms ? `${result.generated_at_ms}ms` : "Generated"}</span>
              </div>
            </div>
            <LessonVideo topic={result.topic} script={result.video_script} audioSource={audioSource} tagline={tagline} />
            {result.audio_error && <div className="status warning">{result.audio_error}</div>}
            <div className="answer-toolbar">
              <h3>Text answer</h3>
              <button type="button" onClick={copyAnswer}>
                {copied ? "Copied" : "Copy answer"}
              </button>
            </div>
            <pre>{result.explanation}</pre>
            {audioSource && (
              <audio controls src={audioSource}>
                Your browser does not support the audio player.
              </audio>
            )}
            <div style={{display: 'flex', gap: 10, marginTop: 12}}>
              <button type="button" onClick={() => setShowPracticeModal(true)}>
                Show practice questions
              </button>
              <a href={`https://leetcode.com/problemset/all/?search=${encodeURIComponent(result.topic)}`} target="_blank" rel="noreferrer">
                Search LeetCode
              </a>
              <a href={`https://codeforces.com/problemset?tags=${encodeURIComponent(result.topic.toLowerCase())}`} target="_blank" rel="noreferrer">
                Search Codeforces
              </a>
            </div>
          </article>
        )}

      {showPracticeModal && result && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="question-modal">
            <div className="modal-header">
              <div className="mac-controls">
                <span className="dot" title="minimize">–</span>
                <span className="dot" title="maximize">▢</span>
                <span className="dot" title="close">✕</span>
              </div>
              <h3>Practice questions for {result.topic}</h3>
              <button className="modal-close" aria-label="Close" onClick={() => setShowPracticeModal(false)}>✕</button>
            </div>

            <div className="practice-body">
              <div className="practice-column">
                <h4>LeetCode</h4>
                <p>Open collection:</p>
                <a href={`https://leetcode.com/tag/${result.topic.toLowerCase()}/`} target="_blank" rel="noreferrer">LeetCode tag: {result.topic}</a>
                <div className="question-grid">
                  <a href="https://leetcode.com/problems/two-sum/" target="_blank" rel="noreferrer"><span>Easy</span><strong>Two Sum</strong><small>LeetCode</small></a>
                  <a href="https://leetcode.com/problems/maximum-subarray/" target="_blank" rel="noreferrer"><span>Easy</span><strong>Maximum Subarray</strong><small>LeetCode</small></a>
                </div>
              </div>

              <div className="practice-column">
                <h4>Codeforces</h4>
                <p>Open collection:</p>
                <a href={`https://codeforces.com/problemset?tags=${result.topic.toLowerCase()}`} target="_blank" rel="noreferrer">Codeforces tag: {result.topic}</a>
                <div className="question-grid">
                  <a href="https://codeforces.com/problemset/problem/1418/A" target="_blank" rel="noreferrer"><span>Easy</span><strong>Buying A House?</strong><small>Codeforces</small></a>
                  <a href="https://codeforces.com/problemset/problem/1490/A" target="_blank" rel="noreferrer"><span>Easy</span><strong>Dense Array</strong><small>Codeforces</small></a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </section>
    </main>
  );
}

export default App;
