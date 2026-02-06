import { Bold, Italic, Heading1, List, CheckSquare, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { EditorBlock } from './NoteEditor';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';

interface EditorToolbarProps {
  blocks: EditorBlock[];
  setBlocks: (blocks: EditorBlock[]) => void;
}

export default function EditorToolbar({ blocks, setBlocks }: EditorToolbarProps) {
  const addBlock = (type: EditorBlock['type']) => {
    const newBlock: EditorBlock = {
      id: Date.now().toString(),
      type,
      content: '',
    };
    setBlocks([...blocks, newBlock]);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(uint8Array);

      const newBlock: EditorBlock = {
        id: Date.now().toString(),
        type: 'image',
        content: '',
        imageBlob: blob,
      };
      setBlocks([...blocks, newBlock]);
      toast.success('Gambar berhasil ditambahkan');
    } catch (error) {
      toast.error('Gagal mengunggah gambar');
    }

    e.target.value = '';
  };

  return (
    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border flex-wrap">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => addBlock('heading')}
        title="Heading"
      >
        <Heading1 className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => addBlock('bullet')}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => addBlock('checklist')}
        title="Checklist"
      >
        <CheckSquare className="w-4 h-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => addBlock('text')}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => addBlock('text')}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      <label>
        <Button variant="ghost" size="sm" asChild title="Upload Image">
          <span className="cursor-pointer">
            <ImageIcon className="w-4 h-4" />
          </span>
        </Button>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </label>
    </div>
  );
}
