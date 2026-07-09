import { UserProfile, DailyGoals, ActivityLevel, FitnessGoal, Gender, SleepGoal, SleepLogEntry } from '../types';

type ProfileInput = Omit<UserProfile, 'bmi' | 'tdee' | 'bfp'>;

const activityMultipliers: Record<ActivityLevel, number> = {
    'Sedentary': 1.2,
    'Light': 1.375,
    'Moderate': 1.55,
    'Active': 1.725,
    'Very Active': 1.9,
};

// All macro percentages are based on total calories
const macroProfiles: Record<FitnessGoal, { protein: number, carbs: number, fat: number }> = {
    'Lose Weight':     { protein: 0.40, carbs: 0.30, fat: 0.30 },
    'Maintain Weight': { protein: 0.30, carbs: 0.40, fat: 0.30 },
    'Gain Muscle':     { protein: 0.35, carbs: 0.45, fat: 0.20 },
};

/**
 * Calculates Body Fat Percentage using the Navy Method.
 * Requires neck, waist, height. For females, also requires hip measurement.
 * All measurements in cm.
 */
export const calculateBodyFatPercentage = (profile: ProfileInput): number => {
    const { gender, height, neck, waist, hip } = profile;
    let bfp = 0;

    try {
      if (gender === 'Male') {
          if (waist > neck && height > 0) {
              bfp = 86.010 * Math.log10(waist - neck) - 70.041 * Math.log10(height) + 36.76;
          }
      } else { // Female
          if (hip && waist > 0 && neck > 0 && height > 0 && (waist + hip > neck)) {
              bfp = 163.205 * Math.log10(waist + hip - neck) - 97.684 * Math.log10(height) - 78.387;
          }
      }
    } catch (error) {
        console.error("Could not calculate BFP:", error);
        return 0;
    }
    
    return Math.max(0, parseFloat(bfp.toFixed(1))); // Ensure non-negative and format
};


/**
 * Calculates all derived health metrics based on user input.
 */
export const calculateMetrics = (input: ProfileInput): UserProfile => {
    const { weight, height, age, gender, activityLevel } = input;

    // 1. Calculate BMI
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);

    // 2. Calculate BMR (Mifflin-St Jeor)
    const genderConstant = gender === 'Male' ? 5 : -161;
    const bmr = (10 * weight) + (6.25 * height) - (5 * age) + genderConstant;

    // 3. Calculate TDEE
    const tdee = bmr * activityMultipliers[activityLevel];

    // 4. Calculate Body Fat Percentage
    const bfp = calculateBodyFatPercentage(input);

    // 5. Calculate Skeletal Muscle Mass (SMM)
    const lbm = weight * (1 - bfp / 100);
    const smm = Math.max(0, parseFloat((gender === 'Male' ? lbm * 0.57 : lbm * 0.47).toFixed(1)));

    return {
        ...input,
        bmi,
        tdee,
        bfp,
        smm,
    };
};

/**
 * Calculates daily calorie and macronutrient goals based on the user's profile.
 */
export const calculateDailyGoals = (profile: UserProfile): DailyGoals => {
    // protect inputs
    const rawTdee = Number(profile.tdee || 0);
    const weight = Number(profile.weight || 0);
    const goal = profile.fitnessGoal || 'Maintain Weight';
  
    // base calorie target
    let calorieGoal = Number.isFinite(rawTdee) && rawTdee > 0 ? Math.round(rawTdee) : 2000;
  
    if (goal === 'Lose Weight') calorieGoal -= 500;
    if (goal === 'Gain Muscle') calorieGoal += 300;
  
    // safety floor
    const MIN_CALORIES = 1200;
    calorieGoal = Math.max(MIN_CALORIES, Math.round(calorieGoal));
  
    // --- Protein: grams per kg (preferred for muscle) ---
    const proteinFactorByGoal: Record<FitnessGoal, number> = {
      'Lose Weight': 2.0,
      'Maintain Weight': 1.6,
      'Gain Muscle': 2.0,
    };
    const proteinG = Math.max(0, Math.round((proteinFactorByGoal[goal] || 1.6) * weight));
    const proteinCals = proteinG * 4;
  
    // --- Fat: sensible percentage of calories ---
    const fatPercentByGoal: Record<FitnessGoal, number> = {
      'Lose Weight': 0.28,
      'Maintain Weight': 0.25,
      'Gain Muscle': 0.25,
    };
    const fatCals = Math.round(calorieGoal * (fatPercentByGoal[goal] ?? 0.25));
    const fatG = Math.max(0, Math.round(fatCals / 9));
  
    // --- Carbs: remaining calories -->
    const remainingCals = Math.max(0, calorieGoal - proteinCals - fatCals);
    const carbsG = Math.round(remainingCals / 4);
  
    // Water (ml)
    const water = Math.round(weight > 0 ? weight * 35 : 2000);
  
    return {
      calories: calorieGoal,
      protein: proteinG,
      carbs: carbsG,
      fat: fatG,
      water,
    };
  };
  
/**
 * Calculates a sleep score based on adherence to goals.
 * @param log - The sleep log entry for a given night.
 * @param goal - The user's defined sleep goal.
 * @returns A score from 0 to 100.
 */
export const calculateSleepScore = (
    log: Pick<SleepLogEntry, 'sleepTime' | 'wakeupTime' | 'duration'>,
    goal: SleepGoal
): number => {
    // Helper to convert "HH:mm" to minutes from midnight
    const timeToMinutes = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    // Helper to calculate difference between two times in minutes, handling midnight wrap-around
    const timeDifference = (time1: number, time2: number) => {
        const diff = Math.abs(time1 - time2);
        // If difference is more than 12 hours, it's shorter to wrap around the clock
        return Math.min(diff, 24 * 60 - diff);
    };

    const targetBedtime = timeToMinutes(goal.bedtime);
    const targetWakeupTime = timeToMinutes(goal.wakeupTime);
    let targetDuration = targetWakeupTime - targetBedtime;
    if (targetDuration < 0) {
        targetDuration += 24 * 60; // Add 24 hours if it wraps past midnight
    }

    const actualBedtime = new Date(log.sleepTime).getHours() * 60 + new Date(log.sleepTime).getMinutes();
    const actualWakeupTime = new Date(log.wakeupTime).getHours() * 60 + new Date(log.wakeupTime).getMinutes();
    const actualDuration = log.duration;

    // --- Scoring Logic ---
    // 1. Duration Score (50 points)
    const durationDiff = Math.abs(targetDuration - actualDuration);
    // Full score if within 15 mins, linear penalty up to 2 hours diff
    const durationScore = Math.max(0, 1 - (Math.max(0, durationDiff - 15) / 105)) * 50;
    
    // 2. Bedtime Score (25 points)
    const bedtimeDiff = timeDifference(actualBedtime, targetBedtime);
     // Full score if within 15 mins, linear penalty up to 2 hours diff
    const bedtimeScore = Math.max(0, 1 - (Math.max(0, bedtimeDiff - 15) / 105)) * 25;

    // 3. Wake-up Time Score (25 points)
    const wakeupDiff = timeDifference(actualWakeupTime, targetWakeupTime);
     // Full score if within 15 mins, linear penalty up to 2 hours diff
    const wakeupScore = Math.max(0, 1 - (Math.max(0, wakeupDiff - 15) / 105)) * 25;

    const totalScore = Math.round(durationScore + bedtimeScore + wakeupScore);

    return Math.max(0, Math.min(totalScore, 100)); // Clamp between 0 and 100
};