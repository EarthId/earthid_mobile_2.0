import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Switch,
  LayoutAnimation,
  Platform,
  UIManager,
  ActivityIndicator,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Header from "../../components/Header";
import { Screens } from "../../themes";
import { useFocusEffect } from "@react-navigation/native";
import {
  getConsentsByEarthId,
  updateConsentToggle,
  updateConsentById,
  ConsentRow,
} from "../../utils/consentApis";
import { useAppSelector } from "../../hooks/hooks";

// Enable smooth accordion animation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TOGGLE = {
  trackOn: "#2563EB", // blue
  thumbOn: "#1E40AF",
  trackOff: "#E5E7EB",
  thumbOff: "#FFFFFF",
};

// Simple date-time formatter (local)
const fmt = (iso?: string | null) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso || "";
  }
};

const Consent = (props: any) => {
  const [activeTab, setActiveTab] = useState<"documents" | "third">("documents");
  const [consents, setConsents] = useState<ConsentRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [openFlows, setOpenFlows] = useState<Record<string, boolean>>({});
  const [openRPs, setOpenRPs] = useState<Record<string, boolean>>({});

  const userDetails = useAppSelector((state) => state.account);
  const earthId = userDetails?.responseData?.earthId || "";

  // Fetch + set
  const refreshConsents = useCallback(async () => {
    try {
      console.log("[REFRESH] GET consents for", earthId);
      const fresh = earthId ? await getConsentsByEarthId(earthId) : [];
      console.log("[REFRESH] count =", Array.isArray(fresh) ? fresh.length : 0);
      setConsents(Array.isArray(fresh) ? fresh : []);
    } catch (err) {
      console.warn("[REFRESH] error", err);
    }
  }, [earthId]);

  // Load consents on screen focus
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        setLoading(true);
        try {
          console.log("[LOAD] earthId:", earthId);
          const data = earthId ? await getConsentsByEarthId(earthId) : [];
          console.log("[LOAD] consents:", data?.length ?? 0);
          if (alive) setConsents(Array.isArray(data) ? data : []);
        } catch (e) {
          console.warn("Consent load error:", e);
        } finally {
          if (alive) setLoading(false);
        }
      })();
      return () => {
        alive = false;
      };
    }, [earthId])
  );

  // Group by flowName (Documents tab)
  const flowGroups = useMemo(() => {
    const map: Record<string, ConsentRow[]> = {};
    for (const c of consents) (map[c.flowName] ||= []).push(c);
    // newest first
    Object.keys(map).forEach((k) =>
      map[k].sort((a, b) => {
        const ta = Date.parse(a.consentedOn || a.timestamp || "") || 0;
        const tb = Date.parse(b.consentedOn || b.timestamp || "") || 0;
        return tb - ta;
      })
    );
    return map;
  }, [consents]);

  // Group by relyingParty (3rd Parties tab)
  const rpGroups = useMemo(() => {
    const map: Record<string, ConsentRow[]> = {};
    for (const c of consents) (map[c.relyingParty] ||= []).push(c);
    Object.keys(map).forEach((k) =>
      map[k].sort((a, b) => {
        const ta = Date.parse(a.consentedOn || a.timestamp || "") || 0;
        const tb = Date.parse(b.consentedOn || b.timestamp || "") || 0;
        return tb - ta;
      })
    );
    return map;
  }, [consents]);

  // Docs accordion descriptor: per flow -> per relyingParty -> individual rows
  const docsAgg = useMemo(() => {
    return Object.entries(flowGroups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([flowName, rows]) => {
        const byCompany: Record<string, ConsentRow[]> = {};
        rows.forEach((r) => (byCompany[r.relyingParty] ||= []).push(r));
        const companies = Object.entries(byCompany)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([relyingParty, rs]) => ({ relyingParty, rows: rs }));
        return { flowName, companies };
      });
  }, [flowGroups]);

  // RPs accordion descriptor: per relyingParty -> per flow -> individual rows
  const rpsAgg = useMemo(() => {
    return Object.entries(rpGroups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([relyingParty, rows]) => {
        const byFlow: Record<string, ConsentRow[]> = {};
        rows.forEach((r) => (byFlow[r.flowName] ||= []).push(r));
        const documents = Object.entries(byFlow)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([flowName, rs]) => ({ flowName, rows: rs }));
        return { relyingParty, documents };
      });
  }, [rpGroups]);

  // Initialize accordions (open first in each list)
  useEffect(() => {
    if (!consents.length) return;
    if (Object.keys(openFlows).length === 0) {
      const init: Record<string, boolean> = {};
      Object.keys(flowGroups)
        .sort()
        .forEach((f, i) => (init[f] = i === 0));
      setOpenFlows(init);
    }
    if (Object.keys(openRPs).length === 0) {
      const init: Record<string, boolean> = {};
      Object.keys(rpGroups)
        .sort()
        .forEach((rp, i) => (init[rp] = i === 0));
      setOpenRPs(init);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consents.length]);

  // Toggle helpers
  const toggleFlowOpen = (flowName: string) => {
    LayoutAnimation.easeInEaseOut();
    setOpenFlows((s) => ({ ...s, [flowName]: !s[flowName] }));
  };
  const toggleRPOpen = (rp: string) => {
    LayoutAnimation.easeInEaseOut();
    setOpenRPs((s) => ({ ...s, [rp]: !s[rp] }));
  };

  // ==== TOGGLE (per-row) — keep render logic, just fix update path + logs ====
  const onToggleRowById = async (row: ConsentRow, next: boolean) => {
    console.log("[TOGGLE] start →", {
      key: row.id != null ? `id:${row.id}` : `${row.earthId}/${row.flowName}/${row.relyingParty}`,
      id: row.id,
      earthId: row.earthId,
      flowName: row.flowName,
      relyingParty: row.relyingParty,
      from: row.isConsentActive,
      to: next,
    });

    // optimistic flip for this row
    setConsents((prev) =>
      prev.map((c) =>
        (row.id != null ? c.id === row.id
                        : (c.earthId === row.earthId && c.flowName === row.flowName && c.relyingParty === row.relyingParty))
          ? {
              ...c,
              isConsentActive: next,
              consentedOn: next ? new Date().toISOString() : null,
              revokedOn: next ? null : new Date().toISOString(),
            }
          : c
      )
    );

    // 1) Try composite endpoint (your backend supports this)
    try {
      console.log("[TOGGLE] PATCH composite →", {
        earthId: row.earthId,
        flowName: row.flowName,
        relyingParty: row.relyingParty,
        nextActive: next,
      });
      const composite = await updateConsentToggle(row.earthId, row.flowName, row.relyingParty, next);
      console.log("[TOGGLE] composite response", composite);

      if (typeof composite?.isConsentActive === "boolean") {
        if (composite.isConsentActive === next) {
          console.log("[TOGGLE] composite matched; refreshing list");
          await refreshConsents();
          console.log("[TOGGLE] end ← composite ok");
          return;
        } else {
          console.warn("[TOGGLE] composite mismatch; wanted", next, "got", composite.isConsentActive);
        }
      } else {
        console.warn("[TOGGLE] composite returned no isConsentActive; try id fallback if available");
      }
    } catch (err) {
      console.warn("[TOGGLE] composite error, will try id fallback if possible", err);
    }

    // 2) Fallback: PATCH by unique id (if present)
    if (row.id != null) {
      try {
        console.log("[TOGGLE] PATCH /id/:id →", { id: row.id, nextActive: next });
        const byId = await updateConsentById(row.id, next);
        console.log("[TOGGLE] id response", byId);

        if (typeof byId?.isConsentActive === "boolean") {
          // Merge server truth for that exact row
          setConsents((prev) => prev.map((c) => (c.id === row.id ? { ...c, ...byId } : c)));
          await refreshConsents();

          if (byId.isConsentActive !== next) {
            console.warn("[TOGGLE] id mismatch; wanted", next, "got", byId.isConsentActive);
          } else {
            console.log("[TOGGLE] end ← id ok");
          }
          return;
        } else {
          console.warn("[TOGGLE] id returned no isConsentActive");
        }
      } catch (err) {
        console.warn("[TOGGLE] id error", err);
      }
    }

    // 3) If backend refused the change, revert and refresh
    console.warn("[TOGGLE] revert (server didn’t update); refreshing to server truth");
    setConsents((prev) =>
      prev.map((c) =>
        (row.id != null ? c.id === row.id
                        : (c.earthId === row.earthId && c.flowName === row.flowName && c.relyingParty === row.relyingParty))
          ? { ...c, isConsentActive: !next }
          : c
      )
    );
    await refreshConsents();
    console.log("[TOGGLE] end ← reverted");
  };

  // Small UI helpers
  const Row = ({ left, right }: { left: React.ReactNode; right?: React.ReactNode }) => (
    <View style={styles.row}>
      <View style={{ flexShrink: 1 }}>{left}</View>
      <View style={styles.rowRight}>{right}</View>
    </View>
  );

  const Divider = () => <View style={styles.divider} />;

  // RENDER: Documents tab (dynamic, per-row)
  const renderDocumentsTab = () => (
    <View style={styles.card}>
      {docsAgg.length === 0 ? (
        <Text style={styles.empty}>No documents found.</Text>
      ) : (
        docsAgg.map(({ flowName, companies }, gi) => (
          <View key={flowName}>
            <TouchableOpacity onPress={() => toggleFlowOpen(flowName)} activeOpacity={0.7} style={styles.accordionHeader}>
              <Text style={styles.accordionTitle}>{flowName}</Text>
              <Text style={styles.chev}>{openFlows[flowName] ? "▾" : "▸"}</Text>
            </TouchableOpacity>

            {openFlows[flowName] && (
              <View style={styles.accordionBody}>
                {companies.map((c, ci) => (
                  <View key={`${flowName}::${c.relyingParty}`}>
                    {c.rows.map((row, ri) => (
                      <View key={row.id ?? `${row.relyingParty}-${row.flowName}-${ri}`}>
                        <Row
                          left={
                            <View>
                              <Text>
                                <Text style={styles.grayText}>Company:{"  "}</Text>
                                <Text style={styles.bold}>{row.relyingParty}</Text>
                              </Text>
                              <Text style={styles.meta}>
                                {row.isConsentActive
                                  ? `Consented on ${fmt(row.consentedOn || row.timestamp)}`
                                  : row.revokedOn
                                  ? `Revoked on ${fmt(row.revokedOn)}`
                                  : row.timestamp
                                  ? `Created on ${fmt(row.timestamp)}`
                                  : ""}
                              </Text>
                            </View>
                          }
                          right={
                            <Switch
                              value={!!row.isConsentActive}
                              onValueChange={(v) => onToggleRowById(row, v)}
                              trackColor={{ false: TOGGLE.trackOff, true: TOGGLE.trackOn }}
                              thumbColor={row.isConsentActive ? TOGGLE.thumbOn : TOGGLE.thumbOff}
                              ios_backgroundColor={TOGGLE.trackOff}
                            />
                          }
                        />
                        {ri < c.rows.length - 1 && <Divider />}
                      </View>
                    ))}
                    {ci < companies.length - 1 && <View style={styles.sectionGap} />}
                  </View>
                ))}
              </View>
            )}

            {gi < docsAgg.length - 1 && <View style={styles.sectionGap} />}
          </View>
        ))
      )}
    </View>
  );

  // RENDER: 3rd Parties tab (dynamic, per-row)
  const renderThirdPartiesTab = () => (
    <View style={styles.card}>
      {rpsAgg.length === 0 ? (
        <Text style={styles.empty}>No third parties found.</Text>
      ) : (
        rpsAgg.map(({ relyingParty, documents }, gi) => (
          <View key={relyingParty}>
            <TouchableOpacity onPress={() => toggleRPOpen(relyingParty)} activeOpacity={0.7} style={styles.accordionHeader}>
              <Text style={styles.accordionTitle}>{relyingParty}</Text>
              <Text style={styles.chev}>{openRPs[relyingParty] ? "▾" : "▸"}</Text>
            </TouchableOpacity>

            {openRPs[relyingParty] && (
              <View style={styles.accordionBody}>
                {documents.map((d, di) => (
                  <View key={`${relyingParty}::${d.flowName}`}>
                    {d.rows.map((row, ri) => (
                      <View key={row.id ?? `${row.flowName}-${row.relyingParty}-${ri}`}>
                        <Row
                          left={
                            <View>
                              <Text>
                                <Text style={styles.grayText}>Document:{"  "}</Text>
                                <Text style={styles.bold}>{row.flowName}</Text>
                              </Text>
                              <Text style={styles.meta}>
                                {row.isConsentActive
                                  ? `Consented on ${fmt(row.consentedOn || row.timestamp)}`
                                  : row.revokedOn
                                  ? `Revoked on ${fmt(row.revokedOn)}`
                                  : row.timestamp
                                  ? `Created on ${fmt(row.timestamp)}`
                                  : ""}
                              </Text>
                            </View>
                          }
                          right={
                            <Switch
                              value={!!row.isConsentActive}
                              onValueChange={(v) => onToggleRowById(row, v)}
                              trackColor={{ false: TOGGLE.trackOff, true: TOGGLE.trackOn }}
                              thumbColor={row.isConsentActive ? TOGGLE.thumbOn : TOGGLE.thumbOff}
                              ios_backgroundColor={TOGGLE.trackOff}
                            />
                          }
                        />
                        {ri < d.rows.length - 1 && <Divider />}
                      </View>
                    ))}
                    {di < documents.length - 1 && <View style={styles.sectionGap} />}
                  </View>
                ))}
              </View>
            )}

            {gi < rpsAgg.length - 1 && <View style={styles.sectionGap} />}
          </View>
        ))
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        isBack
        letfIconPress={() => props.navigation.goBack()}
        headingText="Consent"
        linearStyle={styles.linearStyle}
      />

      {/* Tabs */}
      <View style={styles.tabsWrap}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "documents" && styles.tabActive]}
          onPress={() => setActiveTab("documents")}
        >
          <Text style={[styles.tabText, activeTab === "documents" && styles.tabTextActive]}>Documents</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "third" && styles.tabActive]}
          onPress={() => setActiveTab("third")}
        >
          <Text style={[styles.tabText, activeTab === "third" && styles.tabTextActive]}>3rd Parties</Text>
        </TouchableOpacity>
      </View>

      {/* Middle section */}
      <ScrollView>
        <View style={styles.contentPad}>
          {loading ? (
            <View style={{ paddingTop: 24 }}>
              <ActivityIndicator />
            </View>
          ) : activeTab === "documents" ? (
            renderDocumentsTab()
          ) : (
            renderThirdPartiesTab()
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const cardShadow = {
  shadowColor: "#000",
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Screens.colors.background },
  linearStyle: {
    height: 120,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
  },

  // Tabs
  tabsWrap: {
    marginTop: 12,
    marginHorizontal: 16,
    flexDirection: "row",
    backgroundColor: "#ECEFF7",
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  tabActive: { backgroundColor: "#FFFFFF" },
  tabText: { fontSize: 14, color: "#697089", fontWeight: "500" },
  tabTextActive: { color: "#1E2330" },

  // Content
  contentPad: { paddingHorizontal: 16, paddingTop: 12, marginBottom: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...cardShadow,
  },
  empty: { padding: 16, color: "#8B90A0" },

  row: {
    minHeight: 56,
    paddingVertical: 10,
    paddingHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rowRight: { flexDirection: "row", alignItems: "center" },
  divider: { height: 1, backgroundColor: "#EEF0F6" },

  // Accordion
  sectionGap: { height: 16 },
  accordionHeader: {
    minHeight: 46,
    paddingHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  accordionTitle: { fontSize: 14, color: "#1E2330", fontWeight: "600" },
  accordionBody: {
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    ...cardShadow,
  },

  // Text
  grayText: { color: "#8B90A0", fontSize: 13 },
  bold: { fontWeight: "700", color: "#1E2330", fontSize: 13 },
  meta: { color: "#8B90A0", fontSize: 12, marginTop: 2 },

  // Icons
  chev: { fontSize: 18, color: "#A1A7BA" },
});

export default Consent;
