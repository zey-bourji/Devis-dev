import { Document, Image, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatFCFA } from "../lib/pricing";
import { SITE } from "../lib/site";

// Le PDF se décrit comme une page web : des View (blocs) et des Text.
// Les styles ressemblent à du CSS mais s'écrivent en objets JavaScript.
// Trois modèles ("classique", "moderne", "minimal") partagent la même structure :
// seuls quelques styles changent d'un modèle à l'autre (voir la fonction look() plus bas).
const s = StyleSheet.create({
  page: { padding: 34, fontSize: 10, fontFamily: "Helvetica", color: "#1c1f2a" },
  top: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  identity: { flexDirection: "row", alignItems: "center" },
  logo: { width: 52, height: 52, objectFit: "contain", marginRight: 12 },
  brand: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  muted: { color: "#6b7085", marginTop: 2 },
  title: { fontSize: 22, fontFamily: "Helvetica-Bold", textAlign: "right" },
  right: { textAlign: "right", marginTop: 2 },
  box: { backgroundColor: "#f3f4fa", padding: 12, borderRadius: 4, marginBottom: 16 },
  boxLabel: { fontSize: 8, color: "#6b7085", marginBottom: 3, textTransform: "uppercase" },
  bold: { fontFamily: "Helvetica-Bold" },
  headRow: { flexDirection: "row", padding: 7 },
  catRow: { padding: 5, paddingLeft: 7, fontFamily: "Helvetica-Bold" },
  row: { flexDirection: "row", padding: 7, borderBottomWidth: 0.5, borderBottomColor: "#dfe2ee" },
  colLabel: { flex: 1, paddingRight: 10 },
  colDays: { width: 50, textAlign: "right" },
  colPrice: { width: 100, textAlign: "right" },
  note: { color: "#6b7085", fontSize: 8.5, marginTop: 2, lineHeight: 1.3 },
  totals: { marginTop: 12, alignSelf: "flex-end", width: 250 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  grand: { flexDirection: "row", justifyContent: "space-between", padding: 8, marginTop: 4, fontFamily: "Helvetica-Bold", fontSize: 12 },
  conditions: { marginTop: 18, color: "#44485a", lineHeight: 1.35 },
  signature: { marginTop: 12, borderWidth: 0.5, borderColor: "#b9bdd0", height: 60, padding: 8, width: 240, color: "#6b7085" },
  band: { marginHorizontal: -34, marginTop: -34, paddingHorizontal: 34, paddingTop: 26, paddingBottom: 22, marginBottom: 22 },
});

// Les différences entre les trois modèles, regroupées au même endroit.
function look(template, color) {
  if (template === "moderne") {
    return {
      band: { backgroundColor: color },
      onBand: { color: "#fff" },
      onBandMuted: { color: "#ffffffcc" },
      box: { backgroundColor: "#f3f4fa", borderLeftWidth: 4, borderLeftColor: color, borderRadius: 2 },
      head: { backgroundColor: "#eef0f7", color, fontFamily: "Helvetica-Bold" },
      cat: { color, borderLeftWidth: 3, borderLeftColor: color, backgroundColor: "#f7f8fc", marginTop: 6 },
      grand: { backgroundColor: color, color: "#fff", borderRadius: 6, fontSize: 13, padding: 10 },
    };
  }
  if (template === "minimal") {
    return {
      top: { borderBottomWidth: 1.5, borderBottomColor: color, paddingBottom: 14 },
      brandText: { color: "#111" },
      titleText: { color: "#9aa0b5", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, fontFamily: "Helvetica" },
      box: { backgroundColor: "#fff", padding: 0, marginBottom: 20 },
      head: { color: "#9aa0b5", fontSize: 8, textTransform: "uppercase", borderBottomWidth: 1, borderBottomColor: "#1c1f2a", paddingHorizontal: 0 },
      cat: { color, fontSize: 8.5, textTransform: "uppercase", marginTop: 12, paddingLeft: 0 },
      row: { paddingHorizontal: 0, borderBottomColor: "#ecedf2" },
      grand: { color, fontSize: 15, borderTopWidth: 1, borderTopColor: "#1c1f2a", paddingHorizontal: 0, paddingTop: 10, marginTop: 8 },
    };
  }
  // classique
  return {
    brandText: { color },
    titleText: { color },
    head: { backgroundColor: color, color: "#fff" },
    cat: { backgroundColor: "#eef0f7", color },
    grand: { backgroundColor: color, color: "#fff" },
  };
}

export default function QuotePdf({ dev, client, quote, number, dateText, validUntilText, brand }) {
  const template = brand.template || "classique";
  const color = brand.color;
  const v = look(template, color);
  const onBand = template === "moderne";

  // On regroupe les lignes par catégorie pour afficher un titre de section.
  const groups = [];
  for (const line of quote.lines) {
    const last = groups[groups.length - 1];
    if (last && last.category === line.category) last.lines.push(line);
    else groups.push({ category: line.category, lines: [line] });
  }

  const deposit = Math.round((quote.total * brand.depositPercent) / 100);

  const identity = (
    <View style={s.identity}>
      {brand.logo ? <Image src={brand.logo} style={[s.logo, onBand && { backgroundColor: "#fff", padding: 4, borderRadius: 6 }]} /> : null}
      <View>
        <Text style={[s.brand, v.brandText, onBand && v.onBand]}>{dev.name || "Développeur freelance"}</Text>
        {dev.email ? <Text style={[s.muted, onBand && v.onBandMuted]}>{dev.email}</Text> : null}
        {dev.phone ? <Text style={[s.muted, onBand && v.onBandMuted]}>{dev.phone}</Text> : null}
      </View>
    </View>
  );

  const meta = (
    <View>
      <Text style={[s.title, v.titleText, onBand && v.onBand]}>{template === "minimal" ? "Devis" : "DEVIS"}</Text>
      <Text style={[s.right, onBand && v.onBand]}>N° {number}</Text>
      <Text style={[s.right, onBand && v.onBand]}>Date : {dateText}</Text>
      <Text style={[s.right, onBand && v.onBand]}>Valable jusqu'au : {validUntilText}</Text>
    </View>
  );

  return (
    <Document title={`Devis ${number}`} author={dev.name || SITE.name}>
      <Page size="A4" style={s.page}>
        {onBand ? (
          <View style={[s.band, v.band, { flexDirection: "row", justifyContent: "space-between" }]}>
            {identity}
            {meta}
          </View>
        ) : (
          <View style={[s.top, v.top]}>
            {identity}
            {meta}
          </View>
        )}

        <View style={[s.box, v.box]}>
          <Text style={s.boxLabel}>Client</Text>
          <Text style={s.bold}>{client.name || "Client"}</Text>
          {client.project ? <Text style={s.muted}>Projet : {client.project}</Text> : null}
        </View>

        <View style={[s.headRow, v.head]}>
          <Text style={s.colLabel}>Désignation</Text>
          <Text style={s.colDays}>Jours</Text>
          <Text style={s.colPrice}>Montant</Text>
        </View>
        {groups.map((group) => (
          <View key={group.category}>
            <Text style={[s.catRow, v.cat]}>{group.category}</Text>
            {group.lines.map((line) => (
              <View style={[s.row, v.row]} key={line.id} wrap={false}>
                <View style={s.colLabel}>
                  <Text>{line.label}</Text>
                  {line.note ? <Text style={s.note}>{line.note}</Text> : null}
                </View>
                <Text style={s.colDays}>{line.days ?? "-"}</Text>
                <Text style={s.colPrice}>{formatFCFA(line.price)}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={s.totals} wrap={false}>
          {quote.discount > 0 ? (
            <View>
              <View style={s.totalRow}>
                <Text>Sous-total</Text>
                <Text>{formatFCFA(quote.subtotal)}</Text>
              </View>
              {quote.discountPercentAmount > 0 ? (
                <View style={s.totalRow}>
                  <Text>Remise ({quote.discountPercent} %)</Text>
                  <Text>{formatFCFA(-quote.discountPercentAmount)}</Text>
                </View>
              ) : null}
              {quote.discountAmount > 0 ? (
                <View style={s.totalRow}>
                  <Text>Remise commerciale</Text>
                  <Text>{formatFCFA(-quote.discountAmount)}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
          <View style={[s.grand, v.grand]}>
            <Text>TOTAL</Text>
            <Text>{formatFCFA(quote.total)}</Text>
          </View>
          {brand.depositPercent > 0 ? (
            <View>
              <View style={s.totalRow}>
                <Text>Acompte à la commande ({brand.depositPercent} %)</Text>
                <Text>{formatFCFA(deposit)}</Text>
              </View>
              <View style={s.totalRow}>
                <Text>Solde à la livraison</Text>
                <Text>{formatFCFA(quote.total - deposit)}</Text>
              </View>
            </View>
          ) : null}
        </View>

        <View wrap={false}>
          {brand.conditions ? <Text style={s.conditions}>{brand.conditions}</Text> : null}
          {brand.showSignature ? (
            <View style={s.signature}>
              <Text>Bon pour accord (date et signature du client)</Text>
            </View>
          ) : null}
        </View>
      </Page>
    </Document>
  );
}
