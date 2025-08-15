'use server';
import { suggestDocumentTags } from '@/ai/flows/suggest-document-tags';

export async function suggestTagsAction(documentName: string): Promise<string[]> {
  if (!documentName) {
    return [];
  }
  try {
    const result = await suggestDocumentTags({ documentName });
    return result.tags;
  } catch (error) {
    console.error('Error suggesting tags:', error);
    return [];
  }
}
