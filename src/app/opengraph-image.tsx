import { ImageResponse } from "next/og"

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background:
            "linear-gradient(135deg, #fffaf1 0%, #ffffff 45%, #f5f7f7 100%)",
          color: "#123f3c",
          fontFamily: "sans-serif",
          padding: "48px",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            borderRadius: "36px",
            border: "2px solid rgba(196, 152, 44, 0.18)",
            background: "rgba(255, 255, 255, 0.92)",
            boxShadow: "0 24px 70px rgba(18, 63, 60, 0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              flex: 1,
              padding: "56px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "108px",
                  height: "108px",
                  borderRadius: "28px",
                  background:
                    "linear-gradient(160deg, rgba(18, 63, 60, 1) 0%, rgba(18, 63, 60, 0.92) 58%, rgba(196, 152, 44, 1) 58%, rgba(214, 171, 59, 1) 100%)",
                  color: "#fffaf1",
                  fontSize: "54px",
                  fontWeight: 700,
                  letterSpacing: "-0.05em",
                }}
              >
                OF
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: 600,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "#c4982c",
                  }}
                >
                  Omra Facturation
                </div>
                <div
                  style={{
                    fontSize: "20px",
                    color: "rgba(18, 63, 60, 0.72)",
                  }}
                >
                  La Conciergerie & Horizon Solutions
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "18px",
                maxWidth: "720px",
              }}
            >
              <div
                style={{
                  fontSize: "72px",
                  lineHeight: 1.05,
                  fontWeight: 800,
                  letterSpacing: "-0.06em",
                }}
              >
                Gestion de facturation claire, rapide et elegante.
              </div>
              <div
                style={{
                  fontSize: "28px",
                  lineHeight: 1.4,
                  color: "rgba(18, 63, 60, 0.78)",
                }}
              >
                Tableau de bord, creation de factures, gestion des payeurs et des societes
                dans une interface centralisee.
              </div>
            </div>
          </div>

          <div
            style={{
              width: "280px",
              background:
                "linear-gradient(180deg, rgba(18, 63, 60, 1) 0%, rgba(27, 82, 78, 1) 100%)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: "20px",
              color: "white",
            }}
          >
            <div
              style={{
                display: "flex",
                width: "160px",
                height: "160px",
                borderRadius: "999px",
                border: "10px solid rgba(255, 255, 255, 0.14)",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "64px",
                fontWeight: 700,
                background: "rgba(255, 255, 255, 0.06)",
              }}
            >
              €
            </div>
            <div
              style={{
                display: "flex",
                fontSize: "24px",
                fontWeight: 600,
                color: "#f7df9a",
              }}
            >
              Facturation
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  )
}

