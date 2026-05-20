import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer"

Font.register({
  family: "Helvetica",
  fonts: [
    { src: "https://fonts.gstatic.com/s/helvetica/v1/Helvetica.ttf" },
    { src: "https://fonts.gstatic.com/s/helvetica/v1/Helvetica-Bold.ttf", fontWeight: "bold" },
  ],
})

const termsNotice =
  "Le paiement de cette facture ou d'une partie de la facture vaut consentement à nos conditions générales de vente. Aucune annulation ou remboursement n'est autorisé."

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
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: "2px solid #2563eb",
  },
  logoSection: {
    width: "45%",
  },
  logoPlaceholder: {
    width: 120,
    height: 50,
    backgroundColor: "#2563eb",
    borderRadius: 4,
    marginBottom: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  logoImage: {
    width: 155,
    height: 100,
    objectFit: "contain" as const,
    marginBottom: 8,
  },
  invoiceInfo: {
    width: "45%",
    alignItems: "flex-end",
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2563eb",
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 12,
    marginBottom: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#2563eb",
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: 4,
  },
  entityInfo: {
    marginBottom: 4,
  },
  entityName: {
    fontWeight: "bold",
    fontSize: 11,
  },
  entityDetail: {
    fontSize: 9,
    color: "#4b5563",
  },
  clientInfo: {
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 4,
  },
  table: {
    width: "100%",
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    padding: 8,
    fontWeight: "bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottom: "1px solid #e5e7eb",
    fontSize: 9,
  },
  tableRowAlt: {
    backgroundColor: "#f9fafb",
  },
  col1: { width: "45%" },
  col2: { width: "15%", textAlign: "right" as const },
  col3: { width: "20%", textAlign: "right" as const },
  col4: { width: "20%", textAlign: "right" as const },
  totals: {
    marginTop: 20,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 200,
    padding: 4,
    fontSize: 10,
  },
  totalRowBold: {
    fontWeight: "bold",
    fontSize: 12,
    borderTop: "2px solid #2563eb",
    paddingTop: 8,
    marginTop: 4,
  },
  paymentInfo: {
    marginTop: 30,
    padding: 12,
    backgroundColor: "#f0f9ff",
    borderRadius: 4,
    border: "1px solid #bae6fd",
  },
  paymentTitle: {
    fontWeight: "bold",
    fontSize: 10,
    marginBottom: 6,
  },
  paymentDetail: {
    fontSize: 9,
    marginBottom: 2,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#6b7280",
    borderTop: "1px solid #e5e7eb",
    paddingTop: 10,
  },
  footerNotice: {
    marginTop: 4,
    fontSize: 7,
    color: "#4b5563",
  },
  tvaMention: {
    fontSize: 9,
    fontStyle: "italic",
    color: "#4b5563",
    marginTop: 10,
  },
  periodInfo: {
    fontSize: 9,
    backgroundColor: "#fef3c7",
    padding: 6,
    borderRadius: 4,
    marginBottom: 10,
  },
})

export interface InvoicePDFProps {
  logoSrc?: string
  invoice: {
    number: string
    date: string
    periodStart?: string | null
    periodEnd?: string | null
    description: string
    quantity: number
    amountHT: number
    tvaRate: number
    tvaAmount: number
    totalTTC: number
    paymentMethod: string
    paymentLink?: string | null
    notes?: string | null
    entity: {
      legalName: string
      commercialName: string
      legalForm: string
      siren: string
      siret?: string | null
      rcs?: string | null
      capital?: string | null
      address: string
      postalCode: string
      city: string
      phone?: string | null
      email?: string | null
      website?: string | null
      apeCode?: string | null
      tvaMention: string
      bankName: string
      bankIban: string
      bankBic: string
      bankHolder: string
      paymentMethods: string
    }
    client: {
      lastName: string
      firstName?: string | null
      company?: string | null
      email?: string | null
      phone?: string | null
      address?: string | null
      postalCode?: string | null
      city?: string | null
    }
  }
}

