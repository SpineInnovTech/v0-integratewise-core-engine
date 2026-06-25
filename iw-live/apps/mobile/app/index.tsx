/**
 * Dashboard — Mobile workspace overview
 * Shows: stats, active signals, connected tools
 */
import { View, Text, ScrollView, StyleSheet, RefreshControl } from "react-native";
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

type Stat = { label: string; value: number; color: string; icon: string };
type Signal = { id: string; title: string; severity: string; description?: string };
type Connector = { name: string; status: string; entities: number; lastSync: string };

const MOCK_STATS: Stat[] = [
  { label: "Entities", value: 247, color: COLORS.blue, icon: "people-outline" },
  { label: "Active Signals", value: 3, color: COLORS.amber, icon: "pulse-outline" },
  { label: "Pending", value: 1, color: COLORS.red, icon: "time-outline" },
  { label: "Tools", value: 4, color: COLORS.green, icon: "link-outline" },
];

const MOCK_SIGNALS: Signal[] = [
  {
    id: "1",
    title: "Acme Corp health dropped",
    severity: "high",
    description: "Health score fell from 72 to 48 in 7 days",
  },
  {
    id: "2",
    title: "SLA breach risk — TechStart",
    severity: "critical",
    description: "P1 ticket open 14 days, SLA in 2 days",
  },
  {
    id: "3",
    title: "Renewal approaching — GlobalCo",
    severity: "medium",
    description: "Renewal in 30 days, no QBR scheduled",
  },
];

const MOCK_CONNECTORS: Connector[] = [
  { name: "HubSpot", status: "active", entities: 142, lastSync: "2 min ago" },
  { name: "Jira", status: "active", entities: 89, lastSync: "5 min ago" },
  { name: "Slack", status: "active", entities: 12, lastSync: "1 min ago" },
  { name: "Gmail", status: "active", entities: 4, lastSync: "8 min ago" },
];

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

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
        <View>
          <Text style={styles.greeting}>Good morning</Text>
          <Text style={styles.title}>Workspace</Text>
        </View>
        <View style={styles.avatar}>
          <Ionicons name="person" size={20} color={COLORS.muted} />
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {MOCK_STATS.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Ionicons name={stat.icon as any} size={18} color={stat.color} />
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Active Signals */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="pulse" size={16} color={COLORS.amber} />
          <Text style={styles.sectionTitle}>Active Signals</Text>
          <Text style={styles.sectionCount}>{MOCK_SIGNALS.length}</Text>
        </View>
        {MOCK_SIGNALS.map((signal) => (
          <View
            key={signal.id}
            style={[
              styles.signalCard,
              signal.severity === "critical" && { borderLeftColor: COLORS.red },
              signal.severity === "high" && { borderLeftColor: COLORS.amber },
              signal.severity === "medium" && { borderLeftColor: COLORS.blue },
            ]}
          >
            <View style={styles.signalHeader}>
              <Text style={styles.signalTitle}>{signal.title}</Text>
              <View
                style={[
                  styles.severityBadge,
                  {
                    backgroundColor:
                      signal.severity === "critical"
                        ? COLORS.red
                        : signal.severity === "high"
                          ? COLORS.amber
                          : COLORS.blue,
                  },
                ]}
              >
                <Text style={styles.severityText}>{signal.severity}</Text>
              </View>
            </View>
            {signal.description && (
              <Text style={styles.signalDescription}>{signal.description}</Text>
            )}
          </View>
        ))}
      </View>

      {/* Connected Tools */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="link" size={16} color={COLORS.green} />
          <Text style={styles.sectionTitle}>Connected Tools</Text>
        </View>
        {MOCK_CONNECTORS.map((connector) => (
          <View key={connector.name} style={styles.connectorCard}>
            <View style={styles.connectorInfo}>
              <Text style={styles.connectorName}>{connector.name}</Text>
              <View style={styles.connectorMeta}>
                <View style={[styles.statusDot, { backgroundColor: COLORS.green }]} />
                <Text style={styles.connectorStatus}>{connector.status}</Text>
              </View>
            </View>
            <View style={styles.connectorRight}>
              <Text style={styles.connectorEntities}>{connector.entities} entities</Text>
              <Text style={styles.connectorSync}>{connector.lastSync}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 32 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: { fontSize: 14, color: COLORS.muted },
  title: { fontSize: 28, fontWeight: "700", color: COLORS.text },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  statCard: {
    width: "47%",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: { fontSize: 24, fontWeight: "700", marginTop: 8 },
  statLabel: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: COLORS.text, flex: 1 },
  sectionCount: {
    fontSize: 12,
    color: COLORS.muted,
    backgroundColor: COLORS.card,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  signalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.amber,
  },
  signalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  signalTitle: { fontSize: 14, fontWeight: "600", color: COLORS.text, flex: 1 },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  severityText: { fontSize: 10, fontWeight: "600", color: "#fff", textTransform: "uppercase" },
  signalDescription: { fontSize: 12, color: COLORS.muted, marginTop: 6 },
  connectorCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  connectorInfo: { flex: 1 },
  connectorName: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  connectorMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  connectorStatus: { fontSize: 11, color: COLORS.muted },
  connectorRight: { alignItems: "flex-end" },
  connectorEntities: { fontSize: 12, color: COLORS.text },
  connectorSync: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
});
