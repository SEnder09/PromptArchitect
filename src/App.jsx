import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Camera, 
  Sun, 
  User, 
  Palette, 
  Copy, 
  RotateCcw, 
  Layers, 
  Check,
  ChevronDown,
  Sparkles,
  Zap,
  ImageIcon,
  Loader2,
  Download,
  X,
  Upload,
  Image as ImageLucide,
  Search,
  Grid3X3,
  Wand2,
  Maximize2,
  Focus,
  Volume2,
  BrainCircuit,
  Eye,
  Share2,
  Cloud,
  Settings2,
  Info
} from 'lucide-react';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

// Firebase Configuration from environment
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

const apiKey = ""; // Environment provides key at runtime

// Categories mapped to their icons and labels
const FIELD_CONFIG = {
  shotType: { icon: <Focus className="w-4 h-4" />, label: "Shot Type & Angle" },
  source: { icon: <Sun className="w-4 h-4" />, label: "Lighting Source" },
  mood: { icon: <Sparkles className="w-4 h-4" />, label: "Atmosphere & Mood" },
  body: { icon: <Camera className="w-4 h-4" />, label: "Camera Body" },
  lens: { icon: <Maximize2 className="w-4 h-4" />, label: "Lens Type" },
  film: { icon: <ImageLucide className="w-4 h-4" />, label: "Film Stock" },
  photographer: { icon: <User className="w-4 h-4" />, label: "Photographer Style" },
  movie: { icon: <Palette className="w-4 h-4" />, label: "Movie Aesthetic" },
};

