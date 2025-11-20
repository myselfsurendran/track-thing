
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, MealLogEntry, WorkoutLogEntry, SleepLogEntry, DailyGoals } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const mealLogSchema = {
  type: Type.OBJECT,
  properties: {
    mealType: {
      type: Type.STRING,
      description: "The type of meal, e.g., Breakfast, Lunch, Dinner, or Snack.",
      enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Unknown'],
    },
    items: {
      type: Type.ARRAY,
      description: "An array of food items consumed.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: "The name of the food item.",
          },
          quantity: {
            type: Type.NUMBER,
            description: "The quantity of the food item.",
          },
          calories: {
            type: Type.NUMBER,
            description: "Estimated calories for the item and quantity.",
          },
          protein: {
            type: Type.NUMBER,
            description: "Estimated protein in grams.",
          },
          carbs: {
            type: Type.NUMBER,
            description: "Estimated carbohydrates in grams.",
          },
          fat: {
            type: Type.NUMBER,
            description: "Estimated fat in grams.",
          },
        },
        required: ["name", "quantity", "calories", "protein", "carbs", "fat"],
      },
    },
  },
  required: ["mealType", "items"],
};

const workoutLogSchema = {
    type: Type.OBJECT,
    properties: {
        workoutType: {
            type: Type.STRING,
            description: "The type of workout, e.g., Strength, Cardio, Mixed, or Other.",
            enum: ['Strength', 'Cardio', 'Mixed', 'Other'],
        },
        items: {
            type: Type.ARRAY,
            description: "An array of exercises performed.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "The name of the exercise." },
                    sets: { type: Type.NUMBER, description: "Number of sets." },
                    reps: { type: Type.NUMBER, description: "Number of repetitions per set." },
                    weight: { type: Type.NUMBER, description: "Weight used in kg." },
                    duration: { type: Type.NUMBER, description: "Duration of the exercise in minutes." },
                    distance: { type: Type.NUMBER, description: "Distance covered in km." },
                },
                required: ["name"],
            },
        },
    },
    required: ["workoutType", "items"],
};


export const parseMealFromText = async (text: string): Promise<Omit<MealLogEntry, 'timestamp' | 'id'>> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: `Parse the following meal description: "${text}"`,
      config: {
        systemInstruction: `You are an expert nutrition tracker. Your task is to analyze a user's meal description and extract the food items, quantities, and meal type. You must also estimate the nutritional information (calories, protein, carbs, fat) for each item. Respond ONLY with a JSON object in the specified format. Do not add any introductory text, explanations, or markdown formatting. If the meal type is not specified, default to 'Unknown'.`,
        responseMimeType: "application/json",
        responseSchema: mealLogSchema,
      },
    });

    const jsonString = response.text.trim();
    const parsedData = JSON.parse(jsonString);

    if (!parsedData.mealType || !Array.isArray(parsedData.items)) {
        throw new Error("Invalid data structure received from AI.");
    }

    return parsedData;

  } catch (error) {
    console.error("Error parsing meal with Gemini:", error);
    throw new Error("Could not understand the meal description. Please try again.");
  }
};

export const parseWorkoutFromText = async (text: string): Promise<Omit<WorkoutLogEntry, 'timestamp' | 'id'>> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: `Parse the following workout description: "${text}"`,
            config: {
                systemInstruction: `You are an expert fitness coach. Your task is to analyze a user's workout description and extract the exercises, sets, reps, weight, duration, distance, and overall workout type. Respond ONLY with a JSON object in the specified format. If a specific metric (like reps, weight, etc.) is not mentioned for an exercise, omit the key. If the workout type is a mix, use 'Mixed'. If it's unclear, use 'Other'.`,
                responseMimeType: "application/json",
                responseSchema: workoutLogSchema,
            },
        });

        const jsonString = response.text.trim();
        const parsedData = JSON.parse(jsonString);

        if (!parsedData.workoutType || !Array.isArray(parsedData.items)) {
            throw new Error("Invalid data structure received from AI for workout.");
        }

        return parsedData;

    } catch (error) {
        console.error("Error parsing workout with Gemini:", error);
        throw new Error("Could not understand the workout description. Please try again.");
    }
};


// FINAL VERSION — NO WATER ANYWHERE

