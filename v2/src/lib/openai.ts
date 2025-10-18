import OpenAI from 'openai';
import { Database } from './database.types';

type StoryElement = Database['public']['Tables']['story_elements']['Row'];
type Prompt = Database['public']['Tables']['prompts']['Row'];
type Response = Database['public']['Tables']['responses']['Row'];

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Note: In production, use a backend proxy
});

export interface GeneratePromptOptions {
  promptMode: string;
  storyContext: {
    bookTitle: string;
    bookDescription?: string;
  };
  selectedElements?: StoryElement[];
  availableElements?: StoryElement[];
  elementHistory?: {
    element: StoryElement;
    prompts: (Prompt & { responses?: Response[] })[];
  }[];
}

export async function generateAIPrompt(options: GeneratePromptOptions): Promise<string> {
  const {
    promptMode,
    storyContext,
    selectedElements = [],
    availableElements = [],
    elementHistory = [],
  } = options;

  // If no elements are selected, randomly choose one that makes sense for the mode
  let elementsToUse = selectedElements;
  if (elementsToUse.length === 0 && availableElements.length > 0) {
    elementsToUse = [selectRandomElement(availableElements, promptMode)];
  }

  const systemPrompt = buildSystemPrompt(promptMode);
  const userPrompt = buildUserPrompt(storyContext, elementsToUse, elementHistory, promptMode);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 300,
    });

    return completion.choices[0]?.message?.content || 'What detail about this element would you like to explore further?';
  } catch (error) {
    console.error('Error generating AI prompt:', error);
    throw error;
  }
}

function selectRandomElement(elements: StoryElement[], mode: string): StoryElement {
  // Prefer elements that match the prompt mode
  const modePreferences: Record<string, string[]> = {
    character_deep_dive: ['character'],
    plot_development: ['plot_point', 'character'],
    worldbuilding: ['location', 'item', 'theme'],
    dialogue: ['character'],
    conflict_theme: ['theme', 'character', 'plot_point'],
    general: ['character', 'location', 'plot_point', 'item', 'theme'],
  };

  const preferredTypes = modePreferences[mode] || modePreferences.general;
  
  // Try to find an element matching preferred types
  for (const type of preferredTypes) {
    const matching = elements.filter(el => el.element_type === type);
    if (matching.length > 0) {
      return matching[Math.floor(Math.random() * matching.length)];
    }
  }

  // Fallback to any random element
  return elements[Math.floor(Math.random() * elements.length)];
}

function buildSystemPrompt(mode: string): string {
  const basePrompt = `You are a creative writing assistant specialized in helping authors develop their stories through thoughtful, interview-style questions. Your role is NOT to write the story or worldbuild for them, but to draw out the author's own ideas through insightful questions.

Your questions should:
- Be specific to the story elements provided
- Help the author explore deeper layers of their characters, world, and plot
- Use the "character interview" technique - ask questions that reveal hidden depths
- Reference previous questions and answers to build continuity
- Be open-ended to encourage detailed responses
- Focus on motivations, conflicts, relationships, and consequences
- Never be generic - always personalize to the specific element

Generate ONE focused question that will help the author flesh out their story element.`;

  const modeSpecifics: Record<string, string> = {
    character_deep_dive: `\n\nFor CHARACTER mode: Focus on psychology, motivations, fears, desires, relationships, backstory, growth arcs, and internal conflicts. Ask about moments that shaped them, secrets they keep, how they react under pressure.`,
    plot_development: `\n\nFor PLOT mode: Focus on cause and effect, turning points, obstacles, stakes, consequences, and story progression. Ask about what could go wrong, what choices characters face, what's at stake.`,
    worldbuilding: `\n\nFor WORLDBUILDING mode: Focus on the rules, culture, history, and unique aspects of locations, items, or systems. Ask about sensory details, social dynamics, how things work, what makes them unique.`,
    dialogue: `\n\nFor DIALOGUE mode: Create scenarios that reveal character voice and relationships through conversation. Ask the author to write dialogue that shows subtext, conflict, or character dynamics.`,
    conflict_theme: `\n\nFor CONFLICT & THEME mode: Focus on moral dilemmas, thematic questions, values, and what the story is ultimately about. Ask about gray areas, hard choices, and what the character stands for.`,
    general: `\n\nFor GENERAL mode: Balance all aspects - character, plot, world, and theme. Ask questions that connect different story elements or reveal unexpected dimensions.`,
  };

  return basePrompt + (modeSpecifics[mode] || modeSpecifics.general);
}

function buildUserPrompt(
  storyContext: { bookTitle: string; bookDescription?: string },
  elements: StoryElement[],
  elementHistory: { element: StoryElement; prompts: (Prompt & { responses?: Response[] })[] }[],
  mode: string
): string {
  let prompt = `STORY CONTEXT:\nTitle: ${storyContext.bookTitle}\n`;
  if (storyContext.bookDescription) {
    prompt += `Description: ${storyContext.bookDescription}\n`;
  }

  prompt += `\nFOCUS ELEMENTS:\n`;
  elements.forEach(el => {
    prompt += `- ${el.element_type.toUpperCase()}: "${el.name}"\n`;
    if (el.description) prompt += `  Description: ${el.description}\n`;
    if (el.notes) prompt += `  Notes: ${el.notes}\n`;
  });

  // Include relevant history for context
  if (elementHistory.length > 0) {
    prompt += `\nPREVIOUS QUESTIONS & ANSWERS:\n`;
    elementHistory.forEach(({ element, prompts }) => {
      if (prompts.length > 0) {
        prompt += `\nFor ${element.element_type} "${element.name}":\n`;
        prompts.slice(-3).forEach((p, idx) => {
          prompt += `Q${idx + 1}: ${p.prompt_text}\n`;
          if (p.responses && p.responses.length > 0) {
            const response = p.responses[0];
            const truncatedResponse = response.response_text.length > 200 
              ? response.response_text.substring(0, 200) + '...' 
              : response.response_text;
            prompt += `A${idx + 1}: ${truncatedResponse}\n`;
          }
        });
      }
    });
  }

  prompt += `\nPROMPT MODE: ${mode}\n`;
  prompt += `\nGenerate ONE specific, thought-provoking question that helps the author develop these story elements further. Reference the element by name in your question.`;

  return prompt;
}
