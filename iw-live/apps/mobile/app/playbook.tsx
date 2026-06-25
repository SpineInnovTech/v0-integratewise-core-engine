/**
 * Playbook — Priority actions for the operator
 * Shows: ordered actions with tool, reason, impact, governance trace
 */
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
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

type PlaybookAction = {
  id: string;
  priority: number;
  account: string;
  action: string;
  tool: string;
  reason: string;
  impact: string;
  urgency: "today" | "this_week" | "when_possible";
  status: "pending" | "in_progress" | "completed";
  estimatedImpact?: string;
};

const MOCK_ACTIONS: PlaybookAction[] = [
  {
    id: "1",
    priority: 1,
    account: "Acme Corp",
    action: "Escalate ACME-234 in Jira to eng lead",
    tool: "Jira",
    reason: "14-day P1 bug, SLA breached, no assignee",
    impact: "Health score +12, Risk HIGH → MEDIUM",
    urgency: "today",
    status: "pending",
  },
  {
    id: "2",
    priority: 2,
    account: "Acme Corp",
    action: "Schedule QBR with Acme CTO",
    tool: "HubSpot + Calendar",
    reason: "No engagement in 18 days, renewal in 42 days",
    impact: "Renewal confidence +32%",
    urgency: "this_week",
    status: "pending",
  },
  {
    id: "3",
    priority: 3,
    account: "Acme Corp",
    action: "Send product roadmap update",
    tool: "HubSpot Email",
    reason: "Champion asking about features, expansion at risk",
    impact: "Expansion deal preserved",
    urgency: "this_week",
    status: "pending",
  },
  {
    id: "4",
    priority: 4,
    account: "TechStart Inc",
    action: "Escalate TECH-891 to VP Engineering",
    tool: "Slack",
    reason: "P1 ticket open 14 days, SLA breach in 48h",
    impact: "SLA breach prevented",
    urgency: "today",
    status: "in_progress",
  },
  {
    id: "5",
    priority: 5,
    account: "GlobalCo",
    action: "Draft renewal proposal",
    tool: "HubSpot",
    reason: "Contract renewal in 30 days, no QBR scheduled",
    impact: "Renewal confidence +25%",
    urgency: "when_possible",
    status: "pending",
  },
];

const URGENCY_CONFIG = {
  today: { color: COLORS.red, label: "Today" },
  this_week: { color: COLORS.amber, label: "This Week" },
  when_possible: { color: COLORS.muted, label: "When Possible" },
};

const STATUS_CONFIG = {
  pending: { icon: "ellipse-outline" as const, color: COLORS.muted },
  in_progress: { icon: "time-outline" as const, color: COLORS.amber },
  completed: { icon: "checkmark-circle" as const, color: COLORS.green },
};

export default function PlaybookScreen() {
  const insets = useSafeAreaInsets();
  const [selectedFilter, setSelectedFilter] = useState<string>("pending");

  const filters = ["all", "pending", "in_progress", "completed"];
  const filtered =
    selectedFilter === "all"
      ? MOCK_ACTIONS
      : MOCK_ACTIONS.filter((a) => a.status === selectedFilter);

  const pendingCount = MOCK_ACTIONS.filter((a) => a.status === "pending").length;
  const inProgressCount = MOCK_ACTIONS.filter((a) => a.status === "in_progress").length;

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Playbook</Text>
        <Text style={styles.subtitle}>
          {pendingCount} pending · {inProgressCount} in progress
        </Text>
      </View>

      {/* Impact Summary */}
      <View style={styles.impactCard}>
        <Ionicons name="trending-up" size={20} color={COLORS.green} />
        <View style={styles.impactInfo}>
          <Text style={styles.impactTitle}>Estimated Impact</Text>
          <Text style={styles.impactValue}>Health: 52 → 68 · Risk: HIGH → MEDIUM</Text>
        </View>
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
              {filter === "in_progress"
                ? "In Progress"
                : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Actions List */}
      <View style={styles.list}>
        {filtered.map((action) => {
          const urgency = URGENCY_CONFIG[action.urgency];
          const status = STATUS_CONFIG[action.status];
          return (
            <Pressable key={action.id} style={styles.actionCard}>
              <View style={styles.actionTop}>
                <View style={[styles.priorityBadge, { backgroundColor: urgency.color + "20" }]}>
                  <Text style={[styles.priorityNumber, { color: urgency.color }]}>
                    P{action.priority}
                  </Text>
                </View>
                <View style={styles.actionInfo}>
                  <Text style={styles.accountName}>{action.account}</Text>
                  <Text style={styles.actionTitle}>{action.action}</Text>
                </View>
                <Ionicons name={status.icon} size={20} color={status.color} />
              </View>

              <View style={styles.actionDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="construct-outline" size={14} color={COLORS.muted} />
                  <Text style={styles.detailText}>{action.tool}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="help-circle-outline" size={14} color={COLORS.muted} />
                  <Text style={styles.detailText}>{action.reason}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="flash-outline" size={14} color={COLORS.green} />
                  <Text style={[styles.detailText, { color: COLORS.green }]}>{action.impact}</Text>
                </View>
              </View>

              <View style={styles.actionBottom}>
                <View style={[styles.urgencyBadge, { backgroundColor: urgency.color + "20" }]}>
                  <Text style={[styles.urgencyText, { color: urgency.color }]}>
                    {urgency.label}
                  </Text>
                </View>
                {action.status === "pending" && (
                  <Pressable style={styles.executeButton}>
                    <Ionicons name="play" size={14} color="#fff" />
                    <Text style={styles.executeText}>Execute</Text>
                  </Pressable>
                )}
              </View>
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
  impactCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  impactInfo: { flex: 1 },
  impactTitle: { fontSize: 12, color: COLORS.muted },
  impactValue: { fontSize: 13, fontWeight: "600", color: COLORS.green, marginTop: 2 },
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
  actionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  priorityBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  priorityNumber: { fontSize: 13, fontWeight: "700" },
  actionInfo: { flex: 1 },
  accountName: { fontSize: 12, color: COLORS.muted },
  actionTitle: { fontSize: 14, fontWeight: "600", color: COLORS.text, marginTop: 2 },
  actionDetails: { marginTop: 12, gap: 8 },
  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  detailText: { fontSize: 12, color: COLORS.muted, flex: 1, lineHeight: 16 },
  actionBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  urgencyBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  urgencyText: { fontSize: 11, fontWeight: "600" },
  executeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.green,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  executeText: { fontSize: 12, fontWeight: "600", color: "#fff" },
});
