import { useMemo, useState } from "react";
import axios from "axios";
import LessonVideo from "./LessonVideo.jsx";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const SUGGESTED_TOPICS = ["Array", "HashMap", "Tree", "Graph", "Binary Search", "Dynamic Programming"];

// Map user topics to CSV visualization tool paths
const TOPIC_TO_VISUALIZATION_PATH = {
  "array": "ArrayList",
  "arraylist": "ArrayList",
  "linkedlist": "LinkedList",
  "singly linked list": "LinkedList",
  "doubly linked list": "DoublyLinkedList",
  "circular linked list": "CircularlyLinkedList",
  "stack": "StackArray",
  "queue": "QueueArray",
  "deque": "DequeArray",
  "tree": "BST",
  "bst": "BST",
  "binary search tree": "BST",
  "avl": "AVL",
  "heap": "Heap",
  "priority queue": "Heap",
  "hashmap": "ClosedHash",
  "hash map": "ClosedHash",
  "graph": "CreateGraph",
  "bfs": "BFS",
  "breadth first search": "BFS",
  "dfs": "DFS",
  "depth first search": "DFS",
  "dijkstra": "Dijkstra",
  "binary search": "BinarySearch",
  "bubble sort": "BubbleSort",
  "insertion sort": "InsertionSort",
  "selection sort": "SelectionSort",
  "merge sort": "MergeSort",
  "quick sort": "Quicksort",
  "quicksort": "Quicksort",
  "heap sort": "HeapSort",
  "kmp": "KMP",
  "rabin karp": "RabinKarp",
  "boyer moore": "BoyerMoore",
  "lcs": "LCS",
  "longest common subsequence": "LCS",
  "dynamic programming": "LCS",
  "skip list": "SkipList",
  "splay tree": "SplayTree",
  "trie": "Trie",
};

function getVisualizationPath(topic) {
  const normalized = topic.toLowerCase().trim();
  return TOPIC_TO_VISUALIZATION_PATH[normalized] || "ArrayList";
}

function App() {
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [showVisualizationModal, setShowVisualizationModal] = useState(false);

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
          <div className="input-row">
            {/* This wrapper groups the text field and voice dropdown side-by-side */}
            <div className="input-field-group">
              <input
                id="topic"
                type="text"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="Enter a DSA topic (e.g. 'binary search tree')"
                maxLength={80}
              />

              <select
                aria-label="Select voice for narration"
                className="voice-select"
              >
                <option value="en-US-AriaNeural">English Aria</option>
                <option value="en-US-GuyNeural">English Guy</option>
                <option value="mr-IN-AarohiNeural">Marathi Aarohi</option>
                <option value="mr-IN-ManoharNeural">Marathi Manohar</option>
                <option value="en-IN-NeerjaNeural">English Neerja</option>
                <option value="en-IN-PrabhatNeural">English Prabhat</option>
                <option value="hi-IN-SwaraNeural">Hindi Swara</option>
                <option value="hi-IN-MadhurNeural">Hindi Madhur</option>
              </select>
            </div>

            {/* The main action button sits beautifully centered underneath */}
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
             <p> Generating text answer, visual script, and voice...</p>
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

            <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setShowPracticeModal(true)} className="btn-practice-questions">
                📊 Show Practice Questions
              </button>
              <button type="button" onClick={() => setShowVisualizationModal(true)} className="btn-visualize-data">
                🎨 Visualize Data
              </button>
            </div>
          </article>
        )}

        {showPracticeModal && result && (
          <div className="modal-backdrop" onClick={() => setShowPracticeModal(false)}>
  {/* Stop click event propagation so clicking inside card doesn't close modal */}
            <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>

              <div className="modal-header">
                <div className="mac-controls">
                  <span className="dot close" />
                  <span className="dot minimize" />
                  <span className="dot maximize" />
                </div>

                <button type="button" className="modal-close" onClick={() => setShowPracticeModal(false)} aria-label="Close modal">
                  {/* Crisp Minimal Close Cross Vector */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div className="practice-body">
                {/* Columns go here inside layout */}
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

        {showVisualizationModal && result && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="visualization-modal">
              <div className="modal-header">
                <div>
                  <h3>Visualize Data Structure: {result.topic}</h3>
                </div>
                <button
                  className="modal-close"
                  aria-label="Close"
                  onClick={() => setShowVisualizationModal(false)}
                >
                  ✕
                </button>
              </div>
              <iframe
                src={`https://csvistool.com/${getVisualizationPath(result.topic)}`}
                title={`Visualize ${result.topic}`}
              />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
