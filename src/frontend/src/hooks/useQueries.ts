import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Note, NoteContent, Progress, Category } from '../backend';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';

export function useGetAllNotes() {
  const { actor, isFetching } = useActor();

  return useQuery<Note[]>({
    queryKey: ['notes'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllNotes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetNote(id: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Note | null>({
    queryKey: ['note', id],
    queryFn: async () => {
      if (!actor || !id) return null;
      return actor.getNote(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useCreateNote() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      content,
      images,
      progress,
      category,
      target,
      dueDate,
    }: {
      title: string;
      content: NoteContent[];
      images: ExternalBlob[];
      progress: Progress;
      category: Category;
      target?: bigint | null;
      dueDate?: bigint | null;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.createNote(
        title,
        content,
        images,
        progress,
        category,
        target ?? null,
        dueDate ?? null
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Catatan berhasil dibuat');
    },
    onError: (error) => {
      toast.error('Gagal membuat catatan: ' + error.message);
    },
  });
}

export function useUpdateNote() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      content,
      images,
      progress,
      category,
      target,
      dueDate,
    }: {
      id: string;
      title: string;
      content: NoteContent[];
      images: ExternalBlob[];
      progress: Progress;
      category: Category;
      target?: bigint | null;
      dueDate?: bigint | null;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.updateNote(
        id,
        title,
        content,
        images,
        progress,
        category,
        target ?? null,
        dueDate ?? null
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['note', variables.id] });
      toast.success('Catatan berhasil diperbarui');
    },
    onError: (error) => {
      toast.error('Gagal memperbarui catatan: ' + error.message);
    },
  });
}

export function useDeleteNote() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteNote(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Catatan berhasil dihapus');
    },
    onError: (error) => {
      toast.error('Gagal menghapus catatan: ' + error.message);
    },
  });
}

export function useChecklistToggle() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, itemText }: { noteId: string; itemText: string }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.checklistToggle(noteId, itemText);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['note', variables.noteId] });
    },
    onError: (error) => {
      toast.error('Gagal mengubah checklist: ' + error.message);
    },
  });
}
