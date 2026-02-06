import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { X, GripVertical } from 'lucide-react';
import type { EditorBlock } from './NoteEditor';

interface EditorContentProps {
  blocks: EditorBlock[];
  setBlocks: (blocks: EditorBlock[]) => void;
}

export default function EditorContent({ blocks, setBlocks }: EditorContentProps) {
  const updateBlock = (id: string, updates: Partial<EditorBlock>) => {
    setBlocks(
      blocks.map((block) =>
        block.id === id ? { ...block, ...updates } : block
      )
    );
  };

  const deleteBlock = (id: string) => {
    if (blocks.length === 1) return;
    setBlocks(blocks.filter((block) => block.id !== id));
  };

  const toggleFormat = (id: string, format: 'isBold' | 'isItalic') => {
    setBlocks(
      blocks.map((block) =>
        block.id === id ? { ...block, [format]: !block[format] } : block
      )
    );
  };

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => (
        <div key={block.id} className="group relative">
          <div className="flex items-start gap-2">
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-2">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
            </div>

            <div className="flex-1">
              {block.type === 'heading' && (
                <Textarea
                  value={block.content}
                  onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                  placeholder="Heading..."
                  className="text-2xl font-bold resize-none min-h-[60px]"
                />
              )}

              {block.type === 'text' && (
                <div className="space-y-2">
                  <Textarea
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                    placeholder="Tulis sesuatu..."
                    className={`resize-none min-h-[80px] ${
                      block.isBold ? 'font-bold' : ''
                    } ${block.isItalic ? 'italic' : ''}`}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant={block.isBold ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleFormat(block.id, 'isBold')}
                    >
                      Tebal
                    </Button>
                    <Button
                      variant={block.isItalic ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleFormat(block.id, 'isItalic')}
                    >
                      Miring
                    </Button>
                  </div>
                </div>
              )}

              {block.type === 'bullet' && (
                <div className="flex items-start gap-2">
                  <span className="text-xl mt-2">•</span>
                  <Textarea
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                    placeholder="Item list..."
                    className="resize-none min-h-[60px]"
                  />
                </div>
              )}

              {block.type === 'checklist' && (
                <div className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <Checkbox
                    checked={block.checked || false}
                    onCheckedChange={(checked) =>
                      updateBlock(block.id, { checked: checked as boolean })
                    }
                    className="mt-1"
                  />
                  <Textarea
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                    placeholder="Item checklist..."
                    className="resize-none min-h-[60px] border-0 focus-visible:ring-0 p-0"
                  />
                </div>
              )}

              {block.type === 'image' && block.imageBlob && (
                <div className="rounded-lg overflow-hidden border border-border">
                  <img
                    src={block.imageBlob.getDirectURL()}
                    alt="Uploaded"
                    className="w-full h-auto max-h-96 object-contain bg-muted"
                  />
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteBlock(block.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              disabled={blocks.length === 1}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
