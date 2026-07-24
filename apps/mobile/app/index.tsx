import { projectStatus } from "@apostolic-ia/domain";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  useColorScheme,
  View
} from "react-native";

export default function HomeScreen() {
  const dark = useColorScheme() === "dark";
  const palette = dark ? stylesDark : stylesLight;
  const status = projectStatus();

  return (
    <SafeAreaView style={[styles.safeArea, palette.page]}>
      <StatusBar style={dark ? "light" : "dark"} />
      <View style={[styles.card, palette.panel]}>
        <Text style={[styles.eyebrow, palette.action]}>
          SPRINT 010 · FUNDAÇÃO TECNOLÓGICA
        </Text>
        <Text accessibilityRole="header" style={[styles.title, palette.text]}>
          Apostolic IA
        </Text>
        <Text style={[styles.lead, palette.secondary]}>
          A base mobile está ativa. As funcionalidades do produto continuam
          planejadas e ainda não estão disponíveis.
        </Text>
        <View accessibilityRole="text" style={styles.status}>
          <View style={styles.statusDot} />
          <Text style={[styles.statusText, palette.text]}>{status.label}</Text>
        </View>
      </View>
      <View style={[styles.notice, palette.muted]}>
        <Text accessibilityRole="header" style={[styles.noticeTitle, palette.text]}>
          Estado honesto
        </Text>
        <Text style={palette.secondary}>
          Esta é uma base técnica sem conta, Bíblia licenciada ou professor de
          IA.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, padding: 20, justifyContent: "center" },
  card: { borderRadius: 20, padding: 28 },
  eyebrow: { fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  title: { fontSize: 46, fontWeight: "800", marginTop: 8 },
  lead: { fontSize: 18, lineHeight: 28, marginTop: 14 },
  status: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 24 },
  statusDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#18794e" },
  statusText: { fontSize: 16, fontWeight: "700" },
  notice: { borderRadius: 14, padding: 18, marginTop: 16 },
  noticeTitle: { fontSize: 18, fontWeight: "800", marginBottom: 6 }
});

const stylesLight = StyleSheet.create({
  page: { backgroundColor: "#f8fafc" },
  panel: { backgroundColor: "#ffffff" },
  muted: { backgroundColor: "#eef2f7" },
  text: { color: "#172033" },
  secondary: { color: "#4b5870" },
  action: { color: "#174ea6" }
});

const stylesDark = StyleSheet.create({
  page: { backgroundColor: "#0b1220" },
  panel: { backgroundColor: "#131d2e" },
  muted: { backgroundColor: "#1c2940" },
  text: { color: "#f4f7fb" },
  secondary: { color: "#b7c2d3" },
  action: { color: "#78a9ff" }
});
