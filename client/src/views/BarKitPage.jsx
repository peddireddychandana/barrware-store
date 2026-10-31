import PageShell from "@/components/PageShell";
import PageHeading from "@/components/PageHeading";
import BarKitBuilder from "@/components/BarKitBuilder";

const BarKitPage = () => (
  <PageShell>
    <PageHeading
      title="BUILD YOUR"
      highlight="BAR KIT"
      subtitle="Pick one tool for each step. The more you add, the more you save."
    />
    <BarKitBuilder />
  </PageShell>
);

export default BarKitPage;
