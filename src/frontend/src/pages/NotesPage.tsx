import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NotesList from '@/components/NotesList';
import NoteEditor from '@/components/NoteEditor';
import { useGetAllNotes } from '@/hooks/useQueries';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { getSecretParameter } from '@/utils/urlParams';
import { toast } from 'sonner';

export default function NotesPage() {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { data: notes, isLoading } = useGetAllNotes();
  const { identity } = useInternetIdentity();

  const isAuthenticated = !!identity;
  const hasAdminToken = !!getSecretParameter('caffeineAdminToken');
  const canCreateNotes = isAuthenticated || hasAdminToken;

  const handleCreateNew = () => {
    if (!canCreateNotes) {
      toast.error('Please login to create notes');
      return;
    }
    setSelectedNoteId(null);
    setIsCreating(true);
  };

  const handleSelectNote = (id: string) => {
    setSelectedNoteId(id);
    setIsCreating(false);
  };

  const handleCloseEditor = () => {
    setSelectedNoteId(null);
    setIsCreating(false);
  };

  const showEditor = isCreating || selectedNoteId !== null;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {!showEditor ? (
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Catatan Ide
                </h1>
                <p className="text-muted-foreground mt-2">
                  Simpan dan kelola ide-ide kreatif Anda
                </p>
              </div>
              <Button onClick={handleCreateNew} size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                Buat Catatan Baru
              </Button>
            </div>

            <NotesList
              notes={notes || []}
              isLoading={isLoading}
              onSelectNote={handleSelectNote}
            />
          </div>
        ) : (
          <NoteEditor
            noteId={selectedNoteId}
            onClose={handleCloseEditor}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
