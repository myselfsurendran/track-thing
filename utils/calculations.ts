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

    return {
        ...input,
        bmi,
        tdee,
        bfp,
    };
};

/**
 * Calculates daily calorie and macronutrient goals based on the user's profile.
 */
export const calculateDailyGoals = (profile: UserProfile): DailyGoals => {
    const { tdee, fitnessGoal, weight } = profile;
    let calorieGoal = tdee;

    switch (fitnessGoal) {
        case 'Lose Weight':
            calorieGoal -= 500; // 500 calorie deficit
            break;
        case 'Gain Muscle':
            calorieGoal += 300; // 300 calorie surplus
            break;
        case 'Maintain Weight':
        default:
            // No change
            break;
    }
    
    const macros = macroProfiles[fitnessGoal];
    // 4 calories per gram of protein/carbs, 9 calories per gram of fat
    const protein = (calorieGoal * macros.protein) / 4;
    const carbs = (calorieGoal * macros.carbs) / 4;
    const fat = (calorieGoal * macros.fat) / 9;

    // Water goal: ~35ml per kg of body weight
    const water = weight * 35;

    return {
        calories: calorieGoal,
        protein,
        carbs,
        fat,
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