import type { Metadata } from "next";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";

export const metadata: Metadata = { title: "Privacy & terms · Coroscope" };

export default function LegalPage() {
  return (
    <main className="min-h-dvh bg-paper text-ink">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-4 py-14 text-sm leading-7 text-ink-2 sm:px-5">
        <p className="eyebrow">Coroscope · research prototype</p>
        <h1 className="mt-4 text-3xl font-semibold text-ink">Privacy &amp; terms</h1>
        <p className="mt-2 text-ink-3">Effective October 2026</p>

        <h2 className="mt-10 text-lg font-medium text-ink">Privacy</h2>
        <p className="mt-3">Values entered in the assessment are sent to the prediction API, used to compute the result, and discarded. The API keeps no database or logs of patient values. The latest result stays in your browser&rsquo;s session storage until you close the tab, so the results and report pages survive a refresh.</p>
        <p className="mt-3">Do not enter names, medical record numbers or other directly identifying information. The patient name field is only printed on the report and is never sent to the model.</p>

        <h2 className="mt-10 text-lg font-medium text-ink">Terms of use</h2>
        <p className="mt-3">Coroscope is for decision support and educational purposes only. It is not a medical device, a diagnosis or medical advice, and it is not a substitute for formal diagnostic imaging (such as coronary angiography or CT angiography) or qualified clinical judgement. Never use it for emergency decisions.</p>
        <p className="mt-3">The models were trained on 303 patients from a single centre (the Z-Alizadeh Sani dataset) and have not been externally validated. The 3D heart is a generic anatomical model, not a reconstruction of the patient&rsquo;s anatomy.</p>

        <h2 className="mt-10 text-lg font-medium text-ink">Data &amp; asset credits</h2>
        <p className="mt-3">Z-Alizadeh Sani dataset, UCI Machine Learning Repository, licensed CC BY 4.0. See the project README for the 3D model credit and all open-source licences.</p>
      </article>
      <SiteFooter />
    </main>
  );
}
