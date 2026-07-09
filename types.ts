export interface MealItem {
  name: string;
  quantity: number;
  unit?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealLogEntry {
  id: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Unknown';
  items: MealItem[];
  timestamp: string;
  rawInput?: string;
}

export interface NutrientSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type Gender = 'Male' | 'Female';
export type ActivityLevel = 'Sedentary' | 'Light' | 'Moderate' | 'Active' | 'Very Active';
export type FitnessGoal = 'Lose Weight' | 'Maintain Weight' | 'Gain Muscle';

export interface SleepGoal {
    bedtime: string; // "HH:mm"
    wakeupTime: string; // "HH:mm"
}

export interface UserProfile {
    id?: string; // UID from Firebase Auth
    name: string;
    age: number;
    gender: Gender;
    weight: number; // in kg
    height: number; // in cm
    neck: number; // in cm
    waist: number; // in cm
    hip?: number; // in cm, for females
    activityLevel: ActivityLevel;
    fitnessGoal: FitnessGoal;
    sleepGoal: SleepGoal;
    username?: string;
    geminiApiKey?: string;
    // Calculated values
    bmi: number;
    tdee: number;
    bfp: number; // body fat percentage
    smm?: number; // skeletal muscle mass in kg
    customGoals?: DailyGoals;
}

export interface DailyGoals {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    water: number; // in ml
}

export interface WorkoutItem {
    name: string;
    sets?: number;
    reps?: number;
    weight?: number; // in kg
    duration?: number; // in minutes
    distance?: number; // in km
}

export interface WorkoutLogEntry {
    id: string;
    workoutType: 'Strength' | 'Cardio' | 'Mixed' | 'Other';
    items: WorkoutItem[];
    timestamp: string;
    steps?: number;
}

export interface SleepLogEntry {
    id: string;
    sleepTime: string; // ISO String
    wakeupTime: string; // ISO String
    duration: number; // in minutes
    score: number; // 0-100
    timestamp: string; // Date of wakeup
}

export interface WaterLogEntry {
    id: string;
    amount: number; // in ml
    timestamp: string;
}