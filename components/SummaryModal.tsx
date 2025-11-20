// src/components/SummaryModal.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MealLogEntry, WorkoutLogEntry, SleepLogEntry, DailyGoals, UserProfile } from '../types';
import { toLocalISODate } from '../utils/dateHelpers';
import { getDailySummary } from '../services/geminiService';

interface SummaryModalProps {
  onClose: () => void;
  userProfile: UserProfile;
  dailyGoals: DailyGoals;

  // Today's logs (already filtered by selected date in App)
  mealLogToday: MealLogEntry[];
  workoutLogToday: WorkoutLogEntry[];
  sleepLogToday: SleepLogEntry[];
  waterLogToday?: { amount: number; timestamp?: string }[];

  // Yesterday's logs (App will pass these)
  mealLogYesterday?: MealLogEntry[];
  workoutLogYesterday?: WorkoutLogEntry[];
  sleepLogYesterday?: SleepLogEntry[];
  waterLogYesterday?: { amount: number; timestamp?: string }[];

  // Optional label to show the date being summarized
  dateLabel?: string;
}

/* ---------------- helpers ---------------- */
const sumMealItems = (meals: MealLogEntry[] = []) => {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, itemsCount: 0, mealsCount: 0 };
  meals.forEach(m => {
    totals.mealsCount++;
    const items = Array.isArray((m as any).items) ? (m as any).items : [];
    totals.itemsCount += items.length;
    items.forEach((it: any) => {
      totals.calories += Number(it?.calories ?? 0);
      totals.protein += Number(it?.protein ?? 0);
      totals.carbs += Number(it?.carbs ?? 0);
      totals.fat += Number(it?.fat ?? 0);
    });
  });
  return totals;
};

const sumWorkouts = (workouts: WorkoutLogEntry[] = []) => {
  const totals = { sessions: 0, steps: 0, duration: 0, types: {} as Record<string, number> };
  workouts.forEach(w => {
    totals.sessions++;
    totals.steps += Number((w as any).steps ?? 0);
    const items = Array.isArray((w as any).items) ? (w as any).items : [];
    items.forEach((it: any) => { totals.duration += Number(it?.duration ?? 0); });
    const key = (w as any).workoutType || 'Other';
    totals.types[key] = (totals.types[key] || 0) + 1;
  });
  return totals;
};

const sumSleep = (sleep: SleepLogEntry[] = []) => {
  if (!sleep.length) return { nights: 0, avgDuration: 0, latestScore: 0 };
  const durations = sleep.map(s => Number((s as any).duration ?? 0));
  const scores = sleep.map(s => Number((s as any).score ?? (s as any).sleepScore ?? 0));
  const sumDur = durations.reduce((a, b) => a + b, 0);
  const avg = sumDur / durations.length;
  return { nights: sleep.length, avgDuration: avg, latestScore: scores.length ? scores[0] : 0 };
};

const sumWater = (water: { amount: number }[] = []) => (water || []).reduce((s, w) => s + Number(w?.amount ?? 0), 0);

const percentChange = (today: number, yesterday: number) => {
  if (yesterday === 0) return today === 0 ? 0 : 100;
  return ((today - yesterday) / Math.abs(yesterday)) * 100;
};

const prettyNumber = (n: number, fixed = 0) => Number.isFinite(n) ? n.toFixed(fixed) : '0';