export const getDailySummary = async (
  userProfile: UserProfile,
  mealLogToday: MealLogEntry[],
  workoutLogToday: WorkoutLogEntry[],
  sleepLogToday: SleepLogEntry[],
  dailyGoals: DailyGoals,
  yesterdayLogs?: {
    mealLogYesterday?: MealLogEntry[],
    workoutLogYesterday?: WorkoutLogEntry[],
    sleepLogYesterday?: SleepLogEntry[],
  }
): Promise<string> => {
  try {
    // --- helper reducers ---
    const aggregateMeals = (meals: MealLogEntry[] = []) => {
      const agg = { calories: 0, protein: 0, carbs: 0, fat: 0, meals: meals.length };
      meals.forEach(m => {
        const items = Array.isArray((m as any).items) ? (m as any).items : [];
        items.forEach((it: any) => {
          agg.calories += Number(it?.calories ?? 0);
          agg.protein += Number(it?.protein ?? 0);
          agg.carbs += Number(it?.carbs ?? 0);
          agg.fat += Number(it?.fat ?? 0);
        });
      });
      return agg;
    };

    const aggregateWorkouts = (workouts: WorkoutLogEntry[] = []) => {
      const agg = { sessions: 0, steps: 0, durationMin: 0, types: {} as Record<string, number> };
      workouts.forEach(w => {
        agg.sessions++;
        agg.steps += Number((w as any).steps ?? 0);
        const items = Array.isArray((w as any).items) ? (w as any).items : [];
        items.forEach((it: any) => { agg.durationMin += Number(it?.duration ?? 0); });
        const key = (w as any).workoutType || 'Other';
        agg.types[key] = (agg.types[key] || 0) + 1;
      });
      return agg;
    };

    const aggregateSleep = (sleepArr: SleepLogEntry[] = []) => {
      if (!sleepArr || sleepArr.length === 0)
        return { nights: 0, avgMin: 0, latestScore: 0 };
      const durations = sleepArr.map(s => Number((s as any).duration ?? 0)); // minutes
      const scores = sleepArr.map(s => Number((s as any).score ?? (s as any).sleepScore ?? 0));
      const sum = durations.reduce((a, b) => a + b, 0);
      return {
        nights: sleepArr.length,
        avgMin: sum / durations.length,
        latestScore: scores.length ? scores[0] : 0
      };
    };

    // --- compute aggregates ---
    const mealsT = aggregateMeals(mealLogToday || []);
    const mealsY = aggregateMeals(yesterdayLogs?.mealLogYesterday || []);

    const workoutsT = aggregateWorkouts(workoutLogToday || []);
    const workoutsY = aggregateWorkouts(yesterdayLogs?.workoutLogYesterday || []);

    const sleepT = aggregateSleep(sleepLogToday || []);
    const sleepY = aggregateSleep(yesterdayLogs?.sleepLogYesterday || []);

    // --- deltas (today - yesterday) ---
    const deltas = {
      calories: mealsT.calories - mealsY.calories,
      protein: mealsT.protein - mealsY.protein,
      carbs: mealsT.carbs - mealsY.carbs,
      fat: mealsT.fat - mealsY.fat,
      workoutSessions: workoutsT.sessions - workoutsY.sessions,
      steps: workoutsT.steps - workoutsY.steps,
      workoutDurationMin: workoutsT.durationMin - workoutsY.durationMin,
      sleepMin: (sleepT.avgMin || 0) - (sleepY.avgMin || 0)
    };

    // --- compact "facts" JSON for AI ---
    const facts = {
      profile: {
        goal: (userProfile as any)?.fitnessGoal ?? userProfile?.goal ?? 'general',
        weightKg: userProfile?.weight ?? null
      },
      goals: {
        calories: dailyGoals?.calories ?? null,
        protein: dailyGoals?.protein ?? null,
        carbs: dailyGoals?.carbs ?? null,
        fat: dailyGoals?.fat ?? null
      },
      today: {
        meals: mealsT,
        workouts: workoutsT,
        sleep: sleepT
      },
      yesterday: {
        meals: mealsY,
        workouts: workoutsY,
        sleep: sleepY
      },
      deltas
    };

    // --- improved prompt: structured + explicit comparison ---
    const prompt = `
You are an expert fitness & wellness coach. Using the provided JSON facts, produce a concise markdown summary targeted to the user's goal.

FACTS:
\`\`\`json
${JSON.stringify(facts, null, 2)}
\`\`\`

RULES:
- Output ONLY markdown with the headings:
  ### ✅ What Went Well
  ### 🤔 What Could Be Better
  ### 🚀 Tip for Tomorrow
  - Be more elaborate on few points and be specific to the data provided to you and cater to that user alone.
  - Be funny and creative also if possible but don't go off topic.
  - In "What Could Be Better", include one explicit comparison to yesterday (use the precomputed delta values). If yesterday data is absent, skip that line.
  - Use the user's primary goal to contextualize suggestions (e.g., emphasize added calories/protein for muscle gain, calorie control for fat loss).
  - Avoid long intros, filler, or repeating many raw numbers — translate numbers into short guidance (e.g., "~200 kcal under target", "~30 min less sleep").
- DO NOT repeat the raw JSON or filler sentences.
- Produce only the final markdown.

Now generate the summary.
`;

    const response = await (ai as any).models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt
    });

    return response.text;
  } catch (err) {
    console.error('getDailySummary error:', err);
    throw new Error('Could not generate daily summary.');
  }
};


