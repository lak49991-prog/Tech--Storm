import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, Type, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { uploadFileToStorage, createDocumentRecord, createDocumentFromText, updateDocumentStatus, upsertConcept, linkDocumentConcept } from '@/services/data-service';
import { extractPdfText, cleanText, estimateStudyTime } from '@/lib/pdf';
import { mockAnalyzeDocument } from '@/services/ai-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';

const MAX_SIZE = 20 * 1024 * 1024;
const ACCEPTED = ['pdf', 'txt', 'docx'];

export default function UploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [pastedTitle, setPastedTitle] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');

  const validateFile = (file: File): string | null => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ACCEPTED.includes(ext)) return `Unsupported file type: .${ext}. Use PDF, TXT, or DOCX.`;
    if (file.size > MAX_SIZE) return 'File is too large. Maximum 20MB.';
    if (file.size === 0) return 'File is empty.';
    return null;
  };

  const processDocument = async (docId: string, text: string, title: string, pageCount?: number) => {
    setStage('Reading your document...');
    setProgress(20);
    const cleaned = cleanText(text);

    setStage('Understanding concepts...');
    setProgress(40);
    const analysis = await mockAnalyzeDocument(title, cleaned);

    setStage('Creating practice questions...');
    setProgress(60);
    for (const c of analysis.concepts) {
      const concept = await upsertConcept(c.name, c.description || '');
      await linkDocumentConcept(docId, concept.id, c.importance);
    }

    setStage('Building your learning profile...');
    setProgress(80);
    const estimated = estimateStudyTime(cleaned);

    await updateDocumentStatus(docId, 'ready', {
      summary: analysis.summary,
      page_count: pageCount || null,
      concept_count: analysis.concepts.length,
      estimated_minutes: estimated,
      text_content: cleaned,
    });

    setProgress(100);
    setStage('Your material is ready.');
    setTimeout(() => navigate(`/library/${docId}`), 800);
  };

  const handleFile = async (file: File) => {
    if (!user) return;
    const err = validateFile(file);
    if (err) { toast({ title: 'Upload failed', description: err, variant: 'destructive' }); return; }

    setProcessing(true);
    try {
      const storagePath = await uploadFileToStorage(user.id, file);
      const doc = await createDocumentRecord(user.id, file, storagePath);

      let text = '';
      let pageCount: number | undefined;
      if (file.name.toLowerCase().endsWith('.pdf')) {
        const result = await extractPdfText(file);
        text = result.text;
        pageCount = result.pageCount;
      } else {
        text = await file.text();
        pageCount = 1;
      }

      await processDocument(doc.id, text, doc.title, pageCount);
    } catch (e) {
      toast({ title: 'Upload failed', description: 'We couldn\'t read this document.', variant: 'destructive' });
      setProcessing(false);
    }
  };

  const handlePaste = async () => {
    if (!user || !pastedText.trim()) return;
    setProcessing(true);
    try {
      const title = pastedTitle.trim() || 'Pasted Text';
      const doc = await createDocumentFromText(user.id, title, pastedText);
      await processDocument(doc.id, pastedText, title, 1);
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
      setProcessing(false);
    }
  };

  if (processing) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
        <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
        <h2 className="mb-2 text-xl font-semibold">{stage}</h2>
        <Progress value={progress} className="mt-4 h-2 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">Upload Study Material</h1>
      <p className="mb-6 text-muted-foreground">Upload a PDF or paste text. We'll extract concepts and create a quiz.</p>

      {!pasteMode ? (
        <>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
              dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
            }`}
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <UploadCloud className="h-7 w-7 text-primary" />
            </div>
            <p className="text-lg font-medium">Drop your file here</p>
            <p className="mt-1 text-sm text-muted-foreground">or click to browse — PDF, TXT, DOCX up to 20MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.docx"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="mt-4 w-full gap-2" onClick={() => setPasteMode(true)}>
            <Type className="h-4 w-4" /> Paste Text Instead
          </Button>
        </>
      ) : (
        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Paste Text</h3>
              <button onClick={() => setPasteMode(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Title (optional)"
              value={pastedTitle}
              onChange={(e) => setPastedTitle(e.target.value)}
              className="mb-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
            <Textarea
              placeholder="Paste your study material here..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              rows={10}
            />
            <Button onClick={handlePaste} disabled={!pastedText.trim()} className="mt-4 w-full gap-2">
              <FileText className="h-4 w-4" /> Process Text
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