const formatToHtml = (text: string) => {
  if (!text) return '';
  return text
  .replace(/^###\s*(.*)$/gm, '<h3 class="text-slate-800 mt-4 mb-2 text-lg font-semibold">$1</h3>')
  .replace(/^##\s*(.*)$/gm, '<h2 class="text-slate-900 mt-4 mb-2 text-xl font-bold">$1</h2>')
  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="bg-slate-100 px-1 rounded">$1</code>')
    .replace(/✅/g, '<span class="mr-2 text-emerald-500">✅</span>')
    .replace(/🤔/g, '<span class="mr-2 text-amber-500">🤔</span>')
    .replace(/🚀/g, '<span class="mr-2 text-sky-500">🚀</span>')
    .replace(/### (.*)/g, '<h3 class="text-slate-800 mt-4 mb-2 text-lg font-semibold">$1</h3>')
    .replace(/## (.*)/g, '<h2 class="text-slate-900 mt-4 mb-2 text-xl font-bold">$1</h2>')
    .replace(/\n/g, '<br />');

};

/* ---------------- component ---------------- */
const SummaryModal: React.FC<SummaryModalProps> = ({
  onClose,
  userProfile,
  dailyGoals,
  mealLogToday,
  workoutLogToday,
  sleepLogToday,
  waterLogToday = [],
  mealLogYesterday = [],
  workoutLogYesterday = [],
  sleepLogYesterday = [],
  waterLogYesterday = [],
  dateLabel
}) => {

  // --- aggregates ---
  const mealToday = useMemo(() => sumMealItems(mealLogToday), [mealLogToday]);
  const mealYesterday = useMemo(() => sumMealItems(mealLogYesterday), [mealLogYesterday]);

  const workoutToday = useMemo(() => sumWorkouts(workoutLogToday), [workoutLogToday]);
  const workoutYesterday = useMemo(() => sumWorkouts(workoutLogYesterday), [workoutLogYesterday]);

  const sleepToday = useMemo(() => sumSleep(sleepLogToday), [sleepLogToday]);
  const sleepYesterday = useMemo(() => sumSleep(sleepLogYesterday), [sleepLogYesterday]);

  const waterToday = useMemo(() => sumWater(waterLogToday as any), [waterLogToday]);
  const waterYesterday = useMemo(() => sumWater(waterLogYesterday as any), [waterLogYesterday]);

  // --- deltas ---
  const calDelta = mealToday.calories - mealYesterday.calories;
  const calChangePercent = percentChange(mealToday.calories, mealYesterday.calories);

  const proteinDelta = mealToday.protein - mealYesterday.protein;
  const stepsDelta = workoutToday.steps - workoutYesterday.steps;
  const sleepDelta = sleepToday.avgDuration - sleepYesterday.avgDuration;

  // suggestions heuristics
  const suggestions: string[] = [];
  const gProtein = dailyGoals.protein ?? 0;
  const gCarbs = dailyGoals.carbs ?? 0;
  const gFat = dailyGoals.fat ?? 0;
  const gCalories = dailyGoals.calories ?? 0;

  if (gCalories && mealToday.calories < gCalories * 0.9) suggestions.push('You are below calorie target — if gaining muscle, consider adding a calorie-dense snack.');
  if (gCalories && mealToday.calories > gCalories * 1.15) suggestions.push('You exceeded calorie target by >15% — watch portion sizes if fat loss is a goal.');
  if (gProtein && mealToday.protein < gProtein * 0.9) suggestions.push('Protein is low — add a high-protein item (eg. greek yogurt, whey, chicken).');
  if (waterToday < Math.max(500, (userProfile?.weight ?? 0) * 35 * 0.5)) suggestions.push('Water intake is low — aim to sip regularly.');
  if (workoutToday.sessions === 0 && (mealToday.calories > gCalories * 0.9)) suggestions.push('No workouts logged today but calories are near target — consider a light cardio or walk.');
  if (sleepToday.avgDuration < (userProfile?.sleepGoal?.targetMinutes ?? 480) * 0.9) suggestions.push('Sleep shorter than your goal — prioritize consistent bedtime.');

  // --- plain text fallback (not shown by default, used for fallback and debugging) ---
  const buildPlainText = () => {
    const lines: string[] = [];
    const label = dateLabel ?? toLocalISODate(new Date());
    lines.push(`Summary for ${label}`);
    lines.push('---');
    lines.push(`Nutrition: ${mealToday.calories} kcal (${prettyNumber(mealToday.protein,1)}g protein, ${prettyNumber(mealToday.carbs,1)}g carbs, ${prettyNumber(mealToday.fat,1)}g fat).`);
    lines.push(`Compared to yesterday: ${calDelta >= 0 ? '+' : ''}${Math.round(calDelta)} kcal (${calChangePercent >= 0 ? '+' : ''}${prettyNumber(calChangePercent,1)}%). Protein change: ${proteinDelta >= 0 ? '+' : ''}${prettyNumber(proteinDelta,1)}g.`);
    lines.push('');
    lines.push(`Workouts: ${workoutToday.sessions} session(s), ${workoutToday.steps} steps, estimated ${Math.round(workoutToday.duration)} min total.`);
    lines.push(`Sleep: ${prettyNumber(sleepToday.avgDuration/60,1)} hrs avg (${sleepToday.nights} night(s)), latest score: ${prettyNumber(sleepToday.latestScore,0)}.`);
    lines.push(`Water: ${Math.round(waterToday)} ml today.`);
    if (suggestions.length) {
      lines.push('');
      lines.push('Suggestions:');
      suggestions.forEach((s, i) => lines.push(`${i+1}. ${s}`));
    }
    lines.push('');
    lines.push('Raw data (for AI):');
    lines.push(JSON.stringify({
      mealsToday: mealLogToday, workoutsToday: workoutLogToday, sleepToday: sleepLogToday, waterToday,
      mealsYesterday: mealLogYesterday, workoutsYesterday: workoutLogYesterday, sleepYesterday: sleepLogYesterday, waterYesterday
    }, null, 2));
    return lines.join('\n');
  };
  const plainText = useMemo(buildPlainText, [mealLogToday, workoutLogToday, sleepLogToday, mealLogYesterday, workoutLogYesterday, sleepLogYesterday, waterToday, waterYesterday, dateLabel]);

  // --- AI state ---
  const [aiSummaryMarkdown, setAiSummaryMarkdown] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(true);
  const [aiError, setAiError] = useState<string | null>(null);

  // --- request key guard to avoid repeat polling ---
  const lastRequestKeyRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    // Build a compact key representing the inputs that should trigger a new request.
    // JSON.stringify is cheap enough here; if logs get enormous you can hash or reduce shape.
    const keyObj = {
      profileId: userProfile?.id ?? userProfile?.username ?? null,
      goals: dailyGoals ?? null,
      // include counts and timestamps to avoid serializing entire nested objects if large
      todayCounts: {
        meals: mealLogToday.length,
        workouts: workoutLogToday.length,
        sleep: sleepLogToday.length,
        water: (waterLogToday || []).length
      },
      yesterdayCounts: {
        meals: mealLogYesterday.length,
        workouts: workoutLogYesterday.length,
        sleep: sleepLogYesterday.length,
        water: (waterLogYesterday || []).length
      },
      // last timestamps to detect changes in logs
      todayLastTimestamps: {
        meals: mealLogToday[0]?.timestamp ?? null,
        workouts: workoutLogToday[0]?.timestamp ?? null,
        sleep: sleepLogToday[0]?.timestamp ?? null
      },
      yesterdayLastTimestamps: {
        meals: mealLogYesterday[0]?.timestamp ?? null,
        workouts: workoutLogYesterday[0]?.timestamp ?? null,
        sleep: sleepLogYesterday[0]?.timestamp ?? null
      }
    };
    const newKey = JSON.stringify(keyObj);

    // If key unchanged and we have a result (or had an error), skip re-fetching.
    if (lastRequestKeyRef.current === newKey && (aiSummaryMarkdown !== null || aiError !== null)) {
      setAiLoading(false);
      return;
    }

    // update last key and fetch
    lastRequestKeyRef.current = newKey;
    let cancelled = false;
    const fetchAiSummary = async () => {
      setAiLoading(true);
      setAiError(null);
      try {
        const res = await getDailySummary(
          userProfile,
          mealLogToday,
          workoutLogToday,
          sleepLogToday,
          dailyGoals,
          { mealLogYesterday, workoutLogYesterday, sleepLogYesterday, waterLogYesterday }
        );
        if (cancelled || !mountedRef.current) return;
        setAiSummaryMarkdown(res?.trim() || null);
      } catch (err) {
        if (cancelled || !mountedRef.current) return;
        console.error('AI summary failed:', err);
        setAiError(err instanceof Error ? err.message : String(err));
        setAiSummaryMarkdown(null);
      } finally {
        if (cancelled || !mountedRef.current) return;
        setAiLoading(false);
      }
    };

    fetchAiSummary();

    // cancel function for race conditions/unmount
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Keep deps minimal & stable — the key above uses the detailed inputs.
    userProfile?.id,
    dailyGoals && JSON.stringify({ c: dailyGoals.calories, p: dailyGoals.protein }), // cheap check
    mealLogToday.length,
    workoutLogToday.length,
    sleepLogToday.length,
    mealLogToday[0]?.timestamp,
    workoutLogToday[0]?.timestamp,
    sleepLogToday[0]?.timestamp,
    mealLogYesterday.length,
    workoutLogYesterday.length,
    sleepLogYesterday.length,
    mealLogYesterday[0]?.timestamp,
    workoutLogYesterday[0]?.timestamp,
    sleepLogYesterday[0]?.timestamp,
    // water lists
    (waterLogToday || []).length,
    (waterLogYesterday || []).length
  ]);

  // --- small UI ---
  const StatCard: React.FC<{ title: string; main: string; sub?: string }> = ({ title, main, sub }) => (
    <div className="bg-white rounded-md shadow p-4">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="text-lg font-semibold text-slate-800">{main}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/40">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-2xl overflow-auto max-h-[90vh] relative">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-bold">Summary — {dateLabel ?? toLocalISODate(new Date())}</h2>
            <div className="text-sm text-slate-600">A concise, data-driven recap (AI-assisted)</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-sm px-3 py-2 bg-white border rounded-md">Close</button>
          </div>
        </div>

        {/* Loading overlay: blocks interaction until AI responds */}
        {aiLoading && (
          <div className="absolute inset-0 z-40 bg-white/80 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.3726 0 0 5.3726 0 12h4z"></path>
              </svg>
              <div className="mt-3 text-sm text-slate-700">Generating AI summary…</div>
            </div>
          </div>
        )}

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <StatCard title="Calories (today)" main={`${Math.round(mealToday.calories)} kcal`} sub={`Δ ${calDelta >= 0 ? '+' : ''}${Math.round(calDelta)} kcal (${prettyNumber(calChangePercent,1)}%)`} />
            <StatCard title="Protein (today)" main={`${prettyNumber(mealToday.protein,1)} g`} sub={`Δ ${proteinDelta >= 0 ? '+' : ''}${prettyNumber(proteinDelta,1)} g`} />
            <StatCard title="Workouts" main={`${workoutToday.sessions} sessions`} sub={`${workoutToday.steps} steps`} />
            <StatCard title="Sleep (avg)" main={`${prettyNumber((sleepToday.avgDuration/60),1)} hrs`} sub={`score ${prettyNumber(sleepToday.latestScore,0)}`} />
          </div>

          <div className="bg-white rounded-md shadow p-4">
            {!aiLoading && aiSummaryMarkdown ? (
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: formatToHtml(aiSummaryMarkdown) }} />
            ) : !aiLoading && !aiSummaryMarkdown ? (
              <>
                <div className="text-slate-700 mb-2">AI summary unavailable — local fallback applied.</div>
                <pre className="whitespace-pre-wrap break-words text-xs">{plainText}</pre>
                {aiError && <div className="text-xs text-rose-600 mt-3">AI error: {aiError}</div>}
              </>
            ) : null}
          </div>

          <div className="bg-white rounded-md shadow p-4">
            <h3 className="text-lg font-semibold text-indigo-600 mb-2">Nutrition</h3>
            <div className="text-slate-700 mb-2">
              Today you logged <strong>{mealToday.mealsCount}</strong> meal(s) with <strong>{mealToday.itemsCount}</strong> items, totaling <strong>{Math.round(mealToday.calories)} kcal</strong>.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 border rounded">
                <div className="text-xs text-slate-500">Protein</div>
                <div className="text-lg font-semibold">{prettyNumber(mealToday.protein,1)} g</div>
                <div className="text-xs text-slate-400 mt-1">Goal: {Math.round(gProtein)} g</div>
              </div>
              <div className="p-3 border rounded">
                <div className="text-xs text-slate-500">Carbs</div>
                <div className="text-lg font-semibold">{prettyNumber(mealToday.carbs,1)} g</div>
                <div className="text-xs text-slate-400 mt-1">Goal: {Math.round(gCarbs)} g</div>
              </div>
              <div className="p-3 border rounded">
                <div className="text-xs text-slate-500">Fat</div>
                <div className="text-lg font-semibold">{prettyNumber(mealToday.fat,1)} g</div>
                <div className="text-xs text-slate-400 mt-1">Goal: {Math.round(gFat)} g</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-md shadow p-4">
              <h3 className="text-lg font-semibold text-indigo-600 mb-2">Workouts</h3>
              <div className="text-slate-700 mb-2">
                {workoutToday.sessions > 0 ? `You did ${workoutToday.sessions} session(s) — ${workoutToday.steps} steps total, ~${Math.round(workoutToday.duration)} minutes across exercises.` : 'No workouts logged for this day.'}
              </div>
              {Object.keys(workoutToday.types).length > 0 && <div className="text-sm text-slate-600">Types: {Object.entries(workoutToday.types).map(([t, cnt]) => `${t} (${cnt})`).join(', ')}</div>}
            </div>

            <div className="bg-white rounded-md shadow p-4">
              <h3 className="text-lg font-semibold text-indigo-600 mb-2">Sleep</h3>
              <div className="text-slate-700 mb-2">
                {sleepToday.nights > 0 ? <>Average sleep: <strong>{prettyNumber(sleepToday.avgDuration/60, 1)} hrs</strong>. Latest score: <strong>{prettyNumber(sleepToday.latestScore,0)}</strong>.</> : <>No sleep logs for this date.</>}
              </div>
              <div className="text-xs text-slate-500">Compared to yesterday: Δ {prettyNumber(sleepDelta/60,1)} hrs</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-md shadow p-4">
              <h3 className="text-lg font-semibold text-indigo-600 mb-2">Hydration</h3>
              <div className="text-slate-700">{`You drank ${Math.round(waterToday)} ml today (${Math.round(waterYesterday)} ml yesterday).`}</div>
            </div>

            <div className="bg-white rounded-md shadow p-4">
              <h3 className="text-lg font-semibold text-indigo-600 mb-2">Actionable Suggestions</h3>
              {suggestions.length ? (
                <ol className="list-decimal list-inside text-slate-700">
                  {suggestions.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
              ) : <div className="text-slate-600">No urgent suggestions — keep it up 👍</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryModal;
