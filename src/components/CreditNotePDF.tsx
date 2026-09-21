import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingHorizontal: 40,
    paddingBottom: 70,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
    paddingBottom: 15,
    borderBottom: "2px solid #dc2626", // Rouge pour AVOIR
  },
  logoSection: {
    width: "45%",
  },
  logoImage: {
    width: 90,
    height: 90,
    objectFit: "contain",
    marginBottom: 8,
  },
  companyName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  companyDetails: {
    fontSize: 8,
    color: "#4b5563",
    lineHeight: 1.4,
  },
  creditNoteDetails: {
    width: "45%",
    alignItems: "flex-end",
  },
  creditNoteTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#dc2626", // Rouge distinctif AVOIR
    marginBottom: 4,
  },
  creditNoteNumber: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 6,
  },
  creditNoteDate: {
    fontSize: 9,
    color: "#4b5563",
    marginBottom: 2,
  },
  originalInvoiceBadge: {
    marginTop: 8,
    padding: 6,
    backgroundColor: "#fef2f2",
    borderRadius: 4,
    border: "1px solid #fecaca",
    alignItems: "flex-end",
  },
  originalInvoiceText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#991b1b",
  },
  addresses: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  addressBox: {
    width: "45%",
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  addressTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  clientName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  addressText: {
    fontSize: 9,
    color: "#4b5563",
    lineHeight: 1.4,
  },
  reasonBox: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#fff7ed",
    borderRadius: 4,
    border: "1px solid #ffedd5",
  },
  reasonLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#c2410c",
    marginBottom: 2,
  },
  reasonText: {
    fontSize: 9,
    color: "#9a3412",
  },
  table: {
    marginBottom: 25,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottom: "1px solid #e5e7eb",
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#374151",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottom: "1px solid #f3f4f6",
  },
  tableCell: {
    fontSize: 9,
    color: "#374151",
  },
  colDescription: { width: "50%" },
  colQty: { width: "12%", textAlign: "center" },
  colPrice: { width: "18%", textAlign: "right" },
  colTotal: { width: "20%", textAlign: "right" },
  totalsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 25,
  },
  totalsBox: {
    width: "45%",
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTop: "1px solid #e5e7eb",
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 9,
    color: "#4b5563",
  },
  totalLabelFinal: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#dc2626",
  },
  totalValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#111827",
  },
  totalValueFinal: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#dc2626",
  },
  footer: {
    position: "absolute",
    bottom: 25,
    left: 40,
    right: 40,
    borderTop: "1px solid #e5e7eb",
    paddingTop: 8,
    textAlign: "center",
  },
  footerText: {
    fontSize: 7.5,
    color: "#6b7280",
    lineHeight: 1.3,
  },
})

interface CreditNotePDFProps {
  creditNote: any
}

