import OpenAI from 'openai';

// Create OpenAI client - will be initialized when first used
let openai = null;

function getOpenAIClient() {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openai;
}

export async function generateAIPrompt(options) {
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
    const completion = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 300,
    });

    return {
      prompt: completion.choices[0]?.message?.content || 'What detail about this element would you like to explore further?',
      usedElements: elementsToUse // Return the actual elements that were used
    };
  } catch (error) {
    console.error('Error generating AI prompt:', error);
    throw error;
  }
}

function selectRandomElement(elements, mode) {
  const modePreferences = {
    character_deep_dive: ['character'],
    plot_development: ['plot_point', 'character'],
    worldbuilding: ['location', 'item', 'theme'],
    dialogue: ['character'],
    conflict_theme: ['theme', 'character', 'plot_point'],
    general: ['character', 'location', 'plot_point', 'item', 'theme'],
  };

  const preferredTypes = modePreferences[mode] || modePreferences.general;
  
  for (const type of preferredTypes) {
    const matching = elements.filter(el => el.element_type === type);
    if (matching.length > 0) {
      return matching[Math.floor(Math.random() * matching.length)];
    }
  }

  return elements[Math.floor(Math.random() * elements.length)];
}

function buildSystemPrompt(mode) {
  const basePrompt = `You are a creative writing assistant helping authors develop their stories through brief, focused questions. Your role is to draw out the author's ideas ONE SMALL DETAIL AT A TIME.

CRITICAL RULES:
- Ask ONE specific, bite-sized question
- Questions should be answerable in 2-4 sentences
- Focus on concrete details, not abstract concepts
- Reference story elements by name when possible
- Build on previous answers if provided
- You will be given extensive context (descriptions, notes, and previous Q&A), but you DON'T need to use all of it
- Focus on asking about something new or unexplored, or build naturally on recent answers
- DO NOT ask the author to write scenes or dialogue
- DO NOT ask philosophical or overly complex questions
- DO NOT try to worldbuild for them - draw out their existing ideas`;

  const modeSpecifics = {
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

function buildUserPrompt(storyContext, elements, elementHistory, mode) {
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

  if (elementHistory.length > 0) {
    prompt += `\nPREVIOUS QUESTIONS & ANSWERS ABOUT THESE ELEMENTS:\n`;
    prompt += `(You don't need to reference all of this - focus on what's relevant or unexplored)\n`;
    elementHistory.forEach(({ element, prompts }) => {
      if (prompts.length > 0) {
        prompt += `\nFor ${element.element_type} "${element.name}":\n`;
        prompts.forEach((p, idx) => {
          prompt += `Q${idx + 1}: ${p.prompt_text}\n`;
          if (p.responses && p.responses.length > 0) {
            const response = p.responses[0];
            // Truncate very long responses but keep more context
            const truncatedResponse = response.response_text.length > 400 
              ? response.response_text.substring(0, 400) + '...' 
              : response.response_text;
            prompt += `A${idx + 1}: ${truncatedResponse}\n`;
          }
        });
      }
    });
  }

  prompt += `\nPROMPT MODE: ${mode}\n`;
  prompt += `\nGenerate ONE specific, thought-provoking question that helps the author develop these story elements further. Reference the element by name in your question. Build on what they've already explored or ask about something new.`;

  return prompt;
}

export function getAvailableModes(elements) {
  const modes = ['general'];
  const elementTypes = new Set(elements.map(el => el.element_type));
  
  if (elementTypes.has('character')) {
    modes.push('character_deep_dive');
  }
  
  if (elementTypes.has('plot_point') || elementTypes.has('character')) {
    modes.push('plot_development');
  }
  
  if (elementTypes.has('location') || elementTypes.has('item') || elementTypes.has('theme')) {
    modes.push('worldbuilding');
  }
  
  if (elementTypes.has('character')) {
    modes.push('dialogue');
  }
  
  if (elementTypes.has('theme') || elementTypes.has('character') || elementTypes.has('plot_point')) {
    modes.push('conflict_theme');
  }
  
  return modes;
}

// Enhance element description by synthesizing existing information
export async function enhanceElementDescription(options) {
  const {
    element,
    promptsAndResponses = [],
  } = options;

  // Build context from all existing information
  let context = `Story Element: ${element.name}\n`;
  context += `Type: ${element.element_type}\n\n`;
  
  if (element.description) {
    context += `Current Description:\n${element.description}\n\n`;
  }
  
  if (element.notes) {
    context += `Author's Notes:\n${element.notes}\n\n`;
  }

  // Add all Q&A history
  if (promptsAndResponses.length > 0) {
    context += `Writing Prompts and Responses:\n\n`;
    
    promptsAndResponses.forEach((item, idx) => {
      context += `${idx + 1}. Prompt (${item.prompt_type || 'general'}): ${item.prompt_text}\n`;
      if (item.response_text) {
        // Truncate very long responses but keep more than before since this is for synthesis
        const responseText = item.response_text.length > 800 
          ? item.response_text.substring(0, 800) + '...'
          : item.response_text;
        context += `   Response: ${responseText}\n`;
      }
      context += `\n`;
    });
  }

  const systemPrompt = `You are a writing assistant helping an author consolidate their scattered notes about a story element.

Your ONLY task is to organize and merge the information provided - nothing more.

CRITICAL RULES:
1. ONLY use facts, details, and descriptions explicitly written by the author
2. Do NOT add any interpretations, analysis, or embellishments
3. Do NOT add descriptive language, adjectives, or color that wasn't in the original
4. Do NOT speculate or expand on ideas
5. If the author wrote "tall" don't change it to "imposing" or "towering"
6. Simply organize the scattered information into a clear, factual summary
7. Maintain the author's exact wording whenever possible
8. If there are contradictions, list both versions
9. Keep it concise - only include what the author already wrote

Think of this as copy-pasting the author's notes into a single organized document, not as creative writing.`;

  const userPrompt = `Please consolidate ALL the information provided below into a single organized description. Use ONLY the exact facts and details written here - do not add any new adjectives, interpretations, or embellishments.

${context}

Consolidated Description:`;

  try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3, // Lower temperature for more factual synthesis
      max_tokens: 800,
    });

    return {
      enhancedDescription: completion.choices[0]?.message?.content || '',
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to enhance description: ' + error.message);
  }
}
