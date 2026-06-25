/**
 * Signals — Live intelligence feed
 * Shows: priority signals with severity, source, timestamp, actions
 */
import { View, Text, ScrollView, StyleSheet, RefreshControl, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  bg: "#0C1222",
  card: "#141C2E",
  border: "#1F2937",
  text: "#F9FAFB",
  muted: "#9CA3AF",
  green: "#059669",
  amber: "#D97706",
  red: "#DC2626",
  blue: "#3B82F6",
};

type Signal = {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  source: string;
  timestamp: string;
  relatedEntities: string[];
  rulesApplied: number;
  actionLabel?: string;
};

const MOCK_SIGNALS: Signal[] = [
  {
    id: "1",
    title: "Acme Corp health dropped",
    severity: "high",
    description:
      "Health score fell from 72 to 48 in 7 days. No engagement in 12 days. 3 P1 bugs open.",
    source: "SignalAnalyzer",
    timestamp: "2 min ago",
    relatedEntities: ["Acme Corp", "ACME-234"],
    rulesApplied: 4,
    actionLabel: "View Playbook",
  },
  {
    id: "2",
    title: "SLA breach risk — TechStart",
    severity: "critical",
    description: "P1 ticket TECH-891 open 14 days. SLA breach in 48 hours. No engineer assigned.",
    source: "SignalAnalyzer",
    timestamp: "8 min ago",
    relatedEntities: ["TechStart Inc", "TECH-891"],
    rulesApplied: 6,
    actionLabel: "Escalate",
  },
  {
    id: "3",
    title: "Renewal approaching — GlobalCo",
    severity: "medium",
    description: "Contract renewal in 30 days. No QBR scheduled. Champion contact went dark.",
    source: "SignalAnalyzer",
    timestamp: "1 hour ago",
    relatedEntities: ["GlobalCo"],
    rulesApplied: 3,
    actionLabel: "Schedule QBR",
  },
  {
    id: "4",
    title: "New stakeholder detected — NexaFlow",
    severity: "low",
    description:
      "New VP of Engineering joined. Previous champion left. Relationship graph needs update.",
    source: "EntityResolver",
    timestamp: "3 hours ago",
    relatedEntities: ["NexaFlow"],
    rulesApplied: 2,
  },
  {
    id: "5",
    title: "Engagement spike — DataPulse",
    severity: "low",
    description: "5 team members logged in today. Highest usage in 30 days. Expansion signal.",
    source: "SignalAnalyzer",
    timestamp: "5 hours ago",
    relatedEntities: ["DataPulse"],
    rulesApplied: 1,
  },
];

const SEVERITY_CONFIG = {
  critical: { color: COLORS.red, bg: "#DC262620", icon: "warning" as const },
  high: { color: COLORS.amber, bg: "#D9770620", icon: "alert-circle" as const },
  medium: { color: COLORS.blue, bg: "#3B82F620", icon: "information-circle" as const },
  low: { color: COLORS.muted, bg: "#9CA3AF20", icon: "checkmark-circle" as const },
};

export default function SignalsScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const filters = ["all", "critical", "high", "medium", "low"];
  const filtered =
    selectedFilter === "all"
      ? MOCK_SIGNALS
      : MOCK_SIGNALS.filter((s) => s.severity === selectedFilter);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.green} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Signals</Text>
        <Text style={styles.subtitle}>{MOCK_SIGNALS.length} active</Text>
      </View>

      {/* Filter Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
        {filters.map((filter) => (
          <Pressable
            key={filter}
            style={[styles.filterPill, selectedFilter === filter && styles.filterPillActive]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Signals List */}
      <View style={styles.list}>
        {filtered.map((signal) => {
          const config = SEVERITY_CONFIG[signal.severity];
          return (
            <Pressable key={signal.id} style={styles.signalCard}>
              <View style={styles.signalTop}>
                <View style={[styles.severityIcon, { backgroundColor: config.bg }]}>
                  <Ionicons name={config.icon} size={18} color={config.color} />
                </View>
                <View style={styles.signalInfo}>
                  <Text style={styles.signalTitle}>{signal.title}</Text>
                  <Text style={styles.signalMeta}>
                    {signal.source} · {signal.timestamp}
                  </Text>
                </View>
              </View>

              <Text style={styles.signalDescription}>{signal.description}</Text>

              <View style={styles.signalBottom}>
                <View style={styles.entities}>
                  {signal.relatedEntities.map((entity) => (
                    <View key={entity} style={styles.entityChip}>
                      <Text style={styles.entityText}>{entity}</Text>
                    </View>
                  ))}
                </View>
                {signal.actionLabel && (
                  <Pressable style={[styles.actionButton, { backgroundColor: config.color }]}>
                    <Text style={styles.actionText}>{signal.actionLabel}</Text>
                  </Pressable>
                )}
              </View>

              <Text style={styles.rulesApplied}>{signal.rulesApplied} rules applied</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingBottom: 32 },
  header: { padding: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: "700", color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.muted, marginTop: 4 },
  filters: { paddingHorizontal: 16, marginBottom: 16 },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  filterText: { fontSize: 13, fontWeight: "500", color: COLORS.muted },
  filterTextActive: { color: "#fff" },
  list: { paddingHorizontal: 16 },
  signalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  signalTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  severityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  signalInfo: { flex: 1 },
  signalTitle: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  signalMeta: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  signalDescription: { fontSize: 13, color: COLORS.muted, marginTop: 12, lineHeight: 18 },
  signalBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  entities: { flexDirection: "row", gap: 6, flex: 1 },
  entityChip: {
    backgroundColor: "#1F2937",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  entityText: { fontSize: 11, color: COLORS.text },
  actionButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  actionText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  rulesApplied: { fontSize: 11, color: COLORS.muted, marginTop: 8 },
});
