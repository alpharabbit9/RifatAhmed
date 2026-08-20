import { NotchNavbar } from "@/components/ui";
import { HeroSection } from "@/features/hero/hero-section";
import { AboutSection } from "@/features/about/about-section";
import { ProjectsSection } from "@/features/projects/projects-section";
import { ContactSection } from "@/features/contact/contact-section";
import { FooterSection } from "@/features/footer/footer-section";

export default function Home() {
  return (
    <>
      <main className="min-h-screen bg-background">
        <NotchNavbar />
        <HeroSection />
        <AboutSection />
        <ProjectsSection />
        {/* Sections 5–6 (Career, Services) slot in here. */}
        <ContactSection />
      </main>
      <FooterSection />
    </>
  );
}