export function CreditNotePDF({ creditNote }: CreditNotePDFProps) {
  const { entity, client, invoice, items, refunds = [] } = creditNote
  const totalRefunded = refunds.reduce((sum: number, r: any) => sum + r.amount, 0)
  const remainingToRefund = Math.max(0, creditNote.totalTTC - totalRefunded)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Entête */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            {entity.logoPath ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={entity.logoPath} style={styles.logoImage} />
            ) : null}
            <Text style={styles.companyName}>{entity.commercialName}</Text>
            <Text style={styles.companyDetails}>
              {entity.legalName} - {entity.legalForm}
              {"\n"}SIREN: {entity.siren} {entity.rcs ? `- RCS: ${entity.rcs}` : ""}
              {"\n"}{entity.address}, {entity.postalCode} {entity.city}
              {entity.phone ? `\nTél: ${entity.phone}` : ""}
              {entity.email ? ` - Email: ${entity.email}` : ""}
            </Text>
          </View>

          <View style={styles.creditNoteDetails}>
            <Text style={styles.creditNoteTitle}>AVOIR</Text>
            <Text style={styles.creditNoteNumber}>{creditNote.number}</Text>
            <Text style={styles.creditNoteDate}>
              Date : {new Date(creditNote.date).toLocaleDateString("fr-FR")}
            </Text>
            <View style={styles.originalInvoiceBadge}>
              <Text style={styles.originalInvoiceText}>
                Avoir relatif à la facture : {invoice.number}
              </Text>
              <Text style={{ fontSize: 7.5, color: "#7f1d1d", marginTop: 2 }}>
                Émise le {new Date(invoice.date).toLocaleDateString("fr-FR")} (Montant initial : {invoice.totalTTC.toFixed(2)} €)
              </Text>
            </View>
          </View>
        </View>

        {/* Adresses */}
        <View style={styles.addresses}>
          <View style={styles.addressBox}>
            <Text style={styles.addressTitle}>Émetteur</Text>
            <Text style={styles.clientName}>{entity.commercialName}</Text>
            <Text style={styles.addressText}>
              {entity.address}
              {"\n"}{entity.postalCode} {entity.city}
            </Text>
          </View>

          <View style={styles.addressBox}>
            <Text style={styles.addressTitle}>Destinataire / Client</Text>
            <Text style={styles.clientName}>
              {client.company || (client.firstName ? `${client.firstName} ${client.lastName}` : client.lastName)}
            </Text>
            <Text style={styles.addressText}>
              {client.address || ""}
              {client.postalCode || client.city ? `\n${client.postalCode || ""} ${client.city || ""}` : ""}
              {client.email ? `\nEmail: ${client.email}` : ""}
              {client.phone ? `\nTél: ${client.phone}` : ""}
            </Text>
          </View>
        </View>

        {/* Motif de l'avoir */}
        <View style={styles.reasonBox}>
          <Text style={styles.reasonLabel}>Motif de l&apos;avoir : {creditNote.reason}</Text>
          {creditNote.reasonDetails && (
            <Text style={styles.reasonText}>{creditNote.reasonDetails}</Text>
          )}
        </View>

        {/* Tableau des lignes de l'avoir */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDescription]}>Désignation</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qté</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>P.U. HT</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total TTC</Text>
          </View>

          {items && items.length > 0 ? (
            items.map((item: any, index: number) => (
              <View key={item.id || index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colDescription]}>{item.description}</Text>
                <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, styles.colPrice]}>{item.unitPriceHT.toFixed(2)} €</Text>
                <Text style={[styles.tableCell, styles.colTotal]}>-{item.totalTTC.toFixed(2)} €</Text>
              </View>
            ))
          ) : (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colDescription]}>
                Avoir sur prestation - Réf facture {invoice.number}
              </Text>
              <Text style={[styles.tableCell, styles.colQty]}>1</Text>
              <Text style={[styles.tableCell, styles.colPrice]}>{creditNote.amountHT.toFixed(2)} €</Text>
              <Text style={[styles.tableCell, styles.colTotal]}>-{creditNote.totalTTC.toFixed(2)} €</Text>
            </View>
          )}
        </View>

        {/* Totaux & Remboursement */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total HT crédité</Text>
              <Text style={styles.totalValue}>-{creditNote.amountHT.toFixed(2)} €</Text>
            </View>
            {creditNote.tvaAmount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TVA ({creditNote.tvaRate}%)</Text>
                <Text style={styles.totalValue}>-{creditNote.tvaAmount.toFixed(2)} €</Text>
              </View>
            )}
            <View style={styles.totalRowFinal}>
              <Text style={styles.totalLabelFinal}>TOTAL AVOIR TTC</Text>
              <Text style={styles.totalValueFinal}>-{creditNote.totalTTC.toFixed(2)} €</Text>
            </View>

            {/* Suivi trésorerie / remboursement */}
            <View style={{ marginTop: 8, paddingTop: 6, borderTop: "1px dashed #e5e7eb" }}>
              <View style={styles.totalRow}>
                <Text style={{ fontSize: 8, color: "#6b7280" }}>Montant remboursé :</Text>
                <Text style={{ fontSize: 8, fontWeight: "bold", color: "#059669" }}>
                  {totalRefunded.toFixed(2)} €
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={{ fontSize: 8, color: "#6b7280" }}>Reste à rembourser :</Text>
                <Text style={{ fontSize: 8, fontWeight: "bold", color: remainingToRefund > 0 ? "#b91c1c" : "#4b5563" }}>
                  {remainingToRefund.toFixed(2)} €
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Pied de page légal */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {entity.tvaMention || "TVA non applicable - article 293 B du CGI"}
          </Text>
          <Text style={styles.footerText}>
            Document comptable d&apos;avoir émis par {entity.legalName} ({entity.siren})
          </Text>
        </View>
      </Page>
    </Document>
  )
}