export const getMealSuggestions = async (
  query: string,
  userProfile: UserProfile,
  dailyGoals: DailyGoals,
): Promise<string> => {
  try {
    const detailedPrompt = `
You are an expert AI nutritionist and chef.
A user is asking for a meal suggestion. Provide a helpful, actionable, and personalized response based on their profile and goals.

**User's Query:** "${query}"

**User Profile & Goals:**
- Primary Goal: **${userProfile.fitnessGoal}**
- Daily Calorie Target: ~${dailyGoals.calories.toFixed(0)} kcal
- Daily Protein Target: ~${dailyGoals.protein.toFixed(1)} g

**Your Task:**
1.  Analyze the user's query in the context of their fitness goal and dietary needs.
2.  Provide 1-3 specific meal or snack ideas that fit their request.
3.  Briefly explain **why** these suggestions are a good fit (e.g., "This is high in protein to support muscle gain," or "This is a low-calorie but filling option for weight loss.").
4.  If the user provides ingredients (e.g., "what to make with chicken"), give a simple recipe idea.
5.  Keep the tone encouraging and helpful.
6.  Format the response with simple markdown (e.g., using ### for headings and * or - for lists).

Respond with only the suggestion text. Do not include any intro text like "Here are some suggestions".
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: detailedPrompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error getting meal suggestions from Gemini:", error);
    throw new Error("Could not get suggestions at this time. Please try again.");
  }
};

const workoutSuggestionSchema = {
    type: Type.OBJECT,
    properties: {
        workoutTitle: {
            type: Type.STRING,
            description: "A short, descriptive title for the workout routine.",
        },
        description: {
            type: Type.STRING,
            description: "A brief (1-2 sentence) explanation of the workout's purpose and how it aligns with the user's goal."
        },
        exercises: {
            type: Type.ARRAY,
            description: "An array of exercises for the workout routine.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "The name of the exercise." },
                    sets: { type: Type.STRING, description: "Recommended number of sets (e.g., '3-4')." },
                    reps: { type: Type.STRING, description: "Recommended number of repetitions per set (e.g., '8-12')." },
                    notes: { type: Type.STRING, description: "Optional brief note about form or intensity (e.g., 'Focus on controlled movement')." },
                },
                required: ["name", "sets", "reps"],
            },
        },
    },
    required: ["workoutTitle", "description", "exercises"],
};

export const getWorkoutSuggestions = async (
  query: string,
  userProfile: UserProfile,
): Promise<string> => {
  try {
    const detailedPrompt = `
You are an expert AI personal trainer.
A user is asking for a workout suggestion. Provide a structured, helpful, and personalized workout plan based on their profile, goals, and specific query.

**User's Query:** "${query}"

**User Profile & Goals:**
- Primary Fitness Goal: **${userProfile.fitnessGoal}**
- Age: ${userProfile.age}
- Gender: ${userProfile.gender}
- Activity Level: ${userProfile.activityLevel}

**Your Task:**
1.  Analyze the user's query (e.g., "chest day", "leg workout", "quick cardio") in the context of their fitness goal.
2.  Create a suitable workout routine with a title, a brief description, and a list of 4-6 exercises.
3.  For each exercise, provide a clear recommendation for sets and reps.
4.  Add a brief, helpful note for some exercises if applicable (e.g., about form, rest times, or intensity).
5.  Respond ONLY with a JSON object in the specified format. Do not add any introductory text, explanations, or markdown formatting.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: detailedPrompt,
      config: {
          responseMimeType: "application/json",
          responseSchema: workoutSuggestionSchema,
      }
    });
    
    const jsonString = response.text.trim();
    return jsonString;

  } catch (error) {
    console.error("Error getting workout suggestions from Gemini:", error);
    throw new Error("Could not get workout suggestions at this time. Please try again.");
  }
};