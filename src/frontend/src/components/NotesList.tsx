import { FileText, Clock, Trash2, Target, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { Note, Progress, Category } from '../backend';
import { useDeleteNote } from '@/hooks/useQueries';

interface NotesListProps {
  notes: Note[];
  isLoading: boolean;
  onSelectNote: (id: string) => void;
}

export default function NotesList({ notes, isLoading, onSelectNote }: NotesListProps) {
  const deleteNote = useDeleteNote();

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatDueDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    const now = new Date();
    const isOverdue = date < now;
    
    const formatted = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
    
    return { formatted, isOverdue };
  };

  const getPreviewText = (note: Note) => {
    const textContent = note.content
      .filter((c) => c.text && !c.checklistItems)
      .map((c) => c.text)
      .join(' ');
    return textContent.slice(0, 150) + (textContent.length > 150 ? '...' : '');
  };

  const getProgressLabel = (progress: Progress) => {
    switch (progress) {
      case 'belumMulai':
        return 'Belum Mulai';
      case 'sedangDikerjakan':
        return 'Sedang Dikerjakan';
      case 'selesai':
        return 'Selesai';
      default:
        return progress;
    }
  };

  const getProgressColor = (progress: Progress) => {
    switch (progress) {
      case 'belumMulai':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
      case 'sedangDikerjakan':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'selesai':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getCategoryLabel = (category: Category) => {
    switch (category) {
      case 'prioritas':
        return 'Prioritas';
      case 'medium':
        return 'Medium';
      case 'santai':
        return 'Santai';
      default:
        return category;
    }
  };

  const getCategoryColor = (category: Category) => {
    switch (category) {
      case 'prioritas':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'medium':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300';
      case 'santai':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
          <FileText className="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-semibold mb-2">Belum ada catatan</h3>
        <p className="text-muted-foreground">
          Mulai dengan membuat catatan pertama Anda
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {notes.map((note) => {
        const hasTarget = note.target !== undefined && note.target !== null;
        const hasDueDate = note.dueDate !== undefined && note.dueDate !== null;
        const dueDateInfo = hasDueDate ? formatDueDate(note.dueDate!) : null;
        
        return (
          <Card
            key={note.id}
            className="group hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-primary/50"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle
                  className="text-lg line-clamp-2 group-hover:text-primary transition-colors"
                  onClick={() => onSelectNote(note.id)}
                >
                  {note.title || 'Tanpa Judul'}
                </CardTitle>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hapus Catatan?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tindakan ini tidak dapat dibatalkan. Catatan akan dihapus secara permanen.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteNote.mutate(note.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Hapus
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge className={getCategoryColor(note.category)}>
                  {getCategoryLabel(note.category)}
                </Badge>
                <Badge className={getProgressColor(note.progress)}>
                  {getProgressLabel(note.progress)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent onClick={() => onSelectNote(note.id)}>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                {getPreviewText(note)}
              </p>
              
              {(hasTarget || hasDueDate) && (
                <div className="space-y-2 mb-4 pb-4 border-b">
                  {hasTarget && (
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="w-4 h-4 text-primary" />
                      <span className="font-medium">Target:</span>
                      <span className="text-muted-foreground">{note.target!.toString()}</span>
                    </div>
                  )}
                  {hasDueDate && dueDateInfo && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className={`w-4 h-4 ${dueDateInfo.isOverdue ? 'text-destructive' : 'text-primary'}`} />
                      <span className="font-medium">Deadline:</span>
                      <span className={dueDateInfo.isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                        {dueDateInfo.formatted}
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formatDate(note.timestamp)}
              </div>
              {note.images.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {note.images.slice(0, 3).map((img, idx) => (
                    <div
                      key={idx}
                      className="w-12 h-12 rounded bg-muted overflow-hidden"
                    >
                      <img
                        src={img.getDirectURL()}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {note.images.length > 3 && (
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xs font-medium">
                      +{note.images.length - 3}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
