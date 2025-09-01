import { createScan, listScans } from "../../../api";
import { Scan } from "../../../types/scans";
import { BarCodeScanner } from "expo-barcode-scanner";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Appbar, Button, List, Snackbar, ActivityIndicator, Text } from "react-native-paper";

const USER_ID = "507f1f77bcf86cd799439011"; // opcional: sácalo de tu auth

export default function Scanner() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanningEnabled, setScanningEnabled] = useState(true);
  const [items, setItems] = useState<Scan[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [snackbar, setSnackbar] = useState<{ visible: boolean; text: string }>({ visible: false, text: "" });
  const cooldownRef = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
    refreshList();
    return () => { if (cooldownRef.current) clearTimeout(cooldownRef.current); };
  }, []);

  const refreshList = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await listScans(1, 25);
      setItems(data);
    } finally {
      setLoadingList(false);
    }
  }, []);

  const acceptedTypes = useMemo(
    () => [
      BarCodeScanner.Constants.BarCodeType.qr,
      BarCodeScanner.Constants.BarCodeType.code128,
      BarCodeScanner.Constants.BarCodeType.ean13,
      BarCodeScanner.Constants.BarCodeType.ean8,
      BarCodeScanner.Constants.BarCodeType.code39,
      BarCodeScanner.Constants.BarCodeType.upc_a,
      BarCodeScanner.Constants.BarCodeType.upc_e,
    ],
    []
  );

  const handleScan = useCallback(
    async ({ data, type }: { data: string; type: string }) => {
      if (!scanningEnabled) return;
      setScanningEnabled(false);
      try {
        const created = await createScan({
          userId: USER_ID,               // opcional
          qrCode: data,                  // <== usa el nombre EXACTO del schema
          scannedAt: new Date().toISOString(),
          metadata: { type, device: "expo" },
        });
        setItems(prev => [created, ...prev]);
        setSnackbar({ visible: true, text: `Leído: ${data}` });
      } catch (e) {
        setSnackbar({ visible: true, text: "Error al enviar el escaneo" });
      } finally {
        cooldownRef.current = setTimeout(() => setScanningEnabled(true), 800);
      }
    },
    [scanningEnabled]
  );

  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Solicitando permisos…</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text>Sin permiso de cámara</Text>
        <Button onPress={() => BarCodeScanner.requestPermissionsAsync().then(({ status }) => setHasPermission(status === "granted"))}>
          Reintentar
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Escáner" />
        <Appbar.Action icon={scanningEnabled ? "pause" : "play"} onPress={() => setScanningEnabled(v => !v)} />
        <Appbar.Action icon="refresh" onPress={refreshList} />
      </Appbar.Header>

      <View style={styles.scannerArea}>
        <BarCodeScanner
          onBarCodeScanned={scanningEnabled ? handleScan : undefined}
          barCodeTypes={acceptedTypes}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        <Button mode="contained" onPress={refreshList}>Actualizar historial</Button>
      </View>

      <FlatList
        style={{ paddingHorizontal: 8 }}
        data={items}
        keyExtractor={(i) => i.id ?? i._id ?? Math.random().toString(36)}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <List.Item
            title={item.qrCode}
            description={new Date(item.scannedAt ?? item.createdAt ?? "").toLocaleString()}
            left={(props) => <List.Icon {...props} icon="barcode-scan" />}
          />
        )}
      />

      <Snackbar visible={snackbar.visible} onDismiss={() => setSnackbar({ visible: false, text: "" })} duration={2200}>
        {snackbar.text}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scannerArea: { height: 280, margin: 16, borderRadius: 16, overflow: "hidden" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
});
