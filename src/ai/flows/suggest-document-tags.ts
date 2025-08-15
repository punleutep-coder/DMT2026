'use server';

/**
 * @fileOverview An AI agent that suggests relevant tags for a document based on its name.
 *
 * - suggestDocumentTags - A function that suggests tags for a document name.
 * - SuggestDocumentTagsInput - The input type for the suggestDocumentTags function.
 * - SuggestDocumentTagsOutput - The return type for the suggestDocumentTags function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestDocumentTagsInputSchema = z.object({
  documentName: z.string().describe('The name of the document.'),
});
export type SuggestDocumentTagsInput = z.infer<typeof SuggestDocumentTagsInputSchema>;

const SuggestDocumentTagsOutputSchema = z.object({
  tags: z.array(z.string()).describe('An array of suggested tags for the document.'),
});
export type SuggestDocumentTagsOutput = z.infer<typeof SuggestDocumentTagsOutputSchema>;

export async function suggestDocumentTags(input: SuggestDocumentTagsInput): Promise<SuggestDocumentTagsOutput> {
  return suggestDocumentTagsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestDocumentTagsPrompt',
  input: {schema: SuggestDocumentTagsInputSchema},
  output: {schema: SuggestDocumentTagsOutputSchema},
  prompt: `Given the document name "{{{documentName}}}", suggest up to 5 relevant tags to categorize it. These tags should be concise and related to the document's content or purpose.  Return only the tags in an array format. For example: ["tag1", "tag2", "tag3"]`,
});

const suggestDocumentTagsFlow = ai.defineFlow(
  {
    name: 'suggestDocumentTagsFlow',
    inputSchema: SuggestDocumentTagsInputSchema,
    outputSchema: SuggestDocumentTagsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
