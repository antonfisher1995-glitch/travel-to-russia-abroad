import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Languages, Headphones, PenLine, Shuffle, Volume2, Search, RotateCcw, Check, X, Download, Upload, Menu, House, History, GraduationCap } from 'lucide-react';
import vocabulary from './data/vocabulary.json';

const STORE = 'russia-abroad-progress-v1';
const nav = [
  ['Dashboard','home'], ['Flashcards','cards'], ['Translate','translate'],
  ['Type Russian','typing'], ['Match','match'], ['Listening','listen'],
  ['Writing','writing'], ['Vocabulary','vocab'], ['Citizenship','citizenship'],
  ['History & Law','history'], ['Progress','progress']
];

function readSaved() {
  try { return JSON.parse(localStorage.getItem(STORE)) || { known: [], reviews: {}, history: [] }; }
  catch { return { known: [], reviews: {}, history: [] }; }
}
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ru-RU'; u.rate = 0.82;
  window.speechSynthesis.speak(u);
}
function normalize(s) { return (s || '').trim().toLocaleLowerCase('ru').replace(/[.!?]+$/,''); }

export default function App() {
  const [page,setPage] = useState('Dashboard');
  const [saved,setSaved] = useState(readSaved);
  const [index,setIndex] = useState(0);
  const [direction,setDirection] = useState('ru-en');
  const [revealed,setRevealed] = useState(false);
  const [typed,setTyped] = useState('');
  const [feedback,setFeedback] = useState('');
  const [query,setQuery] = useState('');
  const [topic,setTopic] = useState('all');
  const [matchSet,setMatchSet] = useState([]);
  const [selected,setSelected] = useState([]);
  const [matched,setMatched] = useState([]);
  const [writing,setWriting] = useState('');
  const [menuOpen,setMenuOpen] = useState(false);

  useEffect(() => { localStorage.setItem(STORE, JSON.stringify(saved)); }, [saved]);
  const filtered = useMemo(() => vocabulary.filter(w =>
    (topic === 'all' || w.topic === topic) &&
    (normalize(w.ru).includes(normalize(query)) || w.en.join(' ').toLowerCase().includes(query.toLowerCase()))
  ),[query,topic]);
  const word = filtered[index % Math.max(filtered.length,1)] || vocabulary[0];
  const answer = direction === 'ru-en' ? word.en.join('; ') : word.ru;
  const prompt = direction === 'ru-en' ? word.ru : word.en.join('; ');
  const topics = [...new Set(vocabulary.map(w=>w.topic))].sort();

  function record(id,correct) {
    setSaved(old => {
      const reviews = {...old.reviews};
      const prior = reviews[id] || { seen:0, correct:0, incorrect:0, nextReview:null };
      prior.seen++;
      if(correct) prior.correct++; else prior.incorrect++;
      prior.lastReviewed = new Date().toISOString();
      prior.nextReview = new Date(Date.now() + (correct ? 86400000*2 : 3600000)).toISOString();
      reviews[id] = prior;
      const known = correct ? [...new Set([...old.known,id])] : old.known.filter(x=>x!==id);
      return {...old,reviews,known,history:[...(old.history||[]),{id,correct,at:new Date().toISOString()}].slice(-1000)};
    });
  }
  function next() { setIndex(i=>(i+1)%Math.max(filtered.length,1)); setRevealed(false); setTyped(''); setFeedback(''); }
  function check() {
    const correct = normalize(typed) === normalize(answer) || (direction==='ru-en' && word.en.some(x=>normalize(typed)===normalize(x)));
    record(word.id,correct); setFeedback(correct ? 'Correct — отлично!' : `Not quite. Answer: ${answer}`);
  }
  function newMatch() {
    const set = [...vocabulary].sort(()=>Math.random()-.5).slice(0,5);
    setMatchSet(set); setSelected([]); setMatched([]);
  }
  useEffect(()=>{ if(page==='Match' && !matchSet.length) newMatch(); },[page]);
  function chooseMatch(side,id) {
    const nextSel=[...selected.filter(s=>s.side!==side),{side,id}];
    setSelected(nextSel);
    if(nextSel.length===2) {
      const [a,b]=nextSel;
      if(a.id===b.id && a.side!==b.side) setMatched(m=>[...m,a.id]);
      setTimeout(()=>setSelected([]),450);
    }
  }
  function exportProgress() {
    const blob=new Blob([JSON.stringify(saved,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a');
    a.href=url;a.download='travel-to-russia-progress.json';a.click();URL.revokeObjectURL(url);
  }
  function importProgress(e) {
    const file=e.target.files?.[0]; if(!file)return;
    const reader=new FileReader(); reader.onload=()=>{try{setSaved(JSON.parse(reader.result));}catch{alert('That backup file could not be read.');}};
    reader.readAsText(file);
  }

  return <div className="shell">
    <aside className={`sidebar ${menuOpen?'open':''}`}>
      <div className="brand"><div className="brandmark">ТР</div><div><strong>Travel to Russia</strong><small>ABROAD · RUSSIAN</small></div></div>
      <div className="nav-label">LEARNING</div>
      {nav.map(([label])=><button key={label} className={`nav-item ${page===label?'active':''}`} onClick={()=>{setPage(label);setMenuOpen(false);}}><span>{label==='Dashboard'?<House size={17}/>:label==='History & Law'?<History size={17}/>:label==='Citizenship'?<GraduationCap size={17}/>:label==='Vocabulary'?<BookOpen size={17}/>:label==='Listening'?<Headphones size={17}/>:label==='Writing'?<PenLine size={17}/>:<Languages size={17}/>}</span>{label}</button>)}
      <div className="sidebar-bottom"><span className="offline-dot"></span> Ready for offline study <small>Progress stored on this device</small></div>
    </aside>
    <main className="main">
      <header className="topbar"><button className="icon-btn mobile-menu" onClick={()=>setMenuOpen(!menuOpen)}><Menu/></button><div><span className="eyebrow">RUSSIAN FROM ENGLISH</span><h1>{page}</h1></div><div className="top-actions"><span className="pill">A1 · BEGINNER</span><button className="icon-btn" title="Export progress" onClick={exportProgress}><Download size={18}/></button></div></header>
      {page==='Dashboard' && <section className="page">
        <div className="welcome"><div><span className="eyebrow light">ВАШ ПУТЬ НАЧИНАЕТСЯ ЗДЕСЬ</span><h2>Every word brings<br/>you closer to fluency.</h2><p>Build your Russian, one thoughtful practice at a time.</p><button className="white-btn" onClick={()=>setPage('Flashcards')}>Continue learning <span>→</span></button></div><div className="welcome-symbol">АБВ</div></div>
        <div className="stats"><Stat label="Words in library" value={vocabulary.length.toLocaleString()} note="Starter vocabulary" icon={<BookOpen/>}/><Stat label="Words marked known" value={saved.known.length} note="Your learned words" icon={<Check/>}/><Stat label="Practice answers" value={(saved.history||[]).length} note="Saved on this device" icon={<Languages/>}/><Stat label="Study streak" value="—" note="Streak tracking planned" icon={<History/>}/></div>
        <div className="section-head"><div><span className="eyebrow">YOUR LEARNING PATH</span><h2>Pick up where you left off</h2></div></div>
        <div className="mode-grid">{[['Flashcards','Flip, recall, and strengthen vocabulary.','cards'],['Translate','Switch between English and Russian.','translate'],['Type Russian','Practice Cyrillic spelling from memory.','typing'],['Match','Connect Russian words with meanings.','match']].map(([name,desc,icon])=><button className="mode-card" key={name} onClick={()=>setPage(name)}><div className="mode-icon">{icon==='cards'?<BookOpen/>:icon==='translate'?<Languages/>:icon==='typing'?<PenLine/>:<Shuffle/>}</div><h3>{name}</h3><p>{desc}</p><span className="card-arrow">Start practice ↗</span></button>)}</div>
        <div className="notice"><strong>Learning library in progress</strong><p>This starter includes {vocabulary.length} curated entries to prove the app workflow. The data format is ready to grow into thousands of reviewed entries and full course packs.</p></div>
      </section>}
      {page==='Flashcards' && <section className="page narrow"><div className="toolbar"><span>{index+1} / {filtered.length} cards</span><select value={topic} onChange={e=>{setTopic(e.target.value);setIndex(0);}}><option value="all">All topics</option>{topics.map(t=><option key={t}>{t}</option>)}</select><button className="quiet-btn" onClick={()=>setDirection(d=>d==='ru-en'?'en-ru':'ru-en')}>⇄ {direction==='ru-en'?'RU → EN':'EN → RU'}</button></div><div className="flashcard"><span className="eyebrow">{word.topic} · {word.level}</span><button className="sound" onClick={()=>speak(word.ru)} aria-label="Play Russian pronunciation"><Volume2/></button><div className="flash-prompt">{prompt}</div><div className="flash-sub">{direction==='ru-en'?'Translate into English':'Translate into Russian'}</div>{revealed&&<div className="reveal"><strong>{answer}</strong><small>{word.partOfSpeech}</small></div>}<button className="primary-btn" onClick={()=>setRevealed(!revealed)}>{revealed?'Hide answer':'Reveal answer'}</button></div><div className="review-actions"><button className="outline-btn" onClick={()=>{record(word.id,false);next();}}>Need practice</button><button className="success-btn" onClick={()=>{record(word.id,true);next();}}>I knew it ✓</button></div><div className="center"><button className="text-btn" onClick={next}>Skip card →</button></div></section>}
      {(page==='Translate'||page==='Type Russian') && <section className="page narrow"><div className="exercise-card"><span className="eyebrow">ACTIVE RECALL</span><div className="prompt-word">{page==='Type Russian'?word.en.join('; '):prompt}</div><p>{page==='Type Russian'?'Type the Russian word or phrase':'Translate this prompt'}</p><div className="input-row"><input autoFocus value={typed} onChange={e=>{setTyped(e.target.value);setFeedback('');}} onKeyDown={e=>e.key==='Enter'&&check()} placeholder={page==='Type Russian'?'Введите слово по-русски':'Your translation'} /><button className="primary-btn" onClick={check}>Check</button></div>{feedback&&<div className={`feedback ${feedback.startsWith('Correct')?'good':'bad'}`}>{feedback}</div>}<button className="text-btn" onClick={()=>{setDirection(d=>d==='ru-en'?'en-ru':'ru-en');setTyped('');setFeedback('');}}>Switch direction ⇄</button><button className="text-btn" onClick={next}>Next question →</button></div></section>}
      {page==='Match' && <section className="page"><div className="match-intro"><p>Choose a Russian word and its English meaning. Match all five pairs.</p><button className="outline-btn" onClick={newMatch}><RotateCcw size={15}/> New round</button></div><div className="match-grid">{['ru','en'].map(side=><div className="match-column" key={side}><h3>{side==='ru'?'РУССКИЙ':'ENGLISH'}</h3>{[...matchSet].sort((a,b)=>side==='ru'?a.ru.localeCompare(b.ru):a.en[0].localeCompare(b.en[0])).map(w=><button key={w.id} disabled={matched.includes(w.id)} className={`match-tile ${matched.includes(w.id)?'matched':''} ${selected.some(s=>s.id===w.id)?'selected':''}`} onClick={()=>chooseMatch(side,w.id)}>{side==='ru'?w.ru:w.en[0]}</button>)}</div>)}</div>{matched.length===5&&<div className="feedback good">Excellent! All pairs matched. <button onClick={newMatch}>Play again</button></div>}</section>}
      {page==='Listening' && <section className="page narrow"><div className="exercise-card"><span className="eyebrow">LISTEN & UNDERSTAND</span><h2>What did you hear?</h2><p>Play the Russian prompt, then enter its English meaning.</p><button className="listen-button" onClick={()=>speak(word.ru)}><Volume2 size={22}/> Play Russian audio</button><div className="input-row"><input value={typed} onChange={e=>setTyped(e.target.value)} onKeyDown={e=>e.key==='Enter'&&check()} placeholder="Type the meaning in English"/><button className="primary-btn" onClick={check}>Check</button></div>{feedback&&<div className={`feedback ${feedback.startsWith('Correct')?'good':'bad'}`}>{feedback}</div>}<button className="text-btn" onClick={next}>Next audio prompt →</button><p className="muted">Audio currently uses your browser's Russian text-to-speech voice. Recorded audio packs can be added later.</p></div></section>}
      {page==='Writing' && <section className="page narrow"><div className="exercise-card"><span className="eyebrow">WRITE IN RUSSIAN</span><h2>Make a sentence</h2><p>Write a sentence using <strong>{word.ru}</strong> ({word.en[0]}). Try to write at least 5 words.</p><textarea rows="5" value={writing} onChange={e=>setWriting(e.target.value)} placeholder="Напишите предложение по-русски…"/><div className="writing-footer"><span>{writing.trim()?writing.trim().split(/\s+/).length:0} words</span><button className="primary-btn" onClick={()=>{setFeedback(writing.trim().split(/\s+/).length>=5?'Saved for your practice history.':'Try writing a little more — aim for 5 words.');}}>Save practice</button></div>{feedback&&<div className="feedback">{feedback}</div>}<p className="muted">This starter saves a practice note locally. Grammar-aware correction is a planned module.</p></div></section>}
      {page==='Vocabulary' && <section className="page"><div className="vocab-tools"><div className="searchbox"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search Russian or English…"/></div><select value={topic} onChange={e=>setTopic(e.target.value)}><option value="all">All topics</option>{topics.map(t=><option key={t}>{t}</option>)}</select><span className="muted">{filtered.length} entries</span></div><div className="table-wrap"><table><thead><tr><th>Russian</th><th>English</th><th>Part of speech</th><th>Topic</th><th>Audio</th></tr></thead><tbody>{filtered.slice(0,250).map(w=><tr key={w.id}><td className="russian">{w.ru}</td><td>{w.en.join('; ')}</td><td>{w.partOfSpeech}</td><td><span className="tag">{w.topic}</span></td><td><button className="mini-btn" onClick={()=>speak(w.ru)}><Volume2 size={16}/></button></td></tr>)}</tbody></table></div>{filtered.length>250&&<p className="muted">Showing first 250 matches. Refine your search to find more.</p>}</section>}
      {page==='Citizenship' && <section className="page"><div className="notice"><strong>Citizenship exam study area</strong><p>This is a structured placeholder for a verified, updatable exam-preparation course. It is not an official exam or legal advice. Confirm current requirements with an authorized Russian examination center.</p></div><div className="course-grid">{[['Russian language','Vocabulary, grammar, reading, listening, writing, and speaking.'],['Russian history','Chronology, key events, people, and practice questions.'],['Fundamentals of law','Constitutional concepts, citizenship, rights, and responsibilities.']].map(([t,d])=><article className="course-card" key={t}><span className="course-icon"><GraduationCap/></span><h3>{t}</h3><p>{d}</p><span className="tag">Course pack planned</span></article>)}</div></section>}
      {page==='History & Law' && <section className="page"><div className="notice"><strong>History and law curriculum</strong><p>Course content is designed to be loaded from reviewed lesson packs rather than hard-coded into the app.</p></div><div className="timeline">{['Early Slavic peoples and Kievan Rus','Moscow and the formation of the Russian state','The Russian Empire and major reforms','The 1917 Revolution and Soviet period','World War II and postwar history','The dissolution of the USSR and contemporary history','Constitutional structure and citizenship fundamentals'].map((t,i)=><div className="timeline-item" key={t}><span>{String(i+1).padStart(2,'0')}</span><div><h3>{t}</h3><p>Lesson reading, key terms, knowledge check, and review questions will be included in this unit.</p></div></div>)}</div></section>}
      {page==='Progress' && <section className="page"><div className="stats"><Stat label="Marked known" value={saved.known.length} note={`of ${vocabulary.length} starter entries`} icon={<Check/>}/><Stat label="Answered" value={(saved.history||[]).length} note="Practice events saved" icon={<BookOpen/>}/><Stat label="Correct" value={(saved.history||[]).filter(x=>x.correct).length} note="Recorded correct answers" icon={<Check/>}/><Stat label="Needs review" value={Object.values(saved.reviews||{}).filter(x=>x.incorrect>x.correct).length} note="Words with more misses" icon={<RotateCcw/>}/></div><div className="progress-panel"><h2>Backup and restore</h2><p>Progress is stored in this browser on this device. Export a backup before clearing browser data.</p><div className="button-row"><button className="primary-btn" onClick={exportProgress}><Download size={16}/> Export progress</button><label className="outline-btn upload-btn"><Upload size={16}/> Import backup<input type="file" accept="application/json" onChange={importProgress}/></label><button className="danger-btn" onClick={()=>{if(confirm('Clear all local progress? Export a backup first if you want to keep it.'))setSaved({known:[],reviews:{},history:[]});}}>Reset progress</button></div></div></section>}
      <footer className="footer">Travel to Russia Abroad <span>·</span> Learning progress stays in this browser <span>·</span> Starter edition</footer>
    </main>
  </div>;
}
function Stat({label,value,note,icon}) { return <div className="stat"><div className="stat-top"><span>{label}</span><i>{icon}</i></div><strong>{value}</strong><small>{note}</small></div>; }
