import { useMemo, useState } from "react";
import {
  RiCloseLine,
  RiEditFill,
  RiFlag2Fill,
  RiSave3Fill,
} from "react-icons/ri";

const SALES_GOALS_STORAGE_KEY = "dashboard-sales-goals-overrides";
const DEFAULT_GOAL_PERIOD = "monthly";

const goalPeriodLabels = {
  weekly: "semanal",
  monthly: "mensual",
};

const statusStyles = {
  "Meta cumplida": "bg-green-400/15 text-green-300",
  "En cierre": "bg-[#C9A227]/15 text-[#C9A227]",
  "En progreso": "bg-[#6366f1]/15 text-[#a5b4fc]",
};

function getNumber(value, fallback = 0) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function formatCurrency(amount) {
  return `₡${Math.round(getNumber(amount, 0)).toLocaleString("es-CR")}`;
}

function getCurrentDateValue() {
  return new Date().toISOString().slice(0, 10);
}

function getDefaultEndDate(period = DEFAULT_GOAL_PERIOD) {
  const endDate = new Date();

  if (period === "weekly") {
    endDate.setDate(endDate.getDate() + 6);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  return endDate.toISOString().slice(0, 10);
}

function getGoalStatus(progress) {
  if (progress >= 100) {
    return "Meta cumplida";
  }

  if (progress >= 75) {
    return "En cierre";
  }

  return "En progreso";
}

function parseStoredGoals() {
  try {
    const storedGoals = window.localStorage.getItem(SALES_GOALS_STORAGE_KEY);
    const parsedGoals = storedGoals ? JSON.parse(storedGoals) : {};

    if (!parsedGoals || typeof parsedGoals !== "object") {
      return {
        goals: {},
        period: DEFAULT_GOAL_PERIOD,
        startDate: getCurrentDateValue(),
        endDate: getDefaultEndDate(DEFAULT_GOAL_PERIOD),
      };
    }

    if ("goals" in parsedGoals || "period" in parsedGoals) {
      const period = parsedGoals.period || DEFAULT_GOAL_PERIOD;

      return {
        goals:
          parsedGoals.goals && typeof parsedGoals.goals === "object"
            ? parsedGoals.goals
            : {},
        period,
        startDate: parsedGoals.startDate || getCurrentDateValue(),
        endDate: parsedGoals.endDate || getDefaultEndDate(period),
      };
    }

    return {
      goals: parsedGoals,
      period: DEFAULT_GOAL_PERIOD,
      startDate: getCurrentDateValue(),
      endDate: getDefaultEndDate(DEFAULT_GOAL_PERIOD),
    };
  } catch {
    return {
      goals: {},
      period: DEFAULT_GOAL_PERIOD,
      startDate: getCurrentDateValue(),
      endDate: getDefaultEndDate(DEFAULT_GOAL_PERIOD),
    };
  }
}

function applyGoalOverrides(goals, overrides) {
  return goals.map((goal) => {
    const soldRaw = getNumber(goal.soldRaw, 0);
    const goalRaw = getNumber(overrides[goal.id], getNumber(goal.goalRaw, 0));
    const remainingRaw = Math.max(goalRaw - soldRaw, 0);
    const progress = goalRaw > 0 ? Math.round((soldRaw / goalRaw) * 100) : 0;

    return {
      ...goal,
      sold: formatCurrency(soldRaw),
      goal: formatCurrency(goalRaw),
      remaining: formatCurrency(remainingRaw),
      soldRaw,
      goalRaw,
      remainingRaw,
      progress,
      status: getGoalStatus(progress),
    };
  });
}

export default function SalesGoals({
  goals = [],
  isLoading = false,
  error = null,
}) {
  const [goalSettings, setGoalSettings] = useState(parseStoredGoals);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const displayedGoals = useMemo(
    () => applyGoalOverrides(goals, goalSettings.goals || {}),
    [goals, goalSettings.goals],
  );
  const goalPeriodLabel =
    goalPeriodLabels[goalSettings.period] || goalPeriodLabels[DEFAULT_GOAL_PERIOD];

  const handleSaveGoals = (nextSettings) => {
    window.localStorage.setItem(
      SALES_GOALS_STORAGE_KEY,
      JSON.stringify(nextSettings),
    );
    setGoalSettings(nextSettings);
    setIsEditModalOpen(false);
  };

  return (
    <>
      <section className="bg-[#1c2538] border border-[#2a3550] rounded-xl p-5 mb-6">
        {!error && !isLoading && displayedGoals.length > 0 && (
          <div className="flex justify-start mb-4">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-2 bg-[#C9A227] hover:bg-[#B8921F] text-[#0B1120] text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <RiEditFill size={14} />
              Editar metas
            </button>
          </div>
        )}

        {error ? (
          <div className="py-8 text-center">
            <p className="text-sm text-red-400">
              No fue posible cargar los objetivos: {error}
            </p>
          </div>
        ) : isLoading ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-500">Cargando objetivos...</p>
          </div>
        ) : displayedGoals.length > 0 ? (
          <div className="max-h-[420px] overflow-y-auto pr-1 space-y-4">
            {displayedGoals.map((goal, index) => {
              const progress = Math.max(0, Math.min(Number(goal.progress) || 0, 100));
              const statusClass =
                statusStyles[goal.status] || statusStyles["En progreso"];

              return (
                <article
                  key={goal.id || `${goal.name}-${index}`}
                  className="border-b border-[#2a3550] pb-4 last:border-0"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded bg-[#C9A227]/15 text-[#C9A227] flex items-center justify-center flex-shrink-0">
                        <RiFlag2Fill size={15} />
                      </div>

                      <div className="min-w-0">
                        <div className="text-sm text-white font-medium truncate">
                          {goal.name}
                        </div>

                        <div className="text-xs text-gray-500 truncate">
                          {goal.company}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-medium rounded px-2 py-1 whitespace-nowrap ${statusClass}`}
                    >
                      {goal.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                    <div>
                      <p className="text-gray-500">Vendido</p>
                      <p className="text-white font-semibold mt-0.5">{goal.sold}</p>
                    </div>

                    <div>
                      <p className="text-gray-500">
                        Objetivo {goalPeriodLabel}
                      </p>
                      <p className="text-white font-semibold mt-0.5">{goal.goal}</p>
                    </div>

                    <div>
                      <p className="text-gray-500">Faltante</p>
                      <p className="text-white font-semibold mt-0.5">
                        {goal.remaining}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-[#C9A227]/15 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          progress >= 100
                            ? "bg-green-400"
                            : progress >= 75
                              ? "bg-[#C9A227]"
                              : "bg-[#6366f1]"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <span className="text-xs font-semibold text-white w-10 text-right">
                      {goal.progress}%
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-500">
              No hay ventas registradas para calcular objetivos.
            </p>
          </div>
        )}
      </section>

      {isEditModalOpen && (
        <SalesGoalsEditModal
          goals={displayedGoals}
          period={goalSettings.period || DEFAULT_GOAL_PERIOD}
          startDate={goalSettings.startDate || getCurrentDateValue()}
          endDate={
            goalSettings.endDate ||
            getDefaultEndDate(goalSettings.period || DEFAULT_GOAL_PERIOD)
          }
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveGoals}
        />
      )}
    </>
  );
}

function SalesGoalsEditModal({
  goals,
  period,
  startDate,
  endDate,
  onClose,
  onSave,
}) {
  const [draftPeriod, setDraftPeriod] = useState(period || DEFAULT_GOAL_PERIOD);
  const [draftStartDate, setDraftStartDate] = useState(
    startDate || getCurrentDateValue(),
  );
  const [draftEndDate, setDraftEndDate] = useState(
    endDate || getDefaultEndDate(period || DEFAULT_GOAL_PERIOD),
  );
  const [draftGoals, setDraftGoals] = useState(() =>
    goals.reduce((nextDraftGoals, goal) => {
      nextDraftGoals[goal.id] = String(Math.round(getNumber(goal.goalRaw, 0)));

      return nextDraftGoals;
    }, {}),
  );

  const handleDraftChange = (goalId, value) => {
    setDraftGoals((currentDraftGoals) => ({
      ...currentDraftGoals,
      [goalId]: value.replace(/[^\d.]/g, ""),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextGoals = goals.reduce((overrides, goal) => {
      const goalRaw = getNumber(draftGoals[goal.id], getNumber(goal.goalRaw, 0));

      overrides[goal.id] = Math.max(Math.round(goalRaw), 0);

      return overrides;
    }, {});

    onSave({
      goals: nextGoals,
      period: draftPeriod,
      startDate: draftStartDate,
      endDate: draftEndDate,
    });
  };

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar modal de metas"
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 cursor-default"
      />

      <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
        <form
          onSubmit={handleSubmit}
          className="bg-[#141d2e] border border-[#2a3550] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden"
        >
          <header className="flex items-start justify-between gap-4 border-b border-[#2a3550] px-5 py-4">
            <div>
              <h3 className="text-base font-bold text-white">
                Editar metas de agentes
              </h3>

              <p className="text-sm text-gray-400 mt-0.5">
                Actualiza el periodo, fechas y objetivo asignado a cada agente.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-[#222e44] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Cerrar"
              title="Cerrar"
            >
              <RiCloseLine size={20} />
            </button>
          </header>

          <div className="max-h-[60vh] overflow-y-auto px-5 py-4 space-y-4">
            <fieldset>
              <legend className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Periodo de la meta
              </legend>

              <div className="grid grid-cols-2 gap-2 rounded-lg bg-[#222e44] p-1 border border-[#2a3550]">
                {Object.entries(goalPeriodLabels).map(([value, label]) => {
                  const isSelected = draftPeriod === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setDraftPeriod(value)}
                      className={`rounded-md px-3 py-2 text-sm font-semibold capitalize transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[#C9A227] text-[#0B1120]"
                          : "text-gray-300 hover:text-white hover:bg-[#2a3550]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Fecha de inicio
                </span>

                <input
                  type="date"
                  value={draftStartDate}
                  onChange={(event) => setDraftStartDate(event.target.value)}
                  className="sales-goal-date-input w-full bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors"
                />
              </label>

              <label className="block">
                <span className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Fecha final
                </span>

                <input
                  type="date"
                  value={draftEndDate}
                  min={draftStartDate || undefined}
                  onChange={(event) => setDraftEndDate(event.target.value)}
                  className="sales-goal-date-input w-full bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors"
                />
              </label>
            </div>

            {goals.map((goal) => (
              <div
                key={goal.id}
                className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_150px_180px] gap-3 md:items-center border border-[#2a3550] rounded-lg p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">
                    {goal.name}
                  </p>

                  <p className="text-xs text-gray-500 truncate">
                    {goal.company}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Vendido</p>
                  <p className="text-sm text-white font-semibold">{goal.sold}</p>
                </div>

                <label className="block">
                  <span className="block text-xs text-gray-500 mb-1">
                    Meta {goalPeriodLabels[draftPeriod] || "asignada"}
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={draftGoals[goal.id] ?? ""}
                    onChange={(event) =>
                      handleDraftChange(goal.id, event.target.value)
                    }
                    className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors"
                  />
                </label>
              </div>
            ))}
          </div>

          <footer className="flex flex-col-reverse sm:flex-row gap-3 border-t border-[#2a3550] px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#FF0303] hover:bg-red-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="flex-1 bg-[#C9A227] hover:bg-[#B8921F] text-[#0B1120] text-sm font-semibold py-2.5 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <RiSave3Fill size={16} />
              Guardar cambios
            </button>
          </footer>
        </form>
      </div>
    </>
  );
}
