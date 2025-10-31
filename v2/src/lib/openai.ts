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
      model: 'gpt-4o',
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
  const basePrompt = `You are a creative writing assistant helping authors develop their stories through brief, focused questions. Your role is to draw out the author's ideas ONE SMALL DETAIL AT A TIME.

CRITICAL RULES:
- Ask ONE specific, bite-sized question
- Questions should be answerable in 2-4 sentences
- Focus on concrete details, not abstract concepts
- Reference story elements by name when possible
- Build on previous answers if provided
- DO NOT ask the author to write scenes or dialogue
- DO NOT ask philosophical or overly complex questions
- DO NOT try to worldbuild for them - draw out their existing ideas`;

  const modeSpecifics: Record<string, string> = {
    general: `\n\nFor GENERAL mode: Ask simple, specific questions about any story element that reveal concrete details. Examples:
- "What's one physical trait that makes [Character] immediately recognizable?"
- "What's the most common sound heard in [Location]?"
- "What does [Item] smell like?"
- "What time of day does [Event] typically happen?"
Keep it simple, specific, and answerable quickly.`,
    
    character_deep_dive: `\n\nFor CHARACTER mode: Ask focused questions about personality, habits, or relationships. Examples:
- "What's one thing [Character] always carries with them, and why?"
- "How does [Character] react when someone disagrees with them?"
- "What's [Character]'s go-to comfort food?"
Keep it personal but not too deep - one detail at a time.`,
    
    plot_development: `\n\nFor PLOT mode: Ask about specific events, obstacles, or consequences. Examples:
- "What's the first thing that goes wrong in [Plot Point]?"
- "Who has the most to lose if [Event] fails?"
- "What does [Character] notice first when [Plot Point] begins?"
Focus on concrete moments, not entire story arcs.`,
    
    worldbuilding: `\n\nFor WORLDBUILDING mode: Ask about sensory details or practical aspects. Examples:
- "What's the weather like in [Location] most of the year?"
- "What material is [Item] made from?"
- "What do locals call [Location] in everyday conversation?"
Keep it grounded in specifics, not world systems.`,
    
    dialogue: `\n\nFor DIALOGUE mode: Ask for a single line or brief exchange that reveals character. Examples:
- "What's one phrase [Character] says when they're nervous?"
- "How would [Character] greet an old friend?"
- "What would [Character] say if interrupted while working?"
Just a quick line or two, not a full scene.`,
    
    conflict_theme: `\n\nFor CONFLICT & THEME mode: Ask about specific values or choices. Examples:
- "What rule would [Character] break if pushed far enough?"
- "What does [Character] value more: truth or kindness?"
- "What line won't [Character] cross, even for someone they love?"
One clear choice or value, not philosophical essays.`,
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

export function getAvailableModes(elements: StoryElement[]): string[] {
  const modes = ['general']; // General is always available
  
  const elementTypes = new Set(elements.map(el => el.element_type));
  
  // Character Deep Dive: requires at least one character
  if (elementTypes.has('character')) {
    modes.push('character_deep_dive');
  }
  
  // Plot Development: requires plot points or characters
  if (elementTypes.has('plot_point') || elementTypes.has('character')) {
    modes.push('plot_development');
  }
  
  // Worldbuilding: requires locations, items, or themes
  if (elementTypes.has('location') || elementTypes.has('item') || elementTypes.has('theme')) {
    modes.push('worldbuilding');
  }
  
  // Dialogue: requires characters
  if (elementTypes.has('character')) {
    modes.push('dialogue');
  }
  
  // Conflict & Theme: requires characters or themes
  if (elementTypes.has('character') || elementTypes.has('theme') || elementTypes.has('plot_point')) {
    modes.push('conflict_theme');
  }
  
  return modes;
}
