"use client"
import { useState } from "react"
import { NationalPermitSummary } from "../components/NationalPermitSummary"
import { CityPermitMap, type PermitApiResponse } from "../components/CityPermitMap"
import { SectionHeader } from "../components/SectionHeader"
import { Skeleton } from "@/app/components/Skeleton"

interface Props {
  data: PermitApiResponse | null
}

export function PermitsSection({ data }: Props) {
  const [selectedCity, setSelectedCity] = useState<string | null>(null)

  return (
    <section id="permits" style={{ paddingTop: 48, paddingBottom: 8 }}>
      <SectionHeader
        sectionId="06"
        title="City Permit Intelligence"
        subtitle="Building permit activity across 12 major US cities"
        badge="12 CITIES"
        live
      />

      {!data ? (
        <Skeleton height={480} borderRadius={16} />
      ) : (
        <>
          <NationalPermitSummary national={data.national_total} />
          <div style={{ marginTop: 20 }}>
            <CityPermitMap
              data={data}
              selectedCity={selectedCity}
              onCitySelect={setSelectedCity}
            />
          </div>
        </>
      )}
    </section>
  )
}