const DATA = {
  SUBJECT: {
    label: '01. SUBJECT & FRAMING',
    icon: <User className="w-5 h-5 text-blue-400" />,
    fields: [
      { id: 'description', label: 'Subject & Action', type: 'textarea', placeholder: 'e.g. A woman in a trench coat checking her phone...', hasAi: true },
      { id: 'environment', label: 'Environment', type: 'textarea', placeholder: 'e.g. at a rainy London bus stop at night...', hasAi: true },
      { id: 'shotType', label: 'Shot Type / Angle', type: 'visual-modal', category: 'angle', options: [
        "BIRD'S-EYE VIEW", "CLOSE UP", "CUTAWAY SHOT", "COWBOY-SHOT", "DUTCH ANGLE", 
        "ENTIRE BODY", "ESTABLISHING SHOT", "EXTREME CLOSE UP", "GROUP SHOT", "HEADSHOT", 
        "HIGH ANGLE SHOT", "INSERT SHOT", "LOW ANGLE SHOT", "MEDIUM SHOT", 
        "OVER THE SHOULDER SHOT", "OVERHEAD SHOT", "POINT OF VIEW SHOT", "REACTION SHOT", 
        "REVERSE SHOT", "THREE QUARTER BODY", "TIGHT HEADSHOT", "TWO-SHOT", "UPPER BODY", 
        "WORM'S-EYE VIEW", "WIDE SHOT"
      ]}
    ]
  },
  LIGHTING: {
    label: '02. LIGHTING & MOOD',
    icon: <Sun className="w-5 h-5 text-yellow-400" />,
    fields: [
      { id: 'source', label: 'Lighting Source', type: 'visual-modal', category: 'lighting', options: [
        "BACKLIGHTING", "BOUNCE LIGHTING", "BROAD LIGHTING", "CANDLELIGHT", 
        "CHIAROSCURO", "COLOR GELS", "GOBO LIGHTING", "HARD LIGHTING", 
        "HIGH KEY", "KEY LIGHTING", "MOTIVATED", "LOOP LIGHTING", 
        "NEON LIGHTING", "OVERCAST", "PARAMOUNT", "PRACTICAL", 
        "REMBRANDT", "SILHOUETTE", "SOFT LIGHTING", "SPLIT LIGHTING", 
        "THREE POINT", "TOP LIGHTING", "UNDERLIGHTING", "VOLUMETRIC"
      ]},
      { id: 'mood', label: 'Atmosphere / Mood', type: 'visual-modal', category: 'mood', options: [
        "Cinematic", "Moody", "Melancholic", "Ethereal", "Cyberpunk", "Vintage",
        "Dreamy", "Gritty", "Romantic", "Minimalist", "Surreal", "Noir"
      ]}
    ]
  },
  CAMERA: {
    label: '03. CAMERA GEAR',
    icon: <Camera className="w-5 h-5 text-emerald-400" />,
    fields: [
      { id: 'body', label: 'Camera Body', type: 'visual-modal', category: 'camera', options: [
        "ARRI ALEXA 65", "RED DIGITAL", "SONY VENICE", "PANAVISION", 
        "AATON XTR", "BOLEX H16", "CANON EOS 5D", "SONY FX6", "SONY FX3", "HASSELBLAD X1D", 
        "FUJIFILM X-T4", "LEICA Q2", "VHS CAMERA", "ARGUS C3", "CANON AE-1", 
        "CONTAX T2", "DIANA F+", "HASSELBLAD 500CM", "HOLGA 120N", "KODAK BROWNIE", 
        "LEICA M3", "MAMIYA RB67", "NIKON F2", "NIKON FM2", "OLYMPUS OM-1", "PENTAX K1000", 
        "POLAROID 600", "POLAROID SX-70"
      ]},
      { id: 'lens', label: 'Lens Type', type: 'visual-modal', category: 'lens', options: [
        "8mm Fisheye", "Anamorphic", "Catadioptric", "Fisheye", 
        "Helios 44-2", "Macro Lens", "Petzvál", "Soft-focus", 
        "Tilt-Shift", "Toy Plastic", "Voigtländer 50mm"
      ]},
      { id: 'resolution', label: 'Output Resolution', type: 'select', options: [
        "Standard (1024x1024)", "HD (1920x1080)", "Portrait HD (1080x1920)", "Ultrawide (2560x1080)", "4K UHD (3840x2160)"
      ]},
      { id: 'aspect', label: 'Aspect Ratio', type: 'select', options: [
        "1:1", "3:4", "4:3", "9:16", "16:9", "21:9"
      ]}
    ]
  },
  STYLE: {
    label: '04. STYLE & AESTHETICS',
    icon: <Palette className="w-5 h-5 text-purple-400" />,
    fields: [
      { id: 'film', label: 'Film Stock', type: 'visual-modal', category: 'film', options: [
        "AGFA VISTA", "CINESTILL 50D", "EKTAR 100", "FUJI ACROS", "FUJI PRO 400H", 
        "FUJI SUPERIA", "FUJICOLOR PRO", "ILFORD DELTA", "ILFORD HP5", 
        "ILFORD XP2", "KODACHROME 64", "KODAK GOLD", "KODAK TRI-X", 
        "KODAK ULTRAMAX"
      ]},
      { id: 'photographer', label: 'Photographer Style', type: 'visual-modal', category: 'style', options: [
        "Alberto Seveso", "Alec Soth", "Alen Palander", "Alex Strohl", "Alex Webb", 
        "Alfred Stieglitz", "Ando Fuchs", "Andreas Gursky", "Anne Brigman", "Annie Leibovitz", 
        "Ansel Adams", "August Sander", "Barbara Kruger", "Bernd & Hilla Becher", 
        "Bill Brandt", "Brandon Woelfel", "Bryan Schutmaat", "Chris Burkard", "Chris Friel", 
        "Cindy Sherman", "Daido Moriyama", "David LaChapelle", "David Yarrow", "Dorothea Lange", 
        "Elliott Erwitt", "Eugène Atget", "Fan Ho", "Garry Winogrand", "George Hurrell", 
        "Gregory Crewdson", "Guy Bourdin", "Helmut Newton", "Henri Cartier-Bresson"
      ]},
      { id: 'movie', label: 'Movie Look', type: 'visual-modal', category: 'movie', options: [
        "Blade Runner", "Conan", "Crouching Tiger", "Dark City", 
        "Days of Heaven", "District 9", "Drive", "Dune", "Enter the Void", "Eraserhead", 
        "Fight Club", "Game of Thrones", "Ghostbusters", "Godzilla", "Grease", 
        "Halloween", "Hereditary", "In the Mood for Love", "John Wick", "Joker", 
        "Jurassic Park", "Kill Bill", "La La Land", "Life of Pi", "Lost in Translation", 
        "Mad Max", "Metropolis", "Midsommar", "Minority Report", 
        "No Country", "Nope", "Nosferatu", "O Brother", 
        "Oblivion", "Pan's Labyrinth", "Parasite", "Psycho", "Roma", "Saving Private Ryan", 
        "Sicario", "Sin City", "Skyfall", "Squid Game", "Stalker", "Stranger Things", 
        "Suspiria", "Terminator 2", "The Dark Knight"
      ]}
    ]
  }
};

