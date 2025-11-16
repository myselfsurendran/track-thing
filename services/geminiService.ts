
import { GoogleGenAI, Type } from "@google/genai";
import { DailyGoals, MealLogEntry, SleepLogEntry, UserProfile, WorkoutLogEntry } from '../types';

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

export const getDailySummary = async (
  userProfile: UserProfile,
  mealLog: MealLogEntry[],
  workoutLog: WorkoutLogEntry[],
  sleepLog: SleepLogEntry[],
  dailyGoals: DailyGoals
): Promise<string> => {
  try {
    const mealSummary = mealLog.reduce((acc, entry) => {
        entry.items.forEach(item => {
            acc.calories += item.calories;
            acc.protein += item.protein;
            acc.carbs += item.carbs;
            acc.fat += item.fat;
        });
        return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
    
    const latestSleep = sleepLog.length > 0 ? sleepLog[0] : null;

    const detailedPrompt = `
You are an expert AI fitness and wellness coach.
Your task is to provide a comprehensive, encouraging, and actionable summary of the user's day.

**User Profile & Goals:**
- Primary Goal: **${userProfile.fitnessGoal}**
- Daily Calorie Goal: ${dailyGoals.calories.toFixed(0)} kcal
- Daily Protein Goal: ${dailyGoals.protein.toFixed(1)} g

**Today's Data:**
- **Nutrition:**
  - Total Intake: ${mealSummary.calories.toFixed(0)} kcal, ${mealSummary.protein.toFixed(1)}g Protein, ${mealSummary.carbs.toFixed(1)}g Carbs, ${mealSummary.fat.toFixed(1)}g Fat.
  - Meals Logged: ${mealLog.length}
- **Workout:**
  - Workouts Logged: ${workoutLog.length}
  - Details: ${workoutLog.map(w => `${w.workoutType}: ${w.items.map(i => i.name).join(', ')}`).join('; ') || 'None'}
- **Sleep (Last Night):**
  - Duration: ${latestSleep ? `${(latestSleep.duration / 60).toFixed(1)} hours` : 'Not logged'}
  - Sleep Score: ${latestSleep ? `${latestSleep.score}/100` : 'Not logged'}

**Your Task:**
Format your response using simple markdown. Create three sections:
1.  "### ✅ What Went Well" - Highlight positive achievements. Be specific (e.g., "You hit your protein target which is fantastic for muscle growth," or "Logging all your meals is a huge step toward mindfulness.").
2.  "### 🤔 What Could Be Better" - Gently point out areas for improvement without being negative (e.g., "Your calorie intake was a bit low, which might make it harder to build muscle. Let's aim for one more snack tomorrow.").
3.  "### 🚀 A Tip for Tomorrow" - Provide one clear, simple, and actionable piece of advice for the next day based on today's data.

Keep the tone positive and motivational. Do not include any intro text like "Here's your summary".
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: detailedPrompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error getting daily summary from Gemini:", error);
    throw new Error("Could not get a daily summary at this time.");
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