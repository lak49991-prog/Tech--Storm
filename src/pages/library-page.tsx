import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Upload, Trash2, Target, Layers, Clock } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { fetchDocuments, deleteDocument } from '@/services/data-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

export default function LibraryPage() {
  const { user } = useAuth();
  const userId = user?.id || '';
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', userId],
    queryFn: () => fetchDocuments(userId),
    enabled: !!userId,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({ title: 'Document deleted' });
    },
    onError: () => toast({ title: 'Could not delete document', variant: 'destructive' }),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Study Material</h1>
          <p className="mt-1 text-muted-foreground">{documents?.length || 0} documents</p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/upload"><Upload className="h-4 w-4" /> Upload</Link>
        </Button>
      </div>

      {(!documents || documents.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <FileText className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="mb-1 text-lg font-semibold">No documents yet</h3>
            <p className="mb-4 text-muted-foreground">Upload your first study material to get started.</p>
            <Button asChild className="gap-2">
              <Link to="/upload"><Upload className="h-4 w-4" /> Upload Material</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {documents.map((doc) => (
            <Card key={doc.id} className="group transition-all hover:border-primary/40">
              <CardContent className="p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium leading-tight">{doc.title}</p>
                      <p className="text-xs text-muted-foreground uppercase">{doc.file_type}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(doc.id)}
                    className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {doc.concept_count != null && <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {doc.concept_count} concepts</span>}
                  {doc.estimated_minutes != null && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {doc.estimated_minutes} min</span>}
                  {doc.status === 'processing' && <span className="text-warning">Processing...</span>}
                  {doc.status === 'failed' && <span className="text-destructive">Failed</span>}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link to={`/library/${doc.id}`}>Open</Link>
                  </Button>
                  {doc.status === 'ready' && (
                    <Button size="sm" asChild className="flex-1 gap-1.5">
                      <Link to="/practice"><Target className="h-3.5 w-3.5" /> Practice</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
