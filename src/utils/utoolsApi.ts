import { toast } from 'vue-sonner';

export function copyText(text: string, tips: boolean = true): boolean {
  tips && toast.success('复制成功');
  return utools.copyText(text);
}
