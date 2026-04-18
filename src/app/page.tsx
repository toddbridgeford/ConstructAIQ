import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import Stats from '@/components/Stats';
import Features from '@/components/Features';
import DataSources from '@/components/DataSources';
import Pricing from '@/components/Pricing';
import Footer from '@/components/Footer';

export default function LandingPage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Stats />
        <Features />
        <DataSources />
        <Pricing />
      </main>
      <Footer />
    </>
  );
}
