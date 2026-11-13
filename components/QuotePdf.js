import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatFCFA } from "../lib/pricing";

// Le PDF se décrit comme une page web, avec des View (blocs) et des Text.
// Les styles ressemblent à du CSS, mais s'écrivent en objets JavaScript.
const COLOR = "#3b3f8f";

const s = StyleSheet.create({
  page: { padding: 34, fontSize: 10, fontFamily: "Helvetica", color: "#1c1f2a" },
  top: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  brand: { fontSize: 18, fontFamily: "Helvetica-Bold", color: COLOR },
  muted: { color: "#6b7085", marginTop: 2 },
  title: { fontSize: 22, fontFamily: "Helvetica-Bold", color: COLOR, textAlign: "right" },
  right: { textAlign: "right", marginTop: 2 },
  box: { backgroundColor: "#f3f4fa", padding: 12, borderRadius: 4, marginBottom: 16 },
  boxLabel: { fontSize: 8, color: "#6b7085", marginBottom: 3, textTransform: "uppercase" },
  bold: { fontFamily: "Helvetica-Bold" },
  headRow: { flexDirection: "row", backgroundColor: COLOR, color: "#fff", padding: 7 },
  catRow: { backgroundColor: "#eceef8", padding: 5, paddingLeft: 7, fontFamily: "Helvetica-Bold", color: COLOR },
  row: { flexDirection: "row", padding: 7, borderBottomWidth: 0.5, borderBottomColor: "#dfe2ee" },
  colLabel: { flex: 1 },
  colDays: { width: 50, textAlign: "right" },
  colPrice: { width: 100, textAlign: "right" },
  totals: { marginTop: 12, alignSelf: "flex-end", width: 250 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  grand: {
    flexDirection: "row", justifyContent: "space-between", backgroundColor: COLOR, color: "#fff",
    padding: 8, marginTop: 4, fontFamily: "Helvetica-Bold", fontSize: 12,
  },
  conditions: { marginTop: 18, color: "#44485a", lineHeight: 1.35 },
  signature: {
    marginTop: 12, borderWidth: 0.5, borderColor: "#b9bdd0", height: 60, padding: 8, width: 240,
    color: "#6b7085",
  },
});

export default function QuotePdf({ dev, client, quote, number, dateText, validUntilText }) {
  // On regroupe les lignes par catégorie pour afficher un titre de section.
  const groups = [];
  for (const line of quote.lines) {
    const last = groups[groups.length - 1];
    if (last && last.category === line.category) last.lines.push(line);
    else groups.push({ category: line.category, lines: [line] });
  }

  const deposit = Math.round(quote.total / 2);

  return (
    <Document title={`Devis ${number}`} author={dev.name || "Devis Dev"}>
      <Page size="A4" style={s.page}>
        <View style={s.top}>
          <View>
            <Text style={s.brand}>{dev.name || "Développeur freelance"}</Text>
            {dev.email ? <Text style={s.muted}>{dev.email}</Text> : null}
            {dev.phone ? <Text style={s.muted}>{dev.phone}</Text> : null}
          </View>
          <View>
            <Text style={s.title}>DEVIS</Text>
            <Text style={s.right}>N° {number}</Text>
            <Text style={s.right}>Date : {dateText}</Text>
            <Text style={s.right}>Valable jusqu'au : {validUntilText}</Text>
          </View>
        </View>

        <View style={s.box}>
          <Text style={s.boxLabel}>Client</Text>
          <Text style={s.bold}>{client.name || "Client"}</Text>
          {client.project ? <Text style={s.muted}>Projet : {client.project}</Text> : null}
        </View>

        <View style={s.headRow}>
          <Text style={s.colLabel}>Désignation</Text>
          <Text style={s.colDays}>Jours</Text>
          <Text style={s.colPrice}>Montant</Text>
        </View>
        {groups.map((group) => (
          <View key={group.category}>
            <Text style={s.catRow}>{group.category}</Text>
            {group.lines.map((line) => (
              <View style={s.row} key={line.id} wrap={false}>
                <Text style={s.colLabel}>{line.label}</Text>
                <Text style={s.colDays}>{line.days ?? "-"}</Text>
                <Text style={s.colPrice}>{formatFCFA(line.price)}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={s.totals} wrap={false}>
          <View style={s.grand}>
            <Text>TOTAL</Text>
            <Text>{formatFCFA(quote.total)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text>Acompte à la commande (50 %)</Text>
            <Text>{formatFCFA(deposit)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text>Solde à la livraison</Text>
            <Text>{formatFCFA(quote.total - deposit)}</Text>
          </View>
        </View>

        <View wrap={false}>
          <Text style={s.conditions}>
            Conditions : un acompte de 50 % est demandé à la commande, le solde est réglé à la livraison. Les prix sont en francs CFA (FCFA). Les délais sont confirmés à la signature du devis.
          </Text>
          <View style={s.signature}>
            <Text>Bon pour accord (date et signature du client)</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
