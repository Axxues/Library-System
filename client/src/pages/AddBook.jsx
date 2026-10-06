import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Copy,
  ExternalLink,
  Minus,
  Plus,
  PlusCircle,
  Printer,
  QrCode,
  Sparkles,
  Tag,
} from 'lucide-react';
import { api } from '../api.js';
import { Cover, fileToCoverDataUrl } from '../cover.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Card } from '../components/ui/card.jsx';
import { Input } from '../components/ui/input.jsx';

const SUGGESTED_GENRES = [
  'Fiction',
  'Computer Science',
  'Science & Technology',
  'History',
  'Philosophy',
  'Literature',
  'Biography',
  'General',
];

export default function AddBook() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    genre: '',
    classification: '',
    copies: 1,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [cover, setCover] = useState(null);
  const [coverBusy, setCoverBusy] = useState(false);

  const onCoverFile = async (f) => {
    if (!f) return;
    if (!String(f.type || '').startsWith('image/')) { setError('Cover must be an image file.'); return; }
    setCoverBusy(true);
    try {
      const url = await fileToCoverDataUrl(f);
      if (url.length > 200000) setError('Cover image too large even after compression.');
      else { setCover(url); setError(''); }
    } catch {
      setError('Could not read that image file.');
    } finally {
      setCoverBusy(false);
    }
  };

  const updateField = (key, val) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const adjustCopies = (delta) => {
    setFormData((prev) => {
      const current = Number(prev.copies) || 1;
      const next = Math.max(1, Math.min(50, current + delta));
      return { ...prev, copies: next };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const copiesNum = Number(formData.copies);

    if (!formData.title.trim() || !formData.author.trim() || !formData.genre.trim()) {
      setError('Title, author, and genre/category are required.');
      return;
    }

    if (!Number.isInteger(copiesNum) || copiesNum < 1 || copiesNum > 50) {
      setError('Physical copies must be a whole number between 1 and 50.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await api('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          author: formData.author.trim(),
          genre: formData.genre.trim(),
          classification: formData.classification.trim() || undefined,
          copies: copiesNum,
          cover: cover || undefined,
        }),
      });
      setResult(data);
    } catch (err) {
      setError(
        err.message === 'unreachable'
          ? 'Cannot reach the API server at localhost:4000. Please ensure the backend is running.'
          : err.message || 'Failed to add book to catalog.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      genre: '',
      classification: '',
      copies: 1,
    });
    setError('');
    setResult(null);
    setCover(null);
  };

  // Success view with QR labels
  if (result) {
    return (
      <div className="space-y-6">
        {/* Banner */}
        <div className="flex flex-col justify-between gap-4 rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-card via-card to-emerald-500/5 p-6 shadow-card sm:flex-row sm:items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Registration Successful
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Added “{result.book.title}”
            </h1>
            <p className="text-xs text-muted-foreground">
              By {result.book.author} · {result.copies.length}{' '}
              {result.copies.length === 1 ? 'copy' : 'copies'} registered with unique QR codes
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="rounded-xl"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Spine Labels
            </Button>
            <Button
              variant="outline"
              onClick={resetForm}
              className="rounded-xl"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Another Book
            </Button>
            <Button
              onClick={() => navigate('/catalog')}
              className="rounded-xl shadow-primary-sm"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              View Catalog
            </Button>
          </div>
        </div>

        {/* Copy Barcode Labels Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Generated Accession Labels ({result.copies.length})
            </h3>
            <span className="text-xs text-muted-foreground">
              Ready to print and adhere to inside covers or book spines
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {result.copies.map((copy) => (
              <Card
                key={copy.copyCode}
                className="flex flex-col justify-between border-border/70 p-4 transition-all hover:shadow-card hover:border-primary/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-white p-1 shadow-xs">
                    <img
                      src={`http://localhost:4000${copy.qrUrl}`}
                      alt={`QR for ${copy.copyCode}`}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-sm font-bold text-foreground">
                      {copy.copyCode}
                    </span>
                    <p className="truncate text-xs font-medium text-muted-foreground">
                      {result.book.title}
                    </p>
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      {result.book.genre}
                    </Badge>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2 text-[11px] text-muted-foreground font-mono">
                  <span>Status: Available</span>
                  <span>Cond: Good</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-border/70 bg-gradient-to-r from-card via-card to-primary/5 p-6 shadow-card sm:flex-row sm:items-center">
        <div>
          <button
            onClick={() => navigate('/catalog')}
            className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Library Catalog
          </button>
          <div className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Accession & Catalog Intake
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Add New Book
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Register bibliographic details and automatically issue physical copy barcodes with QR codes
          </p>
        </div>
      </div>

      {/* Main Form & Preview Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div
                  className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-50 p-3.5 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Book Title <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Design Patterns: Elements of Reusable Object-Oriented Software"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className="text-sm"
                />
              </div>

              {/* Author Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Author(s) <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides"
                  value={formData.author}
                  onChange={(e) => updateField('author', e.target.value)}
                  className="text-sm"
                />
              </div>

              {/* Genre Input & Suggestions */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Genre / Category <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Computer Science"
                  value={formData.genre}
                  onChange={(e) => updateField('genre', e.target.value)}
                  className="text-sm"
                />
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-muted-foreground mr-1">Quick pick:</span>
                  {SUGGESTED_GENRES.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => updateField('genre', g)}
                      className={`rounded-lg border px-2 py-0.5 text-xs transition-colors ${
                        formData.genre === g
                          ? 'border-primary bg-primary/10 font-semibold text-primary'
                          : 'border-border/70 hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cover Upload (optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Book Cover (Optional)
                </label>
                <div className="flex items-center gap-3">
                  {cover ? (
                    <img src={cover} alt="Cover preview" className="h-20 w-14 rounded-lg border border-border/70 object-cover shadow-xs" />
                  ) : (
                    <Cover title={formData.title || 'Book Title'} size="md" />
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      disabled={coverBusy}
                      onChange={(e) => onCoverFile(e.target.files?.[0])}
                      className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary hover:file:bg-primary/20"
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {coverBusy ? 'Compressing image…' : 'JPG/PNG auto-compressed to fit. Leave empty for gradient cover.'}
                    </p>
                  </div>
                  {cover && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setCover(null)} className="rounded-xl shrink-0">
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              {/* Shelf & Copies Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Shelf Classification */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Shelf / Classification (Optional)
                  </label>
                  <Input
                    placeholder="e.g. QA76.64 .D47 1994"
                    value={formData.classification}
                    onChange={(e) => updateField('classification', e.target.value)}
                    className="text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Dewey decimal or library call number
                  </p>
                </div>

                {/* Copies Stepper */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Physical Copies (1–50) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => adjustCopies(-1)}
                      disabled={Number(formData.copies) <= 1}
                      className="h-10 w-10 p-0 rounded-xl"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      required
                      value={formData.copies}
                      onChange={(e) => updateField('copies', e.target.value)}
                      className="text-center font-mono text-base font-bold"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => adjustCopies(1)}
                      disabled={Number(formData.copies) >= 50}
                      className="h-10 w-10 p-0 rounded-xl"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Allocates sequential barcodes automatically
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/catalog')}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl shadow-primary-sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {submitting ? 'Registering & Generating Labels…' : 'Add Book & Generate QR Codes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Col: Live Card Preview */}
        <div>
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Live Catalog Preview
            </h3>
            <Card className="p-5 space-y-4">
              <div className="flex items-start gap-4">
                <Cover
                  title={formData.title || 'Book Title'}
                  author={formData.author || 'Author Name'}
                  size="md"
                  src={cover}
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="font-bold text-sm text-foreground line-clamp-2">
                    {formData.title || 'Untitled Book'}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {formData.author || 'Author Name'}
                  </p>
                  <Badge variant="outline" className="text-[10px] mt-1">
                    {formData.genre || 'General'}
                  </Badge>
                  {formData.classification && (
                    <p className="font-mono text-[10px] text-muted-foreground pt-1">
                      Call: {formData.classification}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-muted/50 p-3 text-xs space-y-1 border border-border/50">
                <div className="flex justify-between text-muted-foreground">
                  <span>Physical Copies:</span>
                  <span className="font-mono font-bold text-foreground">
                    {formData.copies || 1}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Initial Condition:</span>
                  <span className="font-semibold text-emerald-600">Good</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Initial Status:</span>
                  <span className="font-semibold text-blue-600">Available</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <QrCode className="h-4 w-4 text-primary shrink-0" />
                <span>
                  {formData.copies || 1} accession barcode labels will be minted on submission.
                </span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
