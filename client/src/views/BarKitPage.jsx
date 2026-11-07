import PageShell from "@/components/PageShell";
import PageHeading from "@/components/PageHeading";
import BarKitBuilder from "@/components/BarKitBuilder";
import SEOHead from "@/components/SEOHead";

const BarKitPage = () => (
  <PageShell>
    <SEOHead
      title="Custom Bar Kit Builder | VYRNT Fine Barware"
      description="Build your own bar kit with VYRNT. Pick a shaker, strainer, jigger, muddler, spoon and pourer, and save up to 15% as your kit grows."
      path="/custom-bar-kit-builder"
    />
    <PageHeading
      title="BUILD YOUR"
      highlight="BAR KIT"
      subtitle="Pick one tool for each step. The more you add, the more you save."
    />
    <BarKitBuilder />
  </PageShell>
);

export default BarKitPage;
