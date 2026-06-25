import { createFileRoute } from "@tanstack/react-router";
import { PromoBar } from "@/components/landing/PromoBar";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Steps } from "@/components/landing/Steps";
import { PainPoints } from "@/components/landing/PainPoints";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { Testimonials } from "@/components/landing/Testimonials";
import { ComparisonTable } from "@/components/landing/ComparisonTable";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import { WhatsAppFAB } from "@/components/landing/WhatsAppFAB";
import { Reveal } from "@/components/landing/Reveal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lovable Ultra Chat — Domine o Lovable sem limites" },
      {
        name: "description",
        content:
          "Extensão Chrome que destrava o Lovable: chat ilimitado sem queimar créditos, edição visual, comandos por voz e skills premium.",
      },
      {
        property: "og:title",
        content: "Lovable Ultra Chat — Domine o Lovable sem limites",
      },
      {
        property: "og:description",
        content:
          "Chat ilimitado, edição visual, comandos por voz e skills premium para criadores no Lovable.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PromoBar />
      <Navbar />
      <main>
        <Hero />
        <Reveal variant="fade-up"><Steps /></Reveal>
        <Reveal variant="fade-up"><PainPoints /></Reveal>
        <Reveal variant="zoom"><Features /></Reveal>
        <Reveal variant="fade-up"><Pricing /></Reveal>
        <Reveal variant="slide-left"><Testimonials /></Reveal>
        <Reveal variant="fade-up"><ComparisonTable /></Reveal>
        <Reveal variant="fade-up"><FAQ /></Reveal>
        <Reveal variant="zoom"><FinalCTA /></Reveal>
      </main>
      <Footer />
      <WhatsAppFAB />
    </div>
  );
}
