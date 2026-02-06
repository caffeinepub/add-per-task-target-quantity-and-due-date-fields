import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import EditorToolbar from './EditorToolbar';
import EditorContent from './EditorContent';
import { useGetNote, useCreateNote, useUpdateNote } from '@/hooks/useQueries';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { getSecretParameter } from '@/utils/urlParams';
import { toast } from 'sonner';
import type { NoteContent, Progress, Category } from '../backend';
import { ExternalBlob } from '../backend';

interface NoteEditorProps {
  noteId: string | null;
  onClose: () => void;
}

export interface EditorBlock {
  id: string;
  type: 'text' | 'heading' | 'bullet' | 'checklist' | 'image';
  content: string;
  isBold?: boolean;
  isItalic?: boolean;
  checked?: boolean;
  imageBlob?: ExternalBlob;
}

export default function NoteEditor({ noteId, onClose }: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [progress, setProgress] = useState<Progress>('belumMulai' as Progress);
  const [category, setCategory] = useState<Category>('medium' as Category);
  const [target, setTarget] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [blocks, setBlocks] = useState<EditorBlock[]>([
    { id: '1', type: 'text', content: '' },
  ]);

  const { data: note, isLoading } = useGetNote(noteId);
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const { identity } = useInternetIdentity();

  const isAuthenticated = !!identity;
  const hasAdminToken = !!getSecretParameter('caffeineAdminToken');
  const canSaveNotes = isAuthenticated || hasAdminToken;

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setProgress(note.progress);
      setCategory(note.category);
      
      // Set target if present
      if (note.target !== undefined && note.target !== null) {
        setTarget(note.target.toString());
      } else {
        setTarget('');
      }
      
      // Set due date if present
      if (note.dueDate !== undefined && note.dueDate !== null) {
        const date = new Date(Number(note.dueDate) / 1000000);
        const localDatetime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setDueDate(localDatetime);
      } else {
        setDueDate('');
      }
      
      const editorBlocks: EditorBlock[] = [];
      let blockId = 1;

      note.content.forEach((content) => {
        if (content.checklistItems) {
          content.checklistItems.forEach((item) => {
            editorBlocks.push({
              id: String(blockId++),
              type: 'checklist',
              content: item.text,
              checked: item.checked,
            });
          });
        } else {
          let type: EditorBlock['type'] = 'text';
          if (content.isHeading) type = 'heading';
          else if (content.isBulletPoint) type = 'bullet';

          editorBlocks.push({
            id: String(blockId++),
            type,
            content: content.text,
            isBold: content.isBold,
            isItalic: content.isItalic,
          });
        }
      });

      note.images.forEach((img) => {
        editorBlocks.push({
          id: String(blockId++),
          type: 'image',
          content: '',
          imageBlob: img,
        });
      });

      if (editorBlocks.length === 0) {
        editorBlocks.push({ id: '1', type: 'text', content: '' });
      }

      setBlocks(editorBlocks);
    }
  }, [note]);

  const handleSave = async () => {
    // Guard: Check if user can save notes
    if (!canSaveNotes) {
      toast.error('Please login with Internet Identity to save notes');
      return;
    }

    const content: NoteContent[] = [];
    const images: ExternalBlob[] = [];
    const checklistMap = new Map<string, { text: string; checked: boolean }[]>();

    blocks.forEach((block) => {
      if (block.type === 'image' && block.imageBlob) {
        images.push(block.imageBlob);
      } else if (block.type === 'checklist') {
        const key = 'checklist';
        if (!checklistMap.has(key)) {
          checklistMap.set(key, []);
        }
        checklistMap.get(key)!.push({
          text: block.content,
          checked: block.checked || false,
        });
      } else if (block.content.trim()) {
        content.push({
          text: block.content,
          isBold: block.isBold || false,
          isItalic: block.isItalic || false,
          isHeading: block.type === 'heading',
          isBulletPoint: block.type === 'bullet',
          checklistItems: undefined,
        });
      }
    });

    checklistMap.forEach((items) => {
      content.push({
        text: '',
        isBold: false,
        isItalic: false,
        isHeading: false,
        isBulletPoint: false,
        checklistItems: items,
      });
    });

    // Parse target and dueDate
    const targetValue = target.trim() ? BigInt(target) : null;
    const dueDateValue = dueDate.trim() 
      ? BigInt(new Date(dueDate).getTime() * 1000000) 
      : null;

    if (noteId) {
      await updateNote.mutateAsync({ 
        id: noteId, 
        title, 
        content, 
        images, 
        progress, 
        category,
        target: targetValue,
        dueDate: dueDateValue,
      });
    } else {
      await createNote.mutateAsync({ 
        title, 
        content, 
        images, 
        progress, 
        category,
        target: targetValue,
        dueDate: dueDateValue,
      });
    }
    onClose();
  };

  const isSaving = createNote.isPending || updateNote.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={onClose} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Simpan
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <Input
            placeholder="Judul catatan..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-bold border-0 px-0 mb-6 focus-visible:ring-0"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="progress">Progres Tugas</Label>
              <Select value={progress} onValueChange={(value) => setProgress(value as Progress)}>
                <SelectTrigger id="progress">
                  <SelectValue placeholder="Pilih progres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="belumMulai">Belum Mulai</SelectItem>
                  <SelectItem value="sedangDikerjakan">Sedang Dikerjakan</SelectItem>
                  <SelectItem value="selesai">Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as Category)}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prioritas">Prioritas</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="santai">Santai</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target">Target / Jumlah Pengerjaan</Label>
              <Input
                id="target"
                type="number"
                min="0"
                placeholder="Contoh: 10"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Batas Waktu</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <EditorToolbar blocks={blocks} setBlocks={setBlocks} />

          <EditorContent blocks={blocks} setBlocks={setBlocks} />
        </CardContent>
      </Card>
    </div>
  );
}
