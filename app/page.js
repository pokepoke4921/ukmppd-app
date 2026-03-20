"use client";
import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [tab, setTab] = useState("upload");
  const [pdfBase64, setPdfBase64] = useState(null);
  const [pdfName, setPdfName] = useState("");
  const [topic, setTopic] = useState("");
  const [jumlah, setJumlah] = useState(10);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [mcqItems, setMcqItems] = useState([]);

  // Flashcard state
  const [fcIdx, setFcIdx] = useState(0);
  const [fcFlipped, setFcFlipped] = useState(false);

  // Latihan state
  const [latIdx, setLatIdx] = useState(0);
  const [latAnswered, setLatAnswered] = useState(false);
  const [latCorrect, setLatCorrect] = useState(0);
  const [latSelected, setLatSelected] = useState(null);
  const [latDone, setLatDone] = useState(false);

  // Ujian state
  const [ujianStarted, setUjianStarted] = useState(false);
  const [ujianIdx, setUjianIdx] = useState(0);
  const [ujianAnswers, setUjianAnswers] = useState([]);
  const [ujianDone, setUjianDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (ujianStarted && !ujianDone && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) { clearInterval(timerRef.current); setUjianDone(true); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [ujianStarted, ujianDone]);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPdfName(file.name);
    const reader = new FileReader();
    reader.onload = () => setPdfBase64(reader.result.split(",")[1]);
    reader.readAsDataURL(file);
  }

  async function callBackend(prompt) {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pdfBase64, prompt }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  }

  function cleanJson(str) {
    return str.replace(/```json|```/g, "").trim();
  }

  async function generateAll() {
    if (!pdfBase64) return;
    setLoading(true);
    setStatus("Membaca PDF dan generate soal... harap tunggu 20-30 detik.");
    try {
      const t = topic || "penyakit dalam materi";

      const [fcText, mcqText] = await Promise.all([
        callBackend(`Kamu adalah dosen UKMPPD Indonesia. Dari PDF materi ini tentang "${t}", buat 8 flashcard penting. Kembalikan HANYA JSON valid tanpa markdown: {"flashcards":[{"front":"pertanyaan singkat","back":"jawaban lengkap","tag":"kategori"}]}`),
        callBackend(`Kamu pembuat soal UKMPPD Indonesia. Dari PDF materi ini tentang "${t}", buat ${jumlah} soal MCQ bergaya vignette klinis standar UKMPPD. Setiap soal: vignette 3+ kalimat, pertanyaan, 5 pilihan A-E, kunci (index 0-4), pembahasan. Kembalikan HANYA JSON valid: {"mcq":[{"vignette":"...","question":"...","options":["A. ...","B. ...","C. ...","D. ...","E. ..."],"answer":0,"explanation":"..."}]}`),
      ]);

      const fc = JSON.parse(cleanJson(fcText)).flashcards || [];
      const mcq = JSON.parse(cleanJson(mcqText)).mcq || [];
      setFlashcards(fc);
      setMcqItems(mcq);
      setFcIdx(0); setFcFlipped(false);
      setLatIdx(0); setLatAnswered(false); setLatCorrect(0); setLatSelected(null); setLatDone(false);
      setUjianStarted(false); setUjianDone(false); setUjianAnswers([]);
      setStatus(`Selesai! ${fc.length} flashcard + ${mcq.length} soal MCQ siap digunakan.`);
    } catch (err) {
      setStatus("Gagal: " + err.message);
    }
    setLoading(false);
  }

  function answerLatihan(i) {
    if (latAnswered) return;
    setLatAnswered(true);
    setLatSelected(i);
    if (i === mcqItems[latIdx].answer) setLatCorrect((c) => c + 1);
  }

  function latihanNext() {
    if (latIdx + 1 >= mcqItems.length) { setLatDone(true); return; }
    setLatIdx((x) => x + 1);
    setLatAnswered(false);
    setLatSelected(null);
  }

  function startUjian() {
    setUjianStarted(true);
    setUjianIdx(0);
    setUjianAnswers(new Array(mcqItems.length).fill(null));
    setUjianDone(false);
    setTimeLeft(mcqItems.length * 120);
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = String(timeLeft % 60).padStart(2, "0");

  const styles = {
    app: { fontFamily: "system-ui, sans-serif", maxWidth: 720, margin: "0 auto", padding: "1rem" },
    header: { textAlign: "center", marginBottom: "1.5rem" },
    h1: { fontSize: 24, fontWeight: 600, margin: 0 },
    sub: { fontSize: 14, color: "#666", marginTop: 4 },
    tabs: { display: "flex", gap: 4, borderBottom: "1px solid #e5e7eb", marginBottom: "1.5rem" },
    tabBtn: (active) => ({ padding: "8px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 14, fontWeight: active ? 600 : 400, color: active ? "#111" : "#666", borderBottom: active ? "2px solid #111" : "2px solid transparent", marginBottom: -1 }),
    uploadZone: { border: "1.5px dashed #d1d5db", borderRadius: 12, padding: "2rem", textAlign: "center", cursor: "pointer", background: "#f9fafb", marginBottom: "1rem" },
    input: { width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, marginBottom: "0.5rem" },
    select: { padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 },
    btn: (disabled) => ({ width: "100%", padding: "10px", fontSize: 14, fontWeight: 600, border: "1px solid #d1d5db", borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer", background: disabled ? "#f3f4f6" : "#111", color: disabled ? "#9ca3af" : "#fff", marginTop: "0.5rem" }),
    status: { textAlign: "center", fontSize: 13, color: "#6b7280", padding: "8px", minHeight: 28 },
    card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "1.25rem", marginBottom: "1rem" },
    vignette: { fontSize: 14, lineHeight: 1.7, color: "#374151", borderLeft: "3px solid #d1d5db", paddingLeft: 12, marginBottom: "1rem" },
    question: { fontSize: 15, fontWeight: 600, marginBottom: "0.75rem" },
    optBtn: (state) => ({
      display: "block", width: "100%", textAlign: "left", padding: "10px 12px", fontSize: 14,
      border: `1px solid ${state === "correct" ? "#16a34a" : state === "wrong" ? "#dc2626" : "#d1d5db"}`,
      borderRadius: 8, cursor: "pointer", marginBottom: 6, lineHeight: 1.5,
      background: state === "correct" ? "#f0fdf4" : state === "wrong" ? "#fef2f2" : "#f9fafb",
      color: state === "correct" ? "#15803d" : state === "wrong" ? "#dc2626" : "#111",
    }),
    expl: { background: "#eff6ff", borderLeft: "3px solid #3b82f6", borderRadius: 8, padding: 12, marginTop: "0.75rem", fontSize: 13, color: "#1e40af", lineHeight: 1.6 },
    navRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem" },
    navBtn: { padding: "7px 18px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", background: "#fff" },
    scoreCard: { background: "#f9fafb", borderRadius: 12, padding: "1.5rem", textAlign: "center", marginBottom: "1rem" },
    bigNum: (pass) => ({ fontSize: 48, fontWeight: 700, color: pass ? "#16a34a" : "#dc2626" }),
    empty: { textAlign: "center", padding: "3rem 1rem", color: "#9ca3af", fontSize: 14 },
    fcWrap: { perspective: 800, marginBottom: "0.75rem", height: 200, cursor: "pointer" },
    fcInner: (flip) => ({ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d", transition: "transform 0.4s", transform: flip ? "rotateY(180deg)" : "none" }),
    fcSide: (back) => ({ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", border: "1px solid #e5e7eb", borderRadius: 12, padding: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", background: back ? "#f9fafb" : "#fff", transform: back ? "rotateY(180deg)" : "none" }),
    fcLabel: { fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 },
    fcText: { fontSize: 15, color: "#111", lineHeight: 1.6 },
    fcTag: { fontSize: 11, color: "#3b82f6", marginTop: 8 },
  };

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <h1 style={styles.h1}>UKMPPD Study App</h1>
        <p style={styles.sub}>Upload PDF materi → AI generate soal & flashcard otomatis</p>
      </div>

      <div style={styles.tabs}>
        {["upload","flashcard","latihan","ujian"].map((t) => (
          <button key={t} style={styles.tabBtn(tab === t)} onClick={() => setTab(t)}>
            {t === "upload" ? "Upload & Generate" : t === "flashcard" ? "Flashcard" : t === "latihan" ? "Mode Latihan" : "Mode Ujian"}
          </button>
        ))}
      </div>

      {/* UPLOAD TAB */}
      {tab === "upload" && (
        <div>
          <label style={styles.uploadZone}>
            <input type="file" accept="application/pdf" style={{ display: "none" }} onChange={handleFile} />
            <p style={{ fontSize: 15, color: "#374151" }}>{pdfName || "Klik untuk upload PDF materi"}</p>
            <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>Format: PDF — maks 10MB</p>
          </label>
          <div style={{ display: "flex", gap: 8, marginBottom: "0.5rem" }}>
            <input style={{ ...styles.input, marginBottom: 0, flex: 1 }} placeholder="Topik penyakit (misal: Demam Tifoid, TB Paru...)" value={topic} onChange={(e) => setTopic(e.target.value)} />
            <select style={styles.select} value={jumlah} onChange={(e) => setJumlah(Number(e.target.value))}>
              <option value={5}>5 soal</option>
              <option value={10}>10 soal</option>
              <option value={15}>15 soal</option>
            </select>
          </div>
          <button style={styles.btn(!pdfBase64 || loading)} disabled={!pdfBase64 || loading} onClick={generateAll}>
            {loading ? "Generating..." : "Generate soal & flashcard dari PDF"}
          </button>
          <p style={styles.status}>{status}</p>
        </div>
      )}

      {/* FLASHCARD TAB */}
      {tab === "flashcard" && (
        flashcards.length === 0 ? <div style={styles.empty}>Belum ada flashcard. Upload PDF dan generate dulu.</div> :
        <div>
          <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 8 }}>Flashcard {fcIdx + 1} dari {flashcards.length} · klik kartu untuk balik</p>
          <div style={styles.fcWrap} onClick={() => setFcFlipped(!fcFlipped)}>
            <div style={styles.fcInner(fcFlipped)}>
              <div style={styles.fcSide(false)}>
                <div style={styles.fcLabel}>pertanyaan</div>
                <div style={styles.fcText}>{flashcards[fcIdx].front}</div>
              </div>
              <div style={styles.fcSide(true)}>
                <div style={styles.fcLabel}>jawaban</div>
                <div style={styles.fcText}>{flashcards[fcIdx].back}</div>
                <div style={styles.fcTag}>{flashcards[fcIdx].tag}</div>
              </div>
            </div>
          </div>
          <div style={styles.navRow}>
            <button style={styles.navBtn} onClick={() => { setFcIdx((i) => (i - 1 + flashcards.length) % flashcards.length); setFcFlipped(false); }}>← Sebelumnya</button>
            <span style={{ fontSize: 13, color: "#6b7280" }}>{fcIdx + 1} / {flashcards.length}</span>
            <button style={styles.navBtn} onClick={() => { setFcIdx((i) => (i + 1) % flashcards.length); setFcFlipped(false); }}>Berikutnya →</button>
          </div>
        </div>
      )}

      {/* LATIHAN TAB */}
      {tab === "latihan" && (
        mcqItems.length === 0 ? <div style={styles.empty}>Belum ada soal. Upload PDF dan generate dulu.</div> :
        latDone ? (
          <div>
            <div style={styles.scoreCard}>
              <div style={styles.bigNum(latCorrect / mcqItems.length >= 0.66)}>{Math.round((latCorrect / mcqItems.length) * 100)}%</div>
              <p style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>Skor Akhir</p>
              <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>{latCorrect} benar dari {mcqItems.length} soal</p>
            </div>
            <button style={styles.btn(false)} onClick={() => { setLatIdx(0); setLatCorrect(0); setLatAnswered(false); setLatSelected(null); setLatDone(false); }}>Ulangi Latihan</button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 8 }}>Soal {latIdx + 1} dari {mcqItems.length} · {latCorrect} benar</p>
            <div style={styles.card}>
              <div style={styles.vignette}>{mcqItems[latIdx].vignette}</div>
              <div style={styles.question}>{mcqItems[latIdx].question}</div>
              {mcqItems[latIdx].options.map((o, i) => {
                const state = latAnswered ? (i === mcqItems[latIdx].answer ? "correct" : i === latSelected ? "wrong" : "none") : "none";
                return <button key={i} style={styles.optBtn(state)} onClick={() => answerLatihan(i)} disabled={latAnswered}>{o}</button>;
              })}
              {latAnswered && <div style={styles.expl}><strong>Pembahasan:</strong> {mcqItems[latIdx].explanation}</div>}
            </div>
            <div style={styles.navRow}>
              <span />
              {latAnswered && <button style={styles.navBtn} onClick={latihanNext}>{latIdx + 1 < mcqItems.length ? "Soal berikutnya →" : "Lihat Skor"}</button>}
            </div>
          </div>
        )
      )}

      {/* UJIAN TAB */}
      {tab === "ujian" && (
        mcqItems.length === 0 ? <div style={styles.empty}>Belum ada soal. Upload PDF dan generate dulu.</div> :
        !ujianStarted ? (
          <div>
            <div style={styles.scoreCard}>
              <div style={{ fontSize: 40, fontWeight: 700 }}>{mcqItems.length}</div>
              <p style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>Soal tersedia</p>
              <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>Waktu: {mcqItems.length * 2} menit · Tanpa pembahasan saat ujian</p>
            </div>
            <button style={styles.btn(false)} onClick={startUjian}>Mulai Mode Ujian</button>
          </div>
        ) : ujianDone ? (
          <div>
            {(() => {
              const correct = mcqItems.filter((q, i) => ujianAnswers[i] === q.answer).length;
              const pct = Math.round((correct / mcqItems.length) * 100);
              return (
                <>
                  <div style={styles.scoreCard}>
                    <div style={styles.bigNum(pct >= 66)}>{pct}%</div>
                    <p style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>{pct >= 66 ? "LULUS" : "BELUM LULUS"} (batas kelulusan 66%)</p>
                    <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>{correct} benar dari {mcqItems.length} soal</p>
                  </div>
                  <p style={{ fontWeight: 600, marginBottom: 8 }}>Review per soal:</p>
                  {mcqItems.map((q, i) => {
                    const ok = ujianAnswers[i] === q.answer;
                    return (
                      <div key={i} style={{ ...styles.card, borderColor: ok ? "#86efac" : "#fca5a5", background: ok ? "#f0fdf4" : "#fef2f2", marginBottom: 8 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: ok ? "#16a34a" : "#dc2626" }}>Soal {i + 1}: {ok ? "Benar" : "Salah"}</p>
                        <p style={{ fontSize: 13, marginTop: 4 }}>{q.question}</p>
                        {!ok && <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Jawaban kamu: {ujianAnswers[i] !== null ? q.options[ujianAnswers[i]] : "Tidak dijawab"}<br />Benar: {q.options[q.answer]}<br />{q.explanation}</p>}
                      </div>
                    );
                  })}
                  <button style={styles.btn(false)} onClick={() => { setUjianStarted(false); setUjianDone(false); }}>Ulangi Ujian</button>
                </>
              );
            })()}
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <p style={{ fontSize: 13, color: "#9ca3af" }}>Soal {ujianIdx + 1} / {mcqItems.length}</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: timeLeft < 60 ? "#dc2626" : "#d97706" }}>{mins}:{secs}</p>
            </div>
            <div style={styles.card}>
              <div style={styles.vignette}>{mcqItems[ujianIdx].vignette}</div>
              <div style={styles.question}>{mcqItems[ujianIdx].question}</div>
              {mcqItems[ujianIdx].options.map((o, i) => (
                <button key={i} style={styles.optBtn(ujianAnswers[ujianIdx] === i ? "correct" : "none")} onClick={() => { const a = [...ujianAnswers]; a[ujianIdx] = i; setUjianAnswers(a); }}>{o}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {ujianIdx > 0 && <button style={{ ...styles.navBtn, flex: 1 }} onClick={() => setUjianIdx((x) => x - 1)}>← Sebelumnya</button>}
              {ujianIdx < mcqItems.length - 1
                ? <button style={{ ...styles.navBtn, flex: 1 }} onClick={() => setUjianIdx((x) => x + 1)}>Berikutnya →</button>
                : <button style={{ ...styles.navBtn, flex: 1, fontWeight: 600 }} onClick={() => { clearInterval(timerRef.current); setUjianDone(true); }}>Selesai & Lihat Skor</button>}
            </div>
          </div>
        )
      )}
    </div>
  );
}
