import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  title: { fontSize: 24, marginBottom: 20, color: '#166534' },
  subtitle: { fontSize: 14, marginBottom: 10, color: '#374151' },
  score: { fontSize: 48, color: '#16a34a', marginBottom: 10 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#1f2937' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 12, color: '#6b7280' },
  value: { fontSize: 12, fontWeight: 'bold', color: '#1f2937' },
  recoBox: { backgroundColor: '#f0fdf4', padding: 12, marginBottom: 12, borderRadius: 4 },
  recoTitle: { fontSize: 13, fontWeight: 'bold', color: '#166534', marginBottom: 4 },
  recoDesc: { fontSize: 11, color: '#374151', marginBottom: 4 },
  recoAction: { fontSize: 11, color: '#15803d', fontStyle: 'italic' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 10, color: '#9ca3af', textAlign: 'center' },
});

interface AuditReportProps {
  audit: {
    id: string;
    scoreTotal: number;
    scoreBreakdown: unknown;
    recommendations: unknown;
    createdAt: Date | string;
    template?: { title: string };
  };
}

export function AuditReport({ audit }: AuditReportProps) {
  const breakdown = audit.scoreBreakdown as Record<string, number>;
  const recommendations = audit.recommendations as Array<{ title: string; description: string; action: string }>;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>Rapport Audit Express Agricole</Text>
          <Text style={styles.subtitle}>
            {audit.template?.title || 'Audit Express'} • {new Date(audit.createdAt).toLocaleDateString('fr-FR')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Score Global</Text>
          <Text style={styles.score}>{audit.scoreTotal}/100</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Maturité Digitale</Text>
            <Text style={styles.value}>{breakdown?.digital || 0}/40</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Efficacité Opérationnelle</Text>
            <Text style={styles.value}>{breakdown?.ops || 0}/30</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Performance Commerciale</Text>
            <Text style={styles.value}>{breakdown?.sales || 0}/30</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Recommandations</Text>
          {(recommendations || []).slice(0, 3).map((reco, i) => (
            <View key={i} style={styles.recoBox}>
              <Text style={styles.recoTitle}>{i + 1}. {reco.title}</Text>
              <Text style={styles.recoDesc}>{reco.description}</Text>
              <Text style={styles.recoAction}>→ {reco.action}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Rapport généré le {new Date().toLocaleDateString('fr-FR')} • Audit Express • Réf: {audit.id}
        </Text>
      </Page>
    </Document>
  );
}