export function InvoicePDF({ invoice, logoSrc }: InvoicePDFProps) {
  const { entity, client } = invoice

  const formatPaymentMethod = (method: string) => {
    const methods: Record<string, string> = {
      virement: "Virement bancaire",
      especes: "Espèces",
      "cb-stripe": "CB via Stripe",
      "cb-revolut": "CB via Revolut Pro",
    }
    return methods[method] || method
  }

  const showBankInfo = invoice.paymentMethod === "virement"

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoSection}>
            {logoSrc ? (
              <Image src={logoSrc} style={styles.logoImage} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoText}>{entity.commercialName}</Text>
              </View>
            )}
          </View>
          <View style={styles.invoiceInfo}>
            <Text style={styles.invoiceTitle}>FACTURE</Text>
            <Text style={styles.invoiceNumber}>N° {invoice.number}</Text>
            <Text style={{ fontSize: 10 }}>
              Date: {new Date(invoice.date).toLocaleDateString("fr-FR")}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={{ flexDirection: "row", gap: 40 }}>
            <View style={{ width: "45%" }}>
              <Text style={styles.sectionTitle}>Émetteur</Text>
              <Text style={styles.entityName}>{entity.legalName}</Text>
              <Text style={styles.entityDetail}>{entity.commercialName}</Text>
              <Text style={styles.entityDetail}>{entity.legalForm}</Text>
              <Text style={styles.entityDetail}>
                {entity.address}, {entity.postalCode} {entity.city}
              </Text>
              {entity.rcs && (
                <Text style={styles.entityDetail}>RCS {entity.rcs} - SIREN {entity.siren}</Text>
              )}
              {entity.siret && <Text style={styles.entityDetail}>SIRET {entity.siret}</Text>}
              {entity.capital && <Text style={styles.entityDetail}>Capital social: {entity.capital} €</Text>}
              {entity.apeCode && <Text style={styles.entityDetail}>Code APE: {entity.apeCode}</Text>}
            </View>
            <View style={{ width: "45%" }}>
              <Text style={styles.sectionTitle}>Facturé à</Text>
              <View style={styles.clientInfo}>
                <Text style={styles.entityName}>
                  {client.firstName ? `${client.firstName} ${client.lastName}` : client.lastName}
                </Text>
                {client.company && <Text style={styles.entityDetail}>{client.company}</Text>}
                {client.address && (
                  <Text style={styles.entityDetail}>
                    {client.address}
                    {client.postalCode ? `, ${client.postalCode}` : ""}
                    {client.city ? ` ${client.city}` : ""}
                  </Text>
                )}
                {client.email && <Text style={styles.entityDetail}>{client.email}</Text>}
                {client.phone && <Text style={styles.entityDetail}>{client.phone}</Text>}
              </View>
            </View>
          </View>
        </View>

        {invoice.periodStart && invoice.periodEnd && (
          <View style={styles.periodInfo}>
            <Text style={{ fontWeight: "bold" }}>Période de séjour:</Text>
            <Text>
              Du {new Date(invoice.periodStart).toLocaleDateString("fr-FR")} au{" "}
              {new Date(invoice.periodEnd).toLocaleDateString("fr-FR")}
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prestation</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.col1}>Description</Text>
              <Text style={styles.col2}>Qté</Text>
              <Text style={styles.col3}>Montant HT</Text>
              <Text style={styles.col4}>TVA</Text>
            </View>
            <View style={[styles.tableRow, styles.tableRowAlt]}>
              <Text style={styles.col1}>{invoice.description}</Text>
              <Text style={styles.col2}>{invoice.quantity}</Text>
              <Text style={styles.col3}>{invoice.amountHT.toFixed(2)} €</Text>
              <Text style={styles.col4}>0.00 €</Text>
            </View>
          </View>
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Total HT</Text>
            <Text>{invoice.amountHT.toFixed(2)} €</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>TVA (0%)</Text>
            <Text>0.00 €</Text>
          </View>
          <View style={[styles.totalRow, styles.totalRowBold]}>
            <Text>Total à payer</Text>
            <Text>{invoice.totalTTC.toFixed(2)} €</Text>
          </View>
        </View>

        <Text style={styles.tvaMention}>{entity.tvaMention}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Modalités de paiement</Text>
          <Text style={{ fontSize: 10 }}>
            Moyen de paiement: {formatPaymentMethod(invoice.paymentMethod)}
          </Text>
          {invoice.paymentLink && (
            <Text style={{ fontSize: 10, color: "#2563eb" }}>
              Lien de paiement: {invoice.paymentLink}
            </Text>
          )}
        </View>

        {showBankInfo && (
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentTitle}>Coordonnées bancaires</Text>
            <Text style={styles.paymentDetail}>Banque: {entity.bankName}</Text>
            <Text style={styles.paymentDetail}>Titulaire: {entity.bankHolder}</Text>
            <Text style={styles.paymentDetail}>IBAN: {entity.bankIban}</Text>
            <Text style={styles.paymentDetail}>BIC: {entity.bankBic}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text>
            {entity.legalName} - {entity.legalForm} - SIREN {entity.siren}
            {entity.rcs ? ` - RCS ${entity.rcs}` : ""}
          </Text>
          <Text>
            {entity.address}, {entity.postalCode} {entity.city}
          </Text>
          <Text style={styles.footerNotice}>
            Nos conditions générales de vente sont disponibles sur le site omrayanair.com.
          </Text>
          <Text style={styles.footerNotice}>{termsNotice}</Text>
        </View>
      </Page>
    </Document>
  )
}