const ELEMENTS_TYPES = ['CHARACTER', 'OUTFIT', 'OBJECT', 'SCENE'];

// Helper for PCM to WAV conversion for TTS
const pcmToWav = (pcmData, sampleRate) => {
  const buffer = new ArrayBuffer(44 + pcmData.length * 2);
  const view = new DataView(buffer);
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 32 + pcmData.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, pcmData.length * 2, true);
  for (let i = 0; i < pcmData.length; i++) {
    view.setInt16(44 + i * 2, pcmData[i], true);
  }
  return new Blob([buffer], { type: 'audio/wav' });
};

// Helper to construct prompts for reference generation
const getReferencePrompt = (option, category) => {
  switch (category) {
    case 'lighting': return `A professional photograph demonstrating ${option} lighting technique, studio photography`;
    case 'mood': return `A cinematic atmospheric shot with a ${option} mood`;
    case 'camera': return `The specific visual texture and color of a photograph taken with a ${option}`;
    case 'lens': return `Visual characteristics of a ${option}, showing depth of field and unique bokeh`;
    case 'film': return `A photo with the specific color profile and grain of ${option} film stock`;
    case 'style': return `Artistic photography in the signature style of ${option}`;
    case 'movie': return `A cinematic film still in the color grading and aesthetic of ${option}`;
    case 'angle': return `Compositional camera angle: ${option}`;
    default: return `A visual example of ${option}`;
  }
};

const getPlaceholderUrl = (text, type) => {
  const bg = type === 'lighting' ? '1a1a1a' : type === 'camera' ? '0f172a' : type === 'style' ? '2a1b2e' : '111';
  return `https://placehold.co/600x400/${bg}/FFF?text=${encodeURIComponent(text)}&font=montserrat`;
};

