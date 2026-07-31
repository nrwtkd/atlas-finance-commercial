import { readFile, writeFile } from "node:fs/promises";

const appPath = new URL("../src/App.tsx", import.meta.url);
let source = await readFile(appPath, "utf8");
let changed = false;

function patch(anchor, replacement, marker) {
  if (marker && source.includes(marker)) return;
  if (!source.includes(anchor)) throw new Error(`Atlas UI anchor missing: ${anchor.slice(0, 54)}`);
  source = source.replace(anchor, replacement);
  changed = true;
}

patch(
  '            onGoals={openGoals}\n            onHistory={() => setScreen("history")}',
  '            onGoals={openGoals}\n            onReflect={() => setScreen("reflect")}\n            onHistory={() => setScreen("history")}',
  'onReflect={() => setScreen("reflect")}'
);

const learnAnchor = '        {screen === "learn" && <LearningCenter progress={finance.learningProgress} onToggle={async (moduleId) => persist({ ...finance, learningProgress: finance.learningProgress.includes(moduleId) ? finance.learningProgress.filter((item) => item !== moduleId) : [...finance.learningProgress, moduleId] })} />}';
const storyScreen = `        {screen === "reflect" && (\n          <ReflectionCenter\n            finance={finance}\n            onSaveCheckIn={(entry) => persist({ ...finance, emotionalCheckIns: [entry, ...finance.emotionalCheckIns] })}\n            onSaveWin={(entry) => persist({ ...finance, financialWins: [entry, ...finance.financialWins] })}\n            onSaveMonthly={(entry) => persist({ ...finance, monthlyReflections: [entry, ...finance.monthlyReflections.filter((item) => item.month !== entry.month)] })}\n            onOpenLearning={() => setScreen("learn")}\n          />\n        )}\n\n${learnAnchor}`;
patch(learnAnchor, storyScreen, 'screen === "reflect"');

patch(
  '        <Nav label="Belajar" icon="✦" active={screen === "learn"} onClick={() => setScreen("learn")} />',
  '        <Nav label="Refleksi" icon="✦" active={screen === "reflect" || screen === "learn"} onClick={() => setScreen("reflect")} />',
  'label="Refleksi"'
);

patch(
  'function Home({ finance, stats, monthlyTransactions, currentPlan, onRecord, onBudget, onGoals, onHistory }: {',
  'function Home({ finance, stats, monthlyTransactions, currentPlan, onRecord, onBudget, onGoals, onReflect, onHistory }: {',
  'onGoals, onReflect, onHistory'
);

patch(
  'onGoals: () => void; onHistory: () => void }) {',
  'onGoals: () => void; onReflect: () => void; onHistory: () => void }) {',
  'onReflect: () => void; onHistory'
);

const goalCard = '      <GoalSnapshot goals={finance.goals} transactions={finance.transactions} onOpen={onGoals} />';
patch(goalCard, `${goalCard}\n      <ReflectionSnapshot finance={finance} onOpen={onReflect} />`, '<ReflectionSnapshot finance={finance}');

if (changed) await writeFile(appPath, source, "utf8");
console.log("Atlas insights UI ready");
