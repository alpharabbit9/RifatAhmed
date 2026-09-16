import { NotchNavbar } from "@/components/ui";
import { HeroSection } from "@/features/hero/hero-section";
import { SiteLogo } from "@/features/hero/site-logo";
import { AboutSection } from "@/features/about/about-section";
import { ProjectsSection } from "@/features/projects/projects-section";
import { CareerSection } from "@/features/career/career-section";
import { ServicesSection } from "@/features/services/services-section";
import { ContactSection } from "@/features/contact/contact-section";
import { getContactDetails } from "@/features/contact/data";
import { FooterSection } from "@/features/footer/footer-section";

export default async function Home() {
  // The contact section is a Client Component (it owns the form), so its
  // details are read here and passed down. The footer reads its own copy —
  // it renders on routes this page knows nothing about.
  const contact = await getContactDetails();

  return (
    <>
      <main className="min-h-screen bg-background">
        <NotchNavbar logo={<SiteLogo />} />
        <HeroSection />
        <AboutSection />
        <ProjectsSection />
        <CareerSection />
        <ServicesSection />
        <ContactSection
          email={contact.email}
          phone={contact.phone}
          location={contact.location}
          availabilityLabel={contact.availability_label}
        />
      </main>
      <FooterSection />
    </>
  );
}
