"use client";

import { Session, CurrentCounts, DirectionCount, TAB_COLORS } from './types';
import { formatTime } from './helpers';
import styles from './TrafficCounter.module.css';

interface Props {
  session: Session;
  currentCounts: CurrentCounts;
  activeIntersectionId: string;
  lastAction: { intersectionId: string; vehicleId: string; direction?: 'left' | 'straight' | 'right'; type: 'increment' | 'decrement' } | null;
  showFinishConfirm: boolean;
  currentIntervalIndex: number;
  timeRangeLabel: string;
  intervalElapsed: number;
  intervalTotal: number;
  progressPercent: number;
  allVehiclesFlat: { id: string; name: string; short: string; icon: string }[];
  onIncrement: (vehicleId: string, direction?: 'left' | 'straight' | 'right', intersectionId?: string) => void;
  onDecrement: (vehicleId: string, direction?: 'left' | 'straight' | 'right', intersectionId?: string) => void;
  onUndoLast: () => void;
  onPause: () => void;
  onResume: () => void;
  onFinishClick: () => void;
  onFinishConfirm: () => void;
  onCancelFinish: () => void;
  onTabChange: (id: string) => void;
}

export default function CountingScreen({
  session,
  currentCounts,
  activeIntersectionId,
  lastAction,
  showFinishConfirm,
  currentIntervalIndex,
  timeRangeLabel,
  intervalElapsed,
  intervalTotal,
  progressPercent,
  allVehiclesFlat,
  onIncrement,
  onDecrement,
  onUndoLast,
  onPause,
  onResume,
  onFinishClick,
  onFinishConfirm,
  onCancelFinish,
  onTabChange,
}: Props) {
  return (
    <div className={styles.app}>
      {showFinishConfirm && (
        <div className={styles.overlay} onClick={onCancelFinish}>
          <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.dialogTitle}>Selesaikan Survei?</h3>
            <p className={styles.dialogText}>
              Data interval saat ini akan disimpan dan sesi akan diakhiri.
              Anda tidak dapat melanjutkan pencacahan setelah ini.
            </p>
            <div className={styles.dialogActions}>
              <button className={styles.dialogCancel} onClick={onCancelFinish}>
                Batal
              </button>
              <button className={styles.dialogConfirm} onClick={onFinishConfirm}>
                Ya, Selesaikan
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.topBar}>
        <div className={styles.topBarRow}>
          <div className={styles.sessionName}>{session.name}</div>
          <div className={styles.timer}>
            <span className={styles.timerIcon}>
              {session.status === 'running' ? '⏱' : '⏸'}
            </span>
            <span className={styles.timerText}>{formatTime(session.elapsedSeconds)}</span>
          </div>
        </div>

        <div className={styles.intervalInfo}>
          <span className={styles.intervalLabel}>
            Interval {currentIntervalIndex + 1} — {timeRangeLabel}
          </span>
          <span className={styles.intervalCount}>
            {formatTime(intervalElapsed)} / {formatTime(intervalTotal)}
          </span>
        </div>

        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      </div>

      {session.surveyType === 'ruas' && (
        <div className={styles.tabBar}>
          <div className={styles.tabScroll}>
            {session.intersections.map((inter, idx) => (
              <button
                key={inter.id}
                className={`${styles.tab} ${inter.id === activeIntersectionId ? styles.tabActive : ''}`}
                style={{
                  borderColor: inter.id === activeIntersectionId ? TAB_COLORS[idx % TAB_COLORS.length] : 'transparent',
                  backgroundColor: inter.id === activeIntersectionId
                    ? `${TAB_COLORS[idx % TAB_COLORS.length]}20`
                    : 'transparent',
                }}
                onClick={() => onTabChange(inter.id)}
              >
                <span
                  className={styles.tabDot}
                  style={{ backgroundColor: TAB_COLORS[idx % TAB_COLORS.length] }}
                />
                {inter.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {session.surveyType === 'simpang' ? (
        <div className={styles.simpangGroupedScroll}>
          {session.intersections.map((inter, idx) => {
            const interColor = TAB_COLORS[idx % TAB_COLORS.length];
            return (
              <div key={inter.id} className={styles.intersectionGroup}>
                <div className={styles.intersectionGroupHeader}>
                  <span className={styles.intersectionGroupDot} style={{ backgroundColor: interColor }} />
                  <span className={styles.intersectionGroupName}>{inter.name}{inter.pendekat ? ` (Pendekat ${inter.pendekat})` : ''}</span>
                </div>
                <div className={styles.intersectionGroupGrid}>
                  {session.categories.map((cat, catIdx) => (
                    <div key={cat.id} className={styles.categoryGroupBlock}>
                      <div className={styles.categoryGroupLabel} style={{ borderLeftColor: TAB_COLORS[catIdx % TAB_COLORS.length] }}>
                        <span>{cat.icon}</span>
                        <span className={styles.categoryGroupName}>{cat.short}</span>
                      </div>
                      <div className={styles.categoryGroupVehicles}>
                        {cat.vehicles.map((v) => {
                          const counts = (currentCounts[inter.id]?.[v.id] as DirectionCount) || { left: 0, straight: 0, right: 0 };
                          const total = counts.left + counts.straight + counts.right;
                          return (
                            <div key={v.id} className={styles.directionCardCompact}>
                              <div className={styles.directionCardHeaderCompact}>
                                <span className={styles.directionCardIcon}>{v.icon}</span>
                                <span className={styles.directionCardNameCompact}>{v.short}</span>
                                <span className={styles.directionCardTotalCompact}>{total}</span>
                              </div>
                              <div className={styles.directionButtons}>
                                {(['left', 'straight', 'right'] as const).map((dir) => {
                                  const dirLabel = dir === 'left' ? 'Kiri' : dir === 'straight' ? 'Lurus' : 'Kanan';
                                  return (
                                    <div key={dir} className={styles.directionBtnGroup}>
                                      <button
                                        className={styles.directionBtnTap}
                                        onClick={() => onIncrement(v.id, dir, inter.id)}
                                      >
                                        <span className={styles.directionLabel}>{dirLabel}</span>
                                        <span className={styles.directionCount}>{counts[dir]}</span>
                                      </button>
                                      <button
                                        className={styles.directionMinus}
                                        onClick={() => onDecrement(v.id, dir, inter.id)}
                                      >
                                        −
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.countingScroll}>
          {session.categories.map((cat, catIdx) => (
            <div key={cat.id} className={styles.categoryGroupBlock}>
              <div className={styles.categoryGroupLabel} style={{ borderLeftColor: TAB_COLORS[catIdx % TAB_COLORS.length] }}>
                <span>{cat.icon}</span>
                <span className={styles.categoryGroupName}>{cat.short}</span>
              </div>
              <div className={styles.countingGrid}>
                {cat.vehicles.map((v) => {
                  const count = activeIntersectionId
                    ? (currentCounts[activeIntersectionId]?.[v.id] as number) || 0
                    : 0;

                  return (
                    <div
                      key={v.id}
                      data-vehicle-id={v.id}
                      className={styles.counterBtnWrapper}
                    >
                      <button
                        className={styles.counterBtn}
                        onClick={() => onIncrement(v.id)}
                      >
                        <span className={styles.counterIcon}>{v.icon}</span>
                        <span className={styles.counterName}>{v.short}</span>
                        <span className={styles.counterCount}>{count}</span>
                      </button>
                      <button
                        className={styles.counterMinus}
                        onClick={() => onDecrement(v.id)}
                      >
                        −
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.bottomBar}>
        <button className={styles.undoBtn} onClick={onUndoLast} disabled={!lastAction}>
          ↩ Undo
        </button>

        {session.status === 'running' ? (
          <button className={styles.pauseBtn} onClick={onPause}>
            ⏸ Jeda
          </button>
        ) : (
          <button className={styles.resumeBtn} onClick={onResume}>
            ▶ Lanjut
          </button>
        )}

        <button className={styles.finishBtn} onClick={onFinishClick}>
          ✓ Selesai
        </button>
      </div>

      {session.surveyType !== 'simpang' && (
        <div className={styles.keyboardHint}>
          Tekan 1–{allVehiclesFlat.length} untuk hitung | Backspace untuk undo | Tekan − untuk kurangi
        </div>
      )}
    </div>
  );
}