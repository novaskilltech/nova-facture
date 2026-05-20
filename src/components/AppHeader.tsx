"use client"

import Image from "next/image"
import Link from "next/link"

interface AppHeaderLink {
  href: string
  label: string
}

interface BrandLogoProps {
  centered?: boolean
  iconOnly?: boolean
  size?: number
  subtitleClassName?: string
  titleClassName?: string
}

export function BrandLogo({
  centered = false,
  iconOnly = false,
  size = 40,
  subtitleClassName = "text-[10px] uppercase tracking-wider text-slate-400 font-bold",
  titleClassName = "text-lg font-extrabold text-slate-900 tracking-tight",
}: BrandLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${centered ? "justify-center text-center" : ""}`}>
      <div className="relative flex items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 shadow-md shadow-blue-500/10">
        <Image
          src="/omra-facturation-logo.png"
          alt="Logo Omra"
          width={size}
          height={size}
          className="h-7 w-7 object-contain brightness-0 invert"
          priority
          onError={(e) => {
            // Remplacement vectoriel élégant en cas d'erreur de chargement d'image
            e.currentTarget.style.display = 'none';
          }}
        />
        <span className="font-extrabold text-white text-sm tracking-tighter">OF</span>
      </div>
      {!iconOnly && (
        <div className="leading-tight">
          <p className={titleClassName}>Omra Facturation</p>
          <p className={subtitleClassName}>Conciergerie & Horizon</p>
        </div>
      )}
    </div>
  )
}

export function AppHeader({ links }: { links: AppHeaderLink[] }) {
  const navigationLinks = [{ href: "/dashboard", label: "Tableau de bord" }, ...links]

  return (
    <nav className="sticky top-0 z-50 w-full glass-effect transition-premium shadow-premium">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-3.5">
        <Link href="/dashboard" className="transition-premium hover:opacity-90">
          <BrandLogo
            iconOnly={false}
            titleClassName="text-base font-extrabold text-slate-900 tracking-tight sm:text-lg"
            subtitleClassName="hidden text-[10px] uppercase tracking-wider text-slate-400 font-bold sm:block"
          />
        </Link>
        
        <div className="flex min-w-0 items-center gap-3 sm:gap-6">
          <div className="hidden sm:flex items-center gap-1.5 text-sm font-medium">
            {navigationLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-premium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 border-l border-slate-200 pl-3 sm:gap-3 sm:pl-6">
            <form action="/api/auth/logout" method="POST">
              <button 
                type="submit" 
                className="rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50/50 hover:text-rose-700 cursor-pointer transition-premium sm:px-3.5 sm:py-1.5 sm:text-sm"
              >
                Déconnexion
              </button>
            </form>
            
            {/* Avatar Collaborateur minimaliste et élégant */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-[11px] font-bold text-white shadow-inner">
              OC
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-200/70 px-4 pb-3 sm:hidden">
        <div className="flex gap-2 overflow-x-auto pt-3 text-sm font-semibold">
          {navigationLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="shrink-0 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-slate-700 shadow-premium transition-premium hover:border-slate-300 hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
