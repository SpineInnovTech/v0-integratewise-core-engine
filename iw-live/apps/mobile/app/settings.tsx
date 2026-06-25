/**
 * Settings — User profile, domain, connected tools, preferences
 */
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

type SettingItem = {
  icon: string;
  label: string;
  value?: string;
  color?: string;
  onPress?: () => void;
  showArrow?: boolean;
};

type Section = { title: string; items: SettingItem[] };

const SECTIONS: Section[] = [
  {
    title: "Account",
    items: [
      { icon: "person-outline", label: "Name", value: "Nirmal" },
      { icon: "mail-outline", label: "Email", value: "nirmal@integratewise.ai" },
      { icon: "briefcase-outline", label: "Role", value: "Founder" },
      { icon: "business-outline", label: "Domain", value: "Customer Success" },
    ],
  },
  {
    title: "Workspace",
    items: [
      { icon: "cube-outline", label: "Connected Tools", value: "4 active", showArrow: true },
      { icon: "key-outline", label: "API Keys", value: "2 active", showArrow: true },
      { icon: "shield-outline", label: "Permissions", value: "Admin", showArrow: true },
    ],
  },
  {
    title: "Notifications",
    items: [
      { icon: "notifications-outline", label: "Push Notifications", value: "On" },
      { icon: "mail-outline", label: "Email Digests", value: "Daily" },
      { icon: "pulse-outline", label: "Critical Alerts", value: "Immediate" },
    ],
  },
  {
    title: "Support",
    items: [
      { icon: "document-text-outline", label: "Documentation", showArrow: true },
      { icon: "chatbubble-outline", label: "Contact Support", showArrow: true },
      { icon: "star-outline", label: "Rate the App", showArrow: true },
    ],
  },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive" },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarLarge}>
          <Ionicons name="person" size={28} color={COLORS.muted} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>Nirmal</Text>
          <Text style={styles.profileRole}>Founder · Customer Success</Text>
          <Text style={styles.profileEmail}>nirmal@integratewise.ai</Text>
        </View>
      </View>

      {/* Settings Sections */}
      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionCard}>
            {section.items.map((item, index) => (
              <Pressable
                key={item.label}
                style={[
                  styles.settingItem,
                  index < section.items.length - 1 && styles.settingItemBorder,
                ]}
                onPress={item.onPress}
              >
                <Ionicons name={item.icon as any} size={20} color={COLORS.muted} />
                <Text style={styles.settingLabel}>{item.label}</Text>
                <View style={styles.settingRight}>
                  {item.value && <Text style={styles.settingValue}>{item.value}</Text>}
                  {item.showArrow && (
                    <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      {/* Version */}
      <Text style={styles.version}>IntegrateWise v1.0.0</Text>

      {/* Logout */}
      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color={COLORS.red} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingBottom: 32 },
  header: { padding: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: "700", color: COLORS.text },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1F2937",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: "600", color: COLORS.text },
  profileRole: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  profileEmail: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionCard: {
    marginHorizontal: 16,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  settingItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  settingLabel: { flex: 1, fontSize: 14, color: COLORS.text },
  settingRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  settingValue: { fontSize: 13, color: COLORS.muted },
  version: {
    textAlign: "center",
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 24,
    marginBottom: 16,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.red + "40",
  },
  logoutText: { fontSize: 14, fontWeight: "600", color: COLORS.red },
});
