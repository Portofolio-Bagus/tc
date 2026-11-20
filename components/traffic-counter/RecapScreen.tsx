"use client";

import { Session, TAB_COLORS } from './types';
import { formatTime, getAllVehicles, getCatTotal } from './helpers';
import styles from './TrafficCounter.module.css';

interface Props {
  session: Session;
  sessionHistory: any[];
  showHistory: boolean;
  exporting: boolean;
  exportError: string | null;
  onExport: () => void;
  onReset: () => void;
  onToggleHistory: () => void;
  onViewHistorySession: (session: any) => void;
  onDismissError: () => void;
}

export default function RecapScreen({
  session,
  sessionHistory,
  showHistory,
  exporting,
  exportError,
  onExport,
  onReset,
  onToggleHistory,
  onViewHistorySession,
  onDismissError,
}: Props) {
  const allVehiclesFlat = getAllVehicles(session?.categories || []);

  return (
    <div className={styles.app}>
      <div className={styles.recapContainer}>
        <div className={styles.recapHeader}>
          <h1 className={styles.recapTitle}>Rekap Survei</h1>
          <p className={styles.recapSubtitle}>{session.name}</p>
          <div className={styles.recapMeta}>
            <span>Petugas: {session.observer}</span>
            <span>Mulai: {session.startTime}</span>
            <span>Interval: {session.intervalMinutes} menit</span>
            <span>Total: {session.totalIntervals} interval</span>
          </div>
        </div>

        {session.intersections.map((intersection) => {
          const interData = session.data[intersection.id] || {};
          const totalInterval = session.totalIntervals || 0;

          return (
            <div key={intersection.id} className={styles.recapSection}>
              <h2 className={styles.recapSectionTitle}>
                <span
                  className={styles.recapDot}
                  style={{
                    backgroundColor:
                      TAB_COLORS[session.intersections.findIndex((i) => i.id === intersection.id) % TAB_COLORS.length],
                  }}
                />
                {intersection.name}
                {intersection.direction ? ` (${intersection.direction})` : ''}
              </h2>

              <div className={styles.recapTableWrapper}>
                <table className={styles.recapTable}>
                  <thead>
                    <tr>
                      <th>Interval</th>
                      {allVehiclesFlat.map((v) => (
                        <th key={v.id} className={styles.vehicleTh}>{v.short}</th>
                      ))}
                      <th className={styles.totalCol}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: totalInterval }, (_, i) => {
                      const intervalData = interData[String(i)] || {};
                      const startSec = i * session.intervalMinutes * 60;
                      const endSec = startSec + session.intervalMinutes * 60;
                      let rowTotal = 0;
                      allVehiclesFlat.forEach((v) => {
                        rowTotal += getCatTotal(intervalData, v.id, session.surveyType);
                      });

                      return (
                        <tr key={i}>
                          <td className={styles.intervalCell}>
                            I-{i + 1}
                            <span className={styles.intervalTime}>
                              {formatTime(startSec)}–{formatTime(endSec)}
                            </span>
                          </td>
                          {allVehiclesFlat.map((v) => (
                            <td key={v.id} className={styles.countCell}>
                              {getCatTotal(intervalData, v.id, session.surveyType)}
                            </td>
                          ))}
                          <td className={`${styles.countCell} ${styles.totalCell}`}>{rowTotal}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className={styles.grandLabel}>TOTAL</td>
                      {allVehiclesFlat.map((v) => {
                        let catTotal = 0;
                        for (let i = 0; i < totalInterval; i++) {
                          catTotal += getCatTotal(interData[String(i)] || {}, v.id, session.surveyType);
                        }
                        return (
                          <td key={v.id} className={`${styles.countCell} ${styles.grandTotal}`}>
                            {catTotal}
                          </td>
                        );
                      })}
                      <td className={`${styles.countCell} ${styles.grandTotal}`}>
                        {(() => {
                          let all = 0;
                          for (let i = 0; i < totalInterval; i++) {
                            const d = interData[String(i)] || {};
                            allVehiclesFlat.forEach((v) => { all += getCatTotal(d, v.id, session.surveyType); });
                          }
                          return all;
                        })()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          );
        })}

        {exportError && (
          <div className={styles.exportError}>
            <span>{exportError}</span>
            <button className={styles.exportErrorClose} onClick={onDismissError}>✕</button>
          </div>
        )}

        {sessionHistory.length > 1 && (
          <button className={styles.historyToggleBtn} onClick={onToggleHistory}>
            📋 Riwayat ({sessionHistory.length})
          </button>
        )}

        {showHistory && (
          <div className={styles.historyPanel}>
            <div className={styles.historyPanelHeader}>
              <span>Riwayat Sesi</span>
              <button className={styles.historyPanelClose} onClick={onToggleHistory}>✕</button>
            </div>
            {sessionHistory.map((h: any, i: number) => (
              <div
                key={i}
                className={styles.historyItem}
                onClick={() => onViewHistorySession(h)}
              >
                <div className={styles.historyItemName}>{h.name}</div>
                <div className={styles.historyItemMeta}>
                  {h.observer} · {h.surveyType === 'simpang' ? 'Simpang' : 'Ruas'} · {h.totalIntervals} interval
                </div>
                <div className={styles.historyItemDate}>
                  {new Date(h.completedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.exportActions}>
          <button
            className={styles.exportBtn}
            onClick={onExport}
            disabled={exporting}
          >
            {exporting ? '⏳ Mengekspor...' : '📥 Export XLSX'}
          </button>
          <button className={styles.newSessionBtn} onClick={onReset}>
            🔄 Sesi Baru
          </button>
        </div>
      </div>
    </div>
  );
}