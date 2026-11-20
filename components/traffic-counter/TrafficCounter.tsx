"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { App } from "@capacitor/app";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import {
  Session,
  CurrentCounts,
  DirectionCount,
  SIMPANG_CATEGORIES,
  RUAS_CATEGORIES,
  STORAGE_KEY,
  HISTORY_STORAGE_KEY,
} from "./types";
import {
  generateId,
  getCurrentIntervalIndex,
  getIntervalElapsed,
  formatTimeRange,
  getAllVehicles,
  cloneCategories,
} from "./helpers";
import { handleExportXLSX } from "./exportUtils";
import SetupScreen from "./SetupScreen";
import CountingScreen from "./CountingScreen";
import RecapScreen from "./RecapScreen";
import styles from "./TrafficCounter.module.css";

export default function TrafficCounter() {
  const [screen, setScreen] = useState<"setup" | "counting" | "recap">("setup");

  const [session, setSession] = useState<Session>({
    name: "",
    observer: "",
    startTime: new Date().toISOString().slice(0, 16),
    intervalMinutes: 15,
    surveyType: "simpang",
    weather: "",
    roadName: "",
    flowDirections: "",
    intersections: [
      { id: generateId(), name: "Simpang A", direction: "", pendekat: "" },
      { id: generateId(), name: "Simpang B", direction: "", pendekat: "" },
    ],
    categories: cloneCategories(SIMPANG_CATEGORIES),
    data: {},
    status: "idle",
    elapsedSeconds: 0,
    totalIntervals: 0,
  });

  const [currentCounts, setCurrentCounts] = useState<CurrentCounts>();
  const [activeIntersectionId, setActiveIntersectionId] = useState<string>("");
  const [lastAction, setLastAction] = useState<{
    intersectionId: string;
    vehicleId: string;
    direction?: "left" | "straight" | "right";
    type: "increment" | "decrement";
  } | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [backNotice, setBackNotice] = useState("");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const backNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastBackPressRef = useRef(0);
  const lastIntervalRef = useRef<number>(0);
  const stateRef = useRef({
    screen: "setup" as string,
    session,
    currentCounts: {} as CurrentCounts,
    activeIntersectionId: "",
  });

  useEffect(() => {
    stateRef.current = {
      screen,
      session,
      currentCounts: currentCounts || {},
      activeIntersectionId,
    };
  }, [screen, session, currentCounts, activeIntersectionId]);

  useEffect(() => {
    if (Capacitor.getPlatform() !== "android") return;

    let active = true;
    let backButtonListener: PluginListenerHandle | undefined;

    const showBackNotice = (message: string) => {
      setBackNotice(message);
      if (backNoticeTimerRef.current) {
        clearTimeout(backNoticeTimerRef.current);
      }
      backNoticeTimerRef.current = setTimeout(() => {
        setBackNotice("");
        lastBackPressRef.current = 0;
        backNoticeTimerRef.current = null;
      }, 2000);
    };

    const onBackButton = () => {
      if (screen === "counting") {
        showBackNotice(
          "Sesi sedang berlangsung. Tekan Selesai untuk mengakhiri survei.",
        );
        return;
      }

      const now = Date.now();
      if (now - lastBackPressRef.current < 2000) {
        void App.exitApp().catch((error: unknown) => {
          console.error("Gagal menutup aplikasi:", error);
          showBackNotice("Aplikasi tidak dapat ditutup.");
        });
        return;
      }

      lastBackPressRef.current = now;
      showBackNotice("Tekan tombol kembali sekali lagi untuk keluar.");
    };

    void App.addListener("backButton", onBackButton)
      .then((listener) => {
        if (active) {
          backButtonListener = listener;
        } else {
          void listener.remove();
        }
      })
      .catch((error: unknown) => {
        console.error("Gagal memasang handler tombol kembali:", error);
      });

    return () => {
      active = false;
      if (backButtonListener) void backButtonListener.remove();
      if (backNoticeTimerRef.current) {
        clearTimeout(backNoticeTimerRef.current);
        backNoticeTimerRef.current = null;
      }
    };
  }, [screen]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.screen === "counting" || parsed.screen === "recap") {
          const restoredSession = {
            ...parsed.session,
            surveyType: parsed.session?.surveyType || "simpang",
            weather: parsed.session?.weather || "",
            roadName: parsed.session?.roadName || "",
            flowDirections: parsed.session?.flowDirections || "",
            categories: parsed.session?.categories || [],
          };
          setSession(restoredSession);
          setCurrentCounts(parsed.currentCounts || {});
          setActiveIntersectionId(
            parsed.activeIntersectionId ||
              restoredSession?.intersections?.[0]?.id ||
              "",
          );
          setScreen(parsed.screen);
          if (parsed.screen === "counting") {
            lastIntervalRef.current = getCurrentIntervalIndex(
              restoredSession.elapsedSeconds,
              restoredSession.intervalMinutes,
            );
          }
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (raw) setSessionHistory(JSON.parse(raw));
    } catch {}
  }, []);

  const persistState = useCallback(() => {
    try {
      const s = stateRef.current;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {}
  }, []);

  useEffect(() => {
    if (screen === "counting") {
      saveRef.current = setInterval(persistState, 5000);
    }
    return () => {
      if (saveRef.current) clearInterval(saveRef.current);
    };
  }, [screen, persistState]);

  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (screen === "counting" && session.status === "running") {
      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setSession((prev) => {
          const newElapsed = prev.elapsedSeconds + 1;
          const currentInterval = getCurrentIntervalIndex(
            newElapsed,
            prev.intervalMinutes,
          );

          if (currentInterval > lastIntervalRef.current) {
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

            const snapshot = stateRef.current.currentCounts;
            const savedData = { ...prev.data };
            for (const intersectionId of Object.keys(snapshot)) {
              if (!savedData[intersectionId]) savedData[intersectionId] = {};
              savedData[intersectionId][String(lastIntervalRef.current)] = {
                ...snapshot[intersectionId],
              };
            }

            setCurrentCounts({});
            setSession((s) => ({
              ...s,
              data: savedData,
              totalIntervals: Math.max(s.totalIntervals, currentInterval),
            }));
            lastIntervalRef.current = currentInterval;
          }

          return { ...prev, elapsedSeconds: newElapsed };
        });
      }, 1000);
    } else {
      pauseTimer();
    }

    return () => pauseTimer();
  }, [screen, session.status, pauseTimer]);

  const increment = useCallback(
    (
      vehicleId: string,
      direction?: "left" | "straight" | "right",
      intersectionId?: string,
    ) => {
      const targetId = intersectionId || activeIntersectionId;
      if (!targetId || session.status === "done") return;
      setCurrentCounts((prev) => {
        const updated = { ...prev };
        if (!updated[targetId]) updated[targetId] = {};
        if (session.surveyType === "simpang" && direction) {
          const current = (updated[targetId][vehicleId] as DirectionCount) || {
            left: 0,
            straight: 0,
            right: 0,
          };
          updated[targetId] = {
            ...updated[targetId],
            [vehicleId]: { ...current, [direction]: current[direction] + 1 },
          };
        } else {
          updated[targetId] = {
            ...updated[targetId],
            [vehicleId]: ((updated[targetId][vehicleId] as number) || 0) + 1,
          };
        }
        return updated;
      });
      setLastAction({
        intersectionId: targetId,
        vehicleId,
        direction,
        type: "increment",
      });
    },
    [activeIntersectionId, session.status, session.surveyType],
  );

  const decrement = useCallback(
    (
      vehicleId: string,
      direction?: "left" | "straight" | "right",
      intersectionId?: string,
    ) => {
      const targetId = intersectionId || activeIntersectionId;
      if (!targetId || session.status === "done") return;
      setCurrentCounts((prev) => {
        const updated = { ...prev };
        if (!updated[targetId]) updated[targetId] = {};
        if (session.surveyType === "simpang" && direction) {
          const current = (updated[targetId][vehicleId] as DirectionCount) || {
            left: 0,
            straight: 0,
            right: 0,
          };
          if (current[direction] <= 0) return prev;
          updated[targetId] = {
            ...updated[targetId],
            [vehicleId]: { ...current, [direction]: current[direction] - 1 },
          };
        } else {
          const current = (updated[targetId][vehicleId] as number) || 0;
          if (current <= 0) return prev;
          updated[targetId] = {
            ...updated[targetId],
            [vehicleId]: current - 1,
          };
        }
        return updated;
      });
      setLastAction({
        intersectionId: targetId,
        vehicleId,
        direction,
        type: "decrement",
      });
    },
    [activeIntersectionId, session.status, session.surveyType],
  );

  const undoLast = useCallback(() => {
    if (!lastAction) return;
    const { intersectionId, vehicleId, direction, type } = lastAction;
    setCurrentCounts((prev) => {
      const updated = { ...prev };
      if (!updated[intersectionId]) return prev;
      if (direction) {
        const current = (updated[intersectionId][
          vehicleId
        ] as DirectionCount) || { left: 0, straight: 0, right: 0 };
        if (type === "increment" && current[direction] > 0) {
          updated[intersectionId] = {
            ...updated[intersectionId],
            [vehicleId]: { ...current, [direction]: current[direction] - 1 },
          };
        } else if (type === "decrement") {
          updated[intersectionId] = {
            ...updated[intersectionId],
            [vehicleId]: { ...current, [direction]: current[direction] + 1 },
          };
        }
      } else {
        const current = (updated[intersectionId][vehicleId] as number) || 0;
        if (type === "increment" && current > 0) {
          updated[intersectionId] = {
            ...updated[intersectionId],
            [vehicleId]: current - 1,
          };
        } else if (type === "decrement") {
          updated[intersectionId] = {
            ...updated[intersectionId],
            [vehicleId]: current + 1,
          };
        }
      }
      return updated;
    });
    setLastAction(null);
  }, [lastAction]);

  const handleStartSession = useCallback(() => {
    if (
      !session.name.trim() ||
      !session.observer.trim() ||
      session.intersections.length === 0
    )
      return;
    const freshSession: Session = {
      ...session,
      startTime: session.startTime || new Date().toISOString().slice(0, 16),
      status: "running",
      elapsedSeconds: 0,
      totalIntervals: 0,
      data: {},
    };
    setSession(freshSession);
    setActiveIntersectionId(freshSession.intersections[0].id);
    lastIntervalRef.current = 0;

    const counts: CurrentCounts = {};
    const allVehicles = getAllVehicles(freshSession.categories);
    freshSession.intersections.forEach((inter) => {
      counts[inter.id] = {};
      allVehicles.forEach((v) => {
        if (freshSession.surveyType === "simpang") {
          counts[inter.id][v.id] = { left: 0, straight: 0, right: 0 };
        } else {
          counts[inter.id][v.id] = 0;
        }
      });
    });
    setCurrentCounts(counts);
    setScreen("counting");
    persistState();
  }, [session, persistState]);

  const handlePause = useCallback(() => {
    pauseTimer();
    setSession((prev) => ({ ...prev, status: "paused" }));
    persistState();
  }, [pauseTimer, persistState]);
  const handleResume = useCallback(() => {
    setSession((prev) => ({ ...prev, status: "running" }));
    persistState();
  }, [persistState]);

  const handleFinishConfirm = useCallback(() => {
    pauseTimer();
    const snapshot = stateRef.current;
    const savedData = { ...snapshot.session.data };
    const currentInterval = lastIntervalRef.current;
    for (const intersectionId of Object.keys(snapshot.currentCounts)) {
      if (!savedData[intersectionId]) savedData[intersectionId] = {};
      savedData[intersectionId][String(currentInterval)] = {
        ...snapshot.currentCounts[intersectionId],
      };
    }
    const completedSession = {
      ...snapshot.session,
      data: savedData,
      status: "done" as const,
      totalIntervals: currentInterval + 1,
      completedAt: new Date().toISOString(),
    };
    setSession(completedSession);
    setShowFinishConfirm(false);
    setScreen("recap");
    persistState();
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      const history = raw ? JSON.parse(raw) : [];
      history.unshift(completedSession);
      if (history.length > 50) history.length = 50;
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
      setSessionHistory(history);
    } catch {}
  }, [pauseTimer, persistState]);

  const addIntersection = useCallback(() => {
    if (session.intersections.length >= 8) return;
    const count = session.intersections.length + 1;
    const letter = String.fromCharCode(64 + count);
    setSession((prev) => ({
      ...prev,
      intersections: [
        ...prev.intersections,
        {
          id: generateId(),
          name: `Simpang ${letter}`,
          direction: "",
          pendekat: "",
        },
      ],
    }));
  }, [session.intersections.length]);

  const removeIntersection = useCallback((id: string) => {
    setSession((prev) => ({
      ...prev,
      intersections: prev.intersections.filter((i) => i.id !== id),
    }));
  }, []);
  const updateIntersection = useCallback(
    (id: string, field: "name" | "direction" | "pendekat", value: string) => {
      setSession((prev) => ({
        ...prev,
        intersections: prev.intersections.map((i) =>
          i.id === id ? { ...i, [field]: value } : i,
        ),
      }));
    },
    [],
  );

  const addCategory = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      categories: [
        ...prev.categories,
        {
          id: generateId(),
          name: "Kategori Baru",
          short: "KB",
          icon: "🚙",
          vehicles: [
            {
              id: generateId(),
              name: "Kendaraan Baru",
              short: "KB",
              icon: "🚙",
            },
          ],
        },
      ],
    }));
  }, []);

  const removeCategory = useCallback((id: string) => {
    setSession((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id),
    }));
  }, []);
  const updateCategory = useCallback(
    (id: string, field: "name" | "short" | "icon", value: string) => {
      setSession((prev) => ({
        ...prev,
        categories: prev.categories.map((c) =>
          c.id === id ? { ...c, [field]: value } : c,
        ),
      }));
    },
    [],
  );

  const addVehicleToCategory = useCallback((catId: string) => {
    setSession((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === catId
          ? {
              ...c,
              vehicles: [
                ...c.vehicles,
                {
                  id: generateId(),
                  name: "Kendaraan Baru",
                  short: "KB",
                  icon: "🚙",
                },
              ],
            }
          : c,
      ),
    }));
  }, []);

  const removeVehicleFromCategory = useCallback(
    (catId: string, vehicleId: string) => {
      setSession((prev) => ({
        ...prev,
        categories: prev.categories.map((c) =>
          c.id === catId
            ? { ...c, vehicles: c.vehicles.filter((v) => v.id !== vehicleId) }
            : c,
        ),
      }));
    },
    [],
  );

  const updateVehicle = useCallback(
    (
      catId: string,
      vehicleId: string,
      field: "name" | "short" | "icon",
      value: string,
    ) => {
      setSession((prev) => ({
        ...prev,
        categories: prev.categories.map((c) =>
          c.id === catId
            ? {
                ...c,
                vehicles: c.vehicles.map((v) =>
                  v.id === vehicleId ? { ...v, [field]: value } : v,
                ),
              }
            : c,
        ),
      }));
    },
    [],
  );

  const handleSurveyTypeChange = useCallback((type: "ruas" | "simpang") => {
    setSession((prev) => ({
      ...prev,
      surveyType: type,
      categories: cloneCategories(
        type === "ruas" ? RUAS_CATEGORIES : SIMPANG_CATEGORIES,
      ),
    }));
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    setExportError(null);
    try {
      await handleExportXLSX(session);
    } catch (error) {
      console.error("Gagal mengekspor file XLSX:", error);
      const message =
        error instanceof Error ? error.message : "Kesalahan tidak diketahui";
      setExportError(`Gagal mengekspor file: ${message}`);
    } finally {
      setExporting(false);
    }
  }, [session]);

  const handleReset = useCallback(() => {
    pauseTimer();
    localStorage.removeItem(STORAGE_KEY);
    setSession({
      name: "",
      observer: "",
      startTime: new Date().toISOString().slice(0, 16),
      intervalMinutes: 15,
      surveyType: "simpang",
      weather: "",
      roadName: "",
      flowDirections: "",
      intersections: [
        { id: generateId(), name: "Simpang A", direction: "", pendekat: "" },
        { id: generateId(), name: "Simpang B", direction: "", pendekat: "" },
      ],
      categories: cloneCategories(SIMPANG_CATEGORIES),
      data: {},
      status: "idle",
      elapsedSeconds: 0,
      totalIntervals: 0,
    });
    setCurrentCounts({});
    setActiveIntersectionId("");
    setLastAction(null);
    setExportError(null);
    setScreen("setup");
  }, [pauseTimer]);

  const allVehiclesFlat = useMemo(
    () => getAllVehicles(session.categories),
    [session.categories],
  );
  const canStart =
    session.name.trim().length > 0 &&
    session.observer.trim().length > 0 &&
    session.intersections.length > 0 &&
    allVehiclesFlat.length > 0;

  const currentIntervalIndex = getCurrentIntervalIndex(
    session.elapsedSeconds,
    session.intervalMinutes,
  );
  const intervalElapsed = getIntervalElapsed(
    session.elapsedSeconds,
    session.intervalMinutes,
  );
  const intervalTotal = session.intervalMinutes * 60;
  const progressPercent =
    intervalTotal > 0 ? (intervalElapsed / intervalTotal) * 100 : 0;
  const timeRangeLabel = formatTimeRange(
    currentIntervalIndex * session.intervalMinutes * 60,
    session.intervalMinutes,
  );
  const backNoticeElement = backNotice ? (
    <div className={styles.backNotice} role="status" aria-live="polite">
      {backNotice}
    </div>
  ) : null;

  useEffect(() => {
    if (screen !== "counting" || session.surveyType === "simpang") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      const idx = parseInt(e.key) - 1;
      if (idx >= 0 && idx < allVehiclesFlat.length)
        increment(allVehiclesFlat[idx].id);
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        undoLast();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screen, session.surveyType, allVehiclesFlat, increment, undoLast]);

  if (screen === "setup") {
    return (
      <>
        {backNoticeElement}
        <SetupScreen
          session={session}
          sessionHistory={sessionHistory}
          showHistory={showHistory}
          canStart={canStart}
          onSessionChange={setSession}
          onSurveyTypeChange={handleSurveyTypeChange}
          onAddIntersection={addIntersection}
          onRemoveIntersection={removeIntersection}
          onUpdateIntersection={updateIntersection}
          onAddCategory={addCategory}
          onRemoveCategory={removeCategory}
          onUpdateCategory={updateCategory}
          onAddVehicle={addVehicleToCategory}
          onRemoveVehicle={removeVehicleFromCategory}
          onUpdateVehicle={updateVehicle}
          onStartSession={handleStartSession}
          onToggleHistory={() => setShowHistory(!showHistory)}
          onViewHistorySession={(h) => {
            setSession(h);
            setScreen("recap");
            setShowHistory(false);
          }}
        />
      </>
    );
  }

  if (screen === "counting") {
    return (
      <>
        {backNoticeElement}
        <CountingScreen
          session={session}
          currentCounts={currentCounts || {}}
          activeIntersectionId={activeIntersectionId}
          lastAction={lastAction}
          showFinishConfirm={showFinishConfirm}
          currentIntervalIndex={currentIntervalIndex}
          timeRangeLabel={timeRangeLabel}
          intervalElapsed={intervalElapsed}
          intervalTotal={intervalTotal}
          progressPercent={progressPercent}
          allVehiclesFlat={allVehiclesFlat}
          onIncrement={increment}
          onDecrement={decrement}
          onUndoLast={undoLast}
          onPause={handlePause}
          onResume={handleResume}
          onFinishClick={() => setShowFinishConfirm(true)}
          onFinishConfirm={handleFinishConfirm}
          onCancelFinish={() => setShowFinishConfirm(false)}
          onTabChange={setActiveIntersectionId}
        />
      </>
    );
  }

  if (screen === "recap") {
    return (
      <>
        {backNoticeElement}
        <RecapScreen
          session={session}
          sessionHistory={sessionHistory}
          showHistory={showHistory}
          exporting={exporting}
          exportError={exportError}
          onExport={handleExport}
          onReset={handleReset}
          onToggleHistory={() => setShowHistory(!showHistory)}
          onViewHistorySession={(h) => {
            setSession(h);
          }}
          onDismissError={() => setExportError(null)}
        />
      </>
    );
  }

  return null;
}
