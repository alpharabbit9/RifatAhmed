import { NotchNavbar } from "@/components/ui";
import { HeroSection } from "@/features/hero/hero-section";
import { SiteLogo } from "@/features/hero/site-logo";
import { AboutSection } from "@/features/about/about-section";
import { ProjectsSection } from "@/features/projects/projects-section";
import { CareerSection } from "@/features/career/career-section";
import { ServicesSection } from "@/features/services/services-section";
import { ContactSection } from "@/features/contact/contact-section";
import { FooterSection } from "@/features/footer/footer-section";

export default function Home() {
  return (
    <>
      <main className="min-h-screen bg-background">
        <NotchNavbar logo={<SiteLogo />} />
        <HeroSection />
        <AboutSection />
        <ProjectsSection />
        <CareerSection />
        <ServicesSection />
        <ContactSection />
      </main>
      <FooterSection />
    </>
  );
}