// Modal Selection Component
const VisualModalSelector = ({ 
  fieldId, 
  options, 
  value, 
  onChange, 
  category, 
  previewLibrary, 
  onGeneratePreview 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingMap, setLoadingMap] = useState({});
  const config = FIELD_CONFIG[fieldId];

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleGenerate = async (e, opt) => {
    e.stopPropagation();
    if (loadingMap[opt]) return;
    setLoadingMap(prev => ({ ...prev, [opt]: true }));
    try {
      await onGeneratePreview(opt, category);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMap(prev => ({ ...prev, [opt]: false }));
    }
  };

  const selectedThumbnail = previewLibrary[value];

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">{config.label}</label>
      
      <button 
        onClick={() => setIsOpen(true)}
        className={`w-full group relative flex items-center justify-between p-3 rounded-lg border transition-all ${
          value 
          ? 'bg-neutral-900 border-indigo-500/50 text-white' 
          : 'bg-black border-neutral-800 text-neutral-500 hover:border-neutral-600'
        }`}
      >
        <div className="flex items-center gap-3">
          {selectedThumbnail ? (
            <img src={selectedThumbnail} alt="Thumbnail" className="w-8 h-8 rounded object-cover border border-neutral-700" />
          ) : (
            <div className={`p-1.5 rounded bg-neutral-800 ${value ? 'text-indigo-400' : 'text-neutral-600'}`}>
              {config.icon}
            </div>
          )}
          <span className="text-sm font-semibold truncate max-w-[150px]">
            {value || `Select ${config.label}...`}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          <div className="relative w-full max-w-5xl bg-[#111] border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-indigo-600 rounded-lg text-white">
                  {config.icon}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tighter">Choose {config.label}</h3>
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">{options.length} presets</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-neutral-800 rounded-full transition-colors text-neutral-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 border-b border-neutral-800 bg-black/20">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600" />
                <input 
                  autoFocus
                  type="text" 
                  placeholder={`Search for styles...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-xl pl-12 pr-4 py-4 text-sm font-medium text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-neutral-700"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { onChange(opt); setIsOpen(false); }}
                    className={`group relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all flex flex-col ${
                      value === opt 
                        ? 'border-indigo-500 ring-4 ring-indigo-500/20 scale-[1.02]' 
                        : 'border-neutral-800 hover:border-neutral-600'
                    }`}
                  >
                    <img 
                      src={previewLibrary[opt] || getPlaceholderUrl(opt, category)}
                      alt={opt}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                        previewLibrary[opt] ? 'opacity-100' : 'opacity-40 grayscale group-hover:opacity-60'
                      }`} 
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-4 flex flex-col justify-end">
                      <span className={`text-[10px] font-black uppercase tracking-wider leading-tight line-clamp-2 ${
                        value === opt ? 'text-white' : 'text-neutral-400 group-hover:text-white'
                      }`}>
                        {opt}
                      </span>
                    </div>

                    {value === opt && (
                      <div className="absolute top-2 right-2 bg-indigo-600 rounded-full p-1 shadow-lg z-10">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}

                    <div 
                      onClick={(e) => handleGenerate(e, opt)}
                      className="absolute top-2 left-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                       <div className="bg-black/80 hover:bg-indigo-600 backdrop-blur-md p-2 rounded-lg border border-neutral-700 transition-colors cursor-pointer">
                         {loadingMap[opt] ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Wand2 className="w-4 h-4 text-white" />}
                       </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [previewLibrary, setPreviewLibrary] = useState({});
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [error, setError] = useState(null);
  const [referenceImages, setReferenceImages] = useState({}); 
  const [isAiProcessing, setIsAiProcessing] = useState({}); 
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null); 
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef(null);
  const [activeUploadType, setActiveUploadType] = useState(null);

  // Initialize Auth
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Fetch Saved Data
  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'studio_state');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.referenceImages) setReferenceImages(data.referenceImages);
        if (data.previewLibrary) setPreviewLibrary(data.previewLibrary);
        if (data.formData) setFormData(data.formData);
      }
    }, (err) => console.error("Firestore Error:", err));
    return () => unsubscribe();
  }, [user]);

  // Save Data on Changes
  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'studio_state');
        await setDoc(docRef, {
          referenceImages,
          previewLibrary,
          formData,
          lastUpdated: Date.now()
        }, { merge: true });
      } catch (err) {
        console.error("Save Error:", err);
      } finally {
        setIsSaving(false);
      }
    }, 2000); // Debounce saves
    return () => clearTimeout(timer);
  }, [user, referenceImages, previewLibrary, formData]);

  const handleInputChange = (fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const resetPrompt = () => {
    setFormData({});
    setReferenceImages({});
  };

  const generatedPrompt = useMemo(() => {
    const parts = [];
    if (formData.description) parts.push(formData.description);
    if (formData.shotType) parts.push(`${formData.shotType} angle`);
    if (formData.environment) parts.push(`located in ${formData.environment}`);
    if (formData.source) parts.push(`${formData.source} lighting`);
    if (formData.mood) parts.push(`mood: ${formData.mood}`);
    if (formData.body) parts.push(`shot on ${formData.body}`);
    if (formData.lens) parts.push(`${formData.lens}`);
    if (formData.film) parts.push(`${formData.film} film stock`);
    if (formData.photographer) parts.push(`by ${formData.photographer}`);
    if (formData.movie) parts.push(`aesthetic of ${formData.movie}`);
    
    // Add Resolution Technical Metadata to prompt
    if (formData.resolution) parts.push(`high resolution ${formData.resolution}`);
    
    let promptStr = parts.filter(p => p).join(', ');
    if (formData.aspect) promptStr += ` --ar ${formData.aspect}`;
    return promptStr || "";
  }, [formData]);

  const callGeminiText = async (prompt, systemPrompt = "You are an expert AI image prompt engineer.", responseType = "text") => {
    const callWithRetry = async (retries = 5, delay = 1000) => {
      try {
        const payload = {
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] }
        };
        if (responseType === "json") payload.generationConfig = { responseMimeType: "application/json" };
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Gemini Text API error');
        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        return responseType === "json" ? JSON.parse(text) : text;
      } catch (err) {
        if (retries > 0) {
          await new Promise(r => setTimeout(r, delay));
          return callWithRetry(retries - 1, delay * 2);
        }
        throw err;
      }
    };
    return await callWithRetry();
  };

  const callGeminiTTS = async (textToSay) => {
    setIsPlayingAudio(true);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Say professionally and creatively: ${textToSay}` }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } } }
          }
        })
      });
      const result = await response.json();
      const pcmBase64 = result.candidates[0].content.parts[0].inlineData.data;
      const mimeType = result.candidates[0].content.parts[0].inlineData.mimeType;
      const sampleRate = parseInt(mimeType.match(/rate=(\d+)/)?.[1] || "24000", 10);
      const pcmBuffer = Uint8Array.from(atob(pcmBase64), c => c.charCodeAt(0));
      const pcmInt16 = new Int16Array(pcmBuffer.buffer);
      const wavBlob = pcmToWav(pcmInt16, sampleRate);
      const audio = new Audio(URL.createObjectURL(wavBlob));
      audio.onended = () => setIsPlayingAudio(false);
      audio.play();
    } catch (err) {
      console.error(err);
      setIsPlayingAudio(false);
    }
  };

  const enhanceSubject = async () => {
    if (!formData.description) return;
    setIsAiProcessing(prev => ({ ...prev, description: true }));
    try {
      const enhanced = await callGeminiText(
        `Expand this subject: "${formData.description}". Focus on textures and colors. Under 50 words.`,
        "Expert prompt engineer."
      );
      handleInputChange('description', enhanced.trim());
    } catch (err) { console.error(err); } 
    finally { setIsAiProcessing(prev => ({ ...prev, description: false })); }
  };

  const suggestEnvironment = async () => {
    if (!formData.description) return;
    setIsAiProcessing(prev => ({ ...prev, environment: true }));
    try {
      const env = await callGeminiText(
        `Suggest an environment for: "${formData.description}".`,
        "Creative director."
      );
      handleInputChange('environment', env.trim());
    } catch (err) { console.error(err); } 
    finally { setIsAiProcessing(prev => ({ ...prev, environment: false })); }
  };

  const smartArchitect = async () => {
    if (!formData.description) return;
    setIsAiProcessing(prev => ({ ...prev, smart: true }));
    try {
      const result = await callGeminiText(
        `Choose best values for: "${formData.description}". JSON with keys: shotType, source, mood, body, lens, film, photographer, movie.`,
        "Cinematographer.",
        "json"
      );
      setFormData(prev => ({ ...prev, ...result }));
    } catch (err) { console.error(err); } 
    finally { setIsAiProcessing(prev => ({ ...prev, smart: false })); }
  };

  const copyToClipboard = () => {
    const textArea = document.createElement("textarea");
    textArea.value = generatedPrompt;
    document.body.appendChild(textArea);
    textArea.select();
    try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch (err) { console.error(err); }
    document.body.removeChild(textArea);
  };

  const callGeminiImageApi = async (promptText, references = [], retries = 3, delay = 1000) => {
    try {
      const parts = [{ text: promptText }];
      references.forEach(ref => {
        parts.push({ inlineData: { mimeType: ref.mimeType, data: ref.data } });
      });
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
        })
      });
      if (!response.ok) throw new Error('Generation failed');
      const result = await response.json();
      const base64 = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      if (!base64) throw new Error('No image data');
      return `data:image/png;base64,${base64}`;
    } catch (err) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, delay));
        return callGeminiImageApi(promptText, references, retries - 1, delay * 2);
      }
      throw err;
    }
  };

  const generateImage = async () => {
    if (!generatedPrompt || isGenerating) return;
    setIsGenerating(true);
    setError(null);
    try {
      const imageUrl = await callGeminiImageApi(generatedPrompt, Object.values(referenceImages));
      const newResult = { 
        url: imageUrl, 
        prompt: generatedPrompt, 
        id: Date.now(),
        settings: { ...formData } // Store properties of THIS specific image
      };
      setGeneratedImages(prev => [newResult, ...prev]);
      setSelectedResult(newResult); 
    } catch (err) {
      setError("Failed to generate image.");
    } finally { setIsGenerating(false); }
  };

  const onGeneratePreview = async (option, category) => {
    const prompt = getReferencePrompt(option, category);
    const imageUrl = await callGeminiImageApi(prompt);
    setPreviewLibrary(prev => ({ ...prev, [option]: imageUrl }));
    return imageUrl;
  };

  const triggerUpload = (type) => { setActiveUploadType(type); fileInputRef.current?.click(); };
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !activeUploadType) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setReferenceImages(prev => ({ ...prev, [activeUploadType]: { data: reader.result.split(',')[1], preview: reader.result, mimeType: file.type } }));
      setActiveUploadType(null);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-300 font-sans p-4 md:p-8">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

      {/* Render Preview Window Modal */}
      {selectedResult && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="absolute inset-0 pointer-events-auto" onClick={() => setSelectedResult(null)} />
           <div className="relative w-full max-w-6xl bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(79,70,229,0.2)] flex flex-col md:flex-row max-h-[90vh] animate-in zoom-in-95 duration-300">
             
             {/* Large Image View */}
             <div className="flex-[3] relative bg-black group overflow-hidden">
                <img src={selectedResult.url} alt="Result" className="w-full h-full object-contain" />
                <div className="absolute top-4 left-4 flex gap-2">
                  <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/10">
                    {selectedResult.settings.resolution || "4K Final Render"}
                  </div>
                </div>
             </div>

             {/* Sidebar Details */}
             <div className="flex-1 p-8 border-l border-neutral-800 flex flex-col bg-neutral-900/50 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800">
                <div className="space-y-8 pb-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Preview Render</h3>
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Architect Studio v1.0</p>
                    </div>
                    <button onClick={() => setSelectedResult(null)} className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
                      <X className="w-6 h-6 text-neutral-500 hover:text-white" />
                    </button>
                  </div>

                  {/* Composition Properties */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-indigo-400">
                      <Settings2 className="w-4 h-4" />
                      <span className="text-xs font-black uppercase tracking-widest">Properties</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {Object.entries(selectedResult.settings).map(([key, value]) => {
                        if (!value || key === 'description' || key === 'environment') return null;
                        const label = FIELD_CONFIG[key]?.label || key.charAt(0).toUpperCase() + key.slice(1);
                        return (
                          <div key={key} className="flex justify-between items-center p-2 bg-black/40 rounded-lg border border-neutral-800/50">
                            <span className="text-[9px] font-black text-neutral-500 uppercase">{label}</span>
                            <span className="text-[10px] font-bold text-white truncate max-w-[120px]">{value}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-indigo-400">
                      <Zap className="w-4 h-4 fill-indigo-400" />
                      <span className="text-xs font-black uppercase tracking-widest">Metadata</span>
                    </div>
                    <div className="p-4 bg-black/40 rounded-2xl border border-neutral-800/50">
                      <p className="text-sm font-medium text-neutral-300 italic leading-relaxed">"{selectedResult.prompt}"</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Export Actions</span>
                    <div className="grid grid-cols-2 gap-3">
                       <a 
                        href={selectedResult.url} 
                        download={`render-${selectedResult.id}.png`}
                        className="flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 text-black py-3 rounded-xl font-black text-[10px] uppercase transition-all shadow-lg"
                       >
                          <Download className="w-4 h-4" /> Download
                       </a>
                       <button 
                        onClick={() => callGeminiTTS(selectedResult.prompt)} 
                        className="flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white py-3 rounded-xl font-black text-[10px] uppercase transition-all"
                       >
                          <Volume2 className="w-4 h-4" /> Narrate
                       </button>
                    </div>
                  </div>
                </div>
             </div>
           </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto space-y-8 pb-20">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-neutral-900 pb-8">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.4)]">
              <Zap className="text-white fill-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">Studio Architect</h1>
              <div className="flex items-center gap-2 text-neutral-600 text-[10px] font-bold uppercase tracking-[0.3em]">
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Cloud className="w-3 h-3" />}
                {isSaving ? 'Syncing...' : 'Cloud Ready'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={smartArchitect} disabled={isAiProcessing.smart || !formData.description} className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-950 to-neutral-950 hover:from-indigo-600 hover:to-indigo-500 border border-indigo-500/30 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all disabled:opacity-50">
              {isAiProcessing.smart ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4 group-hover:scale-125 transition-transform" />}
              ✨ Smart Complete
            </button>
            <button onClick={resetPrompt} className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-xs font-bold uppercase tracking-widest transition-all">Reset</button>
            <button onClick={copyToClipboard} className="px-4 py-2 bg-neutral-900 border border-neutral-800 text-xs font-bold uppercase tracking-widest transition-all">{copied ? 'Copied' : 'Copy'}</button>
            <button disabled={!generatedPrompt || isGenerating} onClick={generateImage} className="flex items-center gap-2 px-8 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-900 disabled:text-neutral-700 text-white rounded-lg font-black uppercase tracking-tighter transition-all">
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Render Scene
            </button>
          </div>
        </header>

        {/* Live Prompt Output */}
        <div className="sticky top-6 z-40 bg-neutral-950/80 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Active Prompt String</span>
              <button onClick={() => callGeminiTTS(generatedPrompt)} disabled={!generatedPrompt || isPlayingAudio} className="p-1 hover:text-indigo-400 transition-colors disabled:opacity-50" title="Listen to prompt">
                {isPlayingAudio ? <Loader2 className="w-3 h-3 animate-spin text-indigo-400" /> : <Volume2 className="w-3 h-3" />}
              </button>
              <button onClick={copyToClipboard} disabled={!generatedPrompt} className="p-1 hover:text-indigo-400 transition-colors disabled:opacity-50" title="Copy prompt">
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            {error && <span className="text-[10px] font-bold text-red-500 uppercase">{error}</span>}
          </div>
          <div className="text-xl md:text-2xl font-bold text-white/90 leading-tight">
            {generatedPrompt || <span className="text-neutral-800 italic">Enter a subject to begin...</span>}
          </div>
        </div>

        {/* Gallery */}
        {generatedImages.length > 0 && (
          <div className="space-y-4">
             <div className="flex items-center gap-2">
               <ImageIcon className="w-4 h-4 text-neutral-600" />
               <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Render Gallery</span>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-500">
                {generatedImages.map((img, idx) => (
                  <div key={idx} className="group relative aspect-square rounded-2xl overflow-hidden shadow-2xl border border-neutral-900">
                    <img src={img.url} alt="Render" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-5">
                      <div className="absolute top-2 right-2 flex gap-2">
                        <a 
                          href={img.url} 
                          download={`render-${img.id}.png`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 bg-white rounded-full text-black shadow-xl hover:bg-neutral-200 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button onClick={() => setSelectedResult(img)} className="p-2 bg-indigo-600 rounded-full text-white shadow-xl hover:bg-indigo-500 transition-colors"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => setGeneratedImages(prev => prev.filter((_, i) => i !== idx))} className="p-2 bg-red-500 rounded-full text-white shadow-xl hover:bg-red-400 transition-colors"><X className="w-4 h-4" /></button>
                      </div>
                      <p className="text-[10px] text-white italic font-bold mb-4 line-clamp-3 leading-tight">"{img.prompt}"</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {Object.entries(DATA).map(([key, section]) => (
            <div key={key} className="bg-neutral-950 border border-neutral-900 rounded-3xl p-8 space-y-8">
              <div className="flex items-center gap-3 border-b border-neutral-900 pb-4">
                {section.icon}
                <h2 className="text-lg font-black text-white uppercase italic tracking-tighter">{section.label}</h2>
              </div>
              <div className="space-y-8">
                {section.fields.map(field => (
                  <div key={field.id}>
                    {field.type === 'textarea' ? (
                      <div className="space-y-2 relative">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">{field.label}</label>
                          {field.hasAi && (
                             <button onClick={field.id === 'description' ? enhanceSubject : suggestEnvironment} disabled={isAiProcessing[field.id] || !formData.description} className="text-[9px] font-black text-indigo-400 hover:text-white uppercase tracking-tighter flex items-center gap-1 transition-colors disabled:opacity-30">
                               {isAiProcessing[field.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                               ✨ AI {field.id === 'description' ? 'Enhance' : 'Architect'}
                             </button>
                          )}
                        </div>
                        <textarea rows={4} placeholder={field.placeholder} value={formData[field.id] || ''} onChange={(e) => handleInputChange(field.id, e.target.value)} className="w-full bg-black border border-neutral-900 rounded-xl p-4 text-sm text-neutral-200 focus:outline-none focus:border-indigo-500 transition-all resize-none" />
                      </div>
                    ) : field.type === 'visual-modal' ? (
                      <VisualModalSelector fieldId={field.id} options={field.options} value={formData[field.id]} onChange={(val) => handleInputChange(field.id, val)} category={field.category} previewLibrary={previewLibrary} onGeneratePreview={onGeneratePreview} />
                    ) : (
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">{field.label}</label>
                        <div className="relative">
                          <select value={formData[field.id] || ''} onChange={(e) => handleInputChange(field.id, e.target.value)} className="w-full bg-black border border-neutral-900 rounded-xl p-4 text-sm text-neutral-200 appearance-none focus:outline-none focus:border-indigo-500 cursor-pointer">
                            <option value="">Select Option</option>
                            {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-700" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Elements Section */}
        <div className="pt-8 border-t border-neutral-900">
          <div className="flex items-center gap-3 mb-8">
            <Layers className="text-pink-500 w-6 h-6" />
            <h2 className="text-lg font-black text-white uppercase italic tracking-tighter">05. VISUAL REFERENCES</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ELEMENTS_TYPES.map(type => (
              <div key={type} onClick={() => !referenceImages[type] && triggerUpload(type)} className={`group relative aspect-video rounded-3xl overflow-hidden cursor-pointer transition-all border-2 border-dashed ${referenceImages[type] ? 'border-indigo-500 shadow-xl' : 'border-neutral-900 bg-neutral-950 hover:border-pink-500/50'}`}>
                {referenceImages[type] ? (
                  <>
                    <img src={referenceImages[type].preview} alt={type} className="w-full h-full object-cover" />
                    <button onClick={(e) => { e.stopPropagation(); setReferenceImages(prev => { const n = {...prev}; delete n[type]; return n; }); }} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-8 h-8 text-red-500" />
                    </button>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
                    <div className="p-3 bg-neutral-900 rounded-full border border-neutral-800 group-hover:bg-pink-500 transition-colors"><Upload className="w-5 h-5 text-neutral-500 group-hover:text-white" /></div>
                    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{type}</span>
                  </div>
                )}
                <div className="absolute top-4 left-4 px-3 py-1 bg-black/80 rounded-full text-[8px] font-black text-white uppercase tracking-widest">{type}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;