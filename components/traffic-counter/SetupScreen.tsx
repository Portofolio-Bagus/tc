"use client";

import { Session, TAB_COLORS, INTERVAL_OPTIONS } from "./types";
import styles from "./TrafficCounter.module.css";

interface Props {
  session: Session;
  sessionHistory: any[];
  showHistory: boolean;
  canStart: boolean;
  onSessionChange: (session: Session) => void;
  onSurveyTypeChange: (type: "ruas" | "simpang") => void;
  onAddIntersection: () => void;
  onRemoveIntersection: (id: string) => void;
  onUpdateIntersection: (
    id: string,
    field: "name" | "direction" | "pendekat",
    value: string,
  ) => void;
  onAddCategory: () => void;
  onRemoveCategory: (id: string) => void;
  onUpdateCategory: (
    id: string,
    field: "name" | "short" | "icon",
    value: string,
  ) => void;
  onAddVehicle: (catId: string) => void;
  onRemoveVehicle: (catId: string, vehicleId: string) => void;
  onUpdateVehicle: (
    catId: string,
    vehicleId: string,
    field: "name" | "short" | "icon",
    value: string,
  ) => void;
  onStartSession: () => void;
  onToggleHistory: () => void;
  onViewHistorySession: (session: any) => void;
}

export default function SetupScreen({
  session,
  sessionHistory,
  showHistory,
  canStart,
  onSessionChange,
  onSurveyTypeChange,
  onAddIntersection,
  onRemoveIntersection,
  onUpdateIntersection,
  onAddCategory,
  onRemoveCategory,
  onUpdateCategory,
  onAddVehicle,
  onRemoveVehicle,
  onUpdateVehicle,
  onStartSession,
  onToggleHistory,
  onViewHistorySession,
}: Props) {
  return (
    <div className={styles.app}>
      <div className={styles.setupContainer}>
        <div className={styles.setupHeader}>
          <h1 className={styles.setupTitle}>
            SI-TC
            <br />
            by
            <br />
            Bagus Tri Prasetyo
          </h1>
          <p className={styles.setupSubtitle}>
            Traffic Counting Application
            <br />
            Konfigurasi Sesi Survei Lalu Lintas
          </p>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Tipe Survei</label>
          <div className={styles.surveyTypeSelect}>
            <button
              className={`${styles.surveyTypeBtn} ${session.surveyType === "ruas" ? styles.surveyTypeBtnActive : ""}`}
              onClick={() => onSurveyTypeChange("ruas")}
            >
              Ruas Jalan
            </button>
            <button
              className={`${styles.surveyTypeBtn} ${session.surveyType === "simpang" ? styles.surveyTypeBtnActive : ""}`}
              onClick={() => onSurveyTypeChange("simpang")}
            >
              Simpang
            </button>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Nama Sesi</label>
          <input
            type="text"
            className={styles.input}
            placeholder="Contoh: Survey Jl. Gatot Subroto"
            value={session.name}
            onChange={(e) =>
              onSessionChange({ ...session, name: e.target.value })
            }
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Nama Petugas / PIC</label>
          <input
            type="text"
            className={styles.input}
            placeholder="Nama surveyor"
            value={session.observer}
            onChange={(e) =>
              onSessionChange({ ...session, observer: e.target.value })
            }
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Nama Jalan</label>
          <input
            type="text"
            className={styles.input}
            placeholder="Contoh: Jl. Gatot Subroto"
            value={session.roadName}
            onChange={(e) =>
              onSessionChange({ ...session, roadName: e.target.value })
            }
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Cuaca</label>
          <input
            type="text"
            className={styles.input}
            placeholder="Contoh: Cerah / Hujan"
            value={session.weather}
            onChange={(e) =>
              onSessionChange({ ...session, weather: e.target.value })
            }
          />
        </div>

        {session.surveyType === "simpang" && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Arah Arus</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Contoh: Masuk Kiri (dari arah Cimahi), Masuk Kanan (dari arah Padalarang)"
              value={session.flowDirections}
              onChange={(e) =>
                onSessionChange({ ...session, flowDirections: e.target.value })
              }
            />
          </div>
        )}

        <div className={styles.formGroup}>
          <label className={styles.label}>Tanggal & Waktu Mulai</label>
          <input
            type="datetime-local"
            className={styles.input}
            value={session.startTime}
            onChange={(e) =>
              onSessionChange({ ...session, startTime: e.target.value })
            }
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Interval Pencacahan</label>
          <div className={styles.intervalSelect}>
            {INTERVAL_OPTIONS.map((opt) => (
              <button
                key={opt}
                className={`${styles.intervalBtn} ${
                  session.intervalMinutes === opt
                    ? styles.intervalBtnActive
                    : ""
                }`}
                onClick={() =>
                  onSessionChange({ ...session, intervalMinutes: opt })
                }
              >
                {opt} menit
              </button>
            ))}
          </div>
        </div>

        <div className={styles.formGroup}>
          <div className={styles.sectionHeader}>
            <label className={styles.label}>
              {session.surveyType === "ruas" ? "Ruas" : "Simpang"} (
              {session.intersections.length}/8)
            </label>
            {session.intersections.length < 8 && (
              <button className={styles.addBtn} onClick={onAddIntersection}>
                + Tambah
              </button>
            )}
          </div>
          <div className={styles.intersectionList}>
            {session.intersections.map((inter, idx) => (
              <div key={inter.id} className={styles.intersectionItem}>
                <span
                  className={styles.intersectionColor}
                  style={{
                    backgroundColor: TAB_COLORS[idx % TAB_COLORS.length],
                  }}
                />
                <input
                  type="text"
                  className={styles.inputSmall}
                  placeholder={
                    session.surveyType === "ruas" ? "Nama ruas" : "Nama simpang"
                  }
                  value={inter.name}
                  onChange={(e) =>
                    onUpdateIntersection(inter.id, "name", e.target.value)
                  }
                />
                {session.surveyType === "simpang" && (
                  <input
                    type="text"
                    className={styles.inputSmall}
                    placeholder="Pendekat (A/B/C/D)"
                    value={inter.pendekat}
                    onChange={(e) =>
                      onUpdateIntersection(inter.id, "pendekat", e.target.value)
                    }
                  />
                )}
                <input
                  type="text"
                  className={styles.inputSmall}
                  placeholder="Arah (opsional)"
                  value={inter.direction}
                  onChange={(e) =>
                    onUpdateIntersection(inter.id, "direction", e.target.value)
                  }
                />
                {session.intersections.length > 1 && (
                  <button
                    className={styles.removeBtn}
                    onClick={() => onRemoveIntersection(inter.id)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.formGroup}>
          <div className={styles.sectionHeader}>
            <label className={styles.label}>Kategori Kendaraan</label>
            <button className={styles.addBtn} onClick={onAddCategory}>
              + Tambah Kategori
            </button>
          </div>
          <div className={styles.categoryEditList}>
            {session.categories.map((cat, catIdx) => (
              <div key={cat.id} className={styles.categoryEditCard}>
                <div className={styles.categoryEditHeader}>
                  <span
                    className={styles.categoryColorDot}
                    style={{
                      backgroundColor: TAB_COLORS[catIdx % TAB_COLORS.length],
                    }}
                  />
                  <input
                    type="text"
                    className={styles.categoryNameInput}
                    placeholder="Nama Kategori"
                    value={cat.name}
                    onChange={(e) =>
                      onUpdateCategory(cat.id, "name", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    className={styles.categoryShortInput}
                    placeholder="Sing."
                    value={cat.short}
                    onChange={(e) =>
                      onUpdateCategory(cat.id, "short", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    className={styles.categoryIconInput}
                    placeholder="🚗"
                    value={cat.icon}
                    onChange={(e) =>
                      onUpdateCategory(cat.id, "icon", e.target.value)
                    }
                  />
                  {session.categories.length > 1 && (
                    <button
                      className={styles.removeBtn}
                      onClick={() => onRemoveCategory(cat.id)}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className={styles.vehiclesInCategory}>
                  {cat.vehicles.map((v) => (
                    <div key={v.id} className={styles.vehicleEditRow}>
                      <input
                        type="text"
                        className={styles.vehicleNameInput}
                        placeholder="Nama Kendaraan"
                        value={v.name}
                        onChange={(e) =>
                          onUpdateVehicle(cat.id, v.id, "name", e.target.value)
                        }
                      />
                      <input
                        type="text"
                        className={styles.vehicleShortInput}
                        placeholder="Sing."
                        value={v.short}
                        onChange={(e) =>
                          onUpdateVehicle(cat.id, v.id, "short", e.target.value)
                        }
                      />
                      <input
                        type="text"
                        className={styles.vehicleIconInput}
                        placeholder="🚗"
                        value={v.icon}
                        onChange={(e) =>
                          onUpdateVehicle(cat.id, v.id, "icon", e.target.value)
                        }
                      />
                      {cat.vehicles.length > 1 && (
                        <button
                          className={styles.vehicleRemoveBtn}
                          onClick={() => onRemoveVehicle(cat.id, v.id)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    className={styles.addVehicleBtn}
                    onClick={() => onAddVehicle(cat.id)}
                  >
                    + Tambah Kendaraan ke {cat.short}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {sessionHistory.length > 0 && (
          <button className={styles.historyToggleBtn} onClick={onToggleHistory}>
            📋 Riwayat ({sessionHistory.length})
          </button>
        )}

        {showHistory && (
          <div className={styles.historyPanel}>
            <div className={styles.historyPanelHeader}>
              <span>Riwayat Sesi</span>
              <button
                className={styles.historyPanelClose}
                onClick={onToggleHistory}
              >
                ✕
              </button>
            </div>
            {sessionHistory.map((h: any, i: number) => (
              <div
                key={i}
                className={styles.historyItem}
                onClick={() => onViewHistorySession(h)}
              >
                <div className={styles.historyItemName}>{h.name}</div>
                <div className={styles.historyItemMeta}>
                  {h.observer} ·{" "}
                  {h.surveyType === "simpang" ? "Simpang" : "Ruas"} ·{" "}
                  {h.totalIntervals} interval
                </div>
                <div className={styles.historyItemDate}>
                  {new Date(h.completedAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          className={`${styles.startBtn} ${!canStart ? styles.startBtnDisabled : ""}`}
          onClick={onStartSession}
          disabled={!canStart}
        >
          Mulai Survei
        </button>
      </div>
    </div>
  );
}
